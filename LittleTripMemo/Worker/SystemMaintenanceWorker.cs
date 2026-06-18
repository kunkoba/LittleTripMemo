using LittleTripMemo.Common;
using LittleTripMemo.Configs;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Batch;
using Microsoft.Extensions.Options;
using Serilog.Context;

namespace LittleTripMemo.Worker;

public class SystemMaintenanceWorker : BackgroundService
{
    private readonly ILogger<SystemMaintenanceWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    // ★ IOptions ではなく IOptionsMonitor を使用（リアルタイム監視用）
    private readonly IOptionsMonitor<MyAppSettings> _optionsMonitor;

    private DateTime _nextReactionUpdateTime;
    private DateTime _nextMaintenanceTime;

    public SystemMaintenanceWorker(
        ILogger<SystemMaintenanceWorker> logger,
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<MyAppSettings> optionsMonitor)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _optionsMonitor = optionsMonitor;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("--- システムメンテナンス・バッチを稼働中 ---");

        // 初回実行予定を現在時刻にセット
        _nextReactionUpdateTime = DateTime.Now;
        _nextMaintenanceTime = DateTime.Now;

        while (!stoppingToken.IsCancellationRequested)
        {
            using (LogContext.PushProperty("CorrelationId", Guid.NewGuid().ToString()[..8]))
            {
                // リアクション件数の再集計
                await TaskUpdateReactionCountsAsync();
                // テーブル統計の集計と管理テーブルの更新
                await TaskUpdateTableStatisticsAsync();
            }

            // 心拍（1分待機）
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

#region "共通基盤"

    /// <summary>
    /// タスク実行
    /// </summary>
    /// <param name="taskName"></param>
    /// <param name="action"></param>
    /// <returns></returns>
    private async Task RunWithScopeAsync(string taskName, Func<IServiceScope, Task> action)
    {
        try
        {
            _logger.LogInformation("【{TaskName}】を開始します...", taskName);
            using (var scope = _scopeFactory.CreateScope())
            {
                await action(scope);
            }
            _logger.LogInformation("【{TaskName}】を完了しました。", taskName);
        }
        catch (Exception ex)
        {
            var msg = (ex is Npgsql.PostgresException pgEx) ? pgEx.MessageText : ex.Message;
            _logger.LogError("【{TaskName}失敗】{Type}: {Msg}", taskName, ex.GetType().Name, msg);
        }
    }

#endregion

#region "各タスクの判定・実行・更新"

    /// <summary>
    /// リアクション数の再集計タスク
    /// </summary>
    /// <returns></returns>
    private async Task TaskUpdateReactionCountsAsync()
    {
        // 都度、設定値をチェック
        var settings = _optionsMonitor.CurrentValue;
        if (settings.ReactionCountUpdateIntervalMinutes <= 0)
        {
            _logger.LogWarning("【設定警告】ReactionCountUpdateIntervalMinutes が不正なためスキップします。");
            return;
        }

        var now = DateTime.Now;

        if (now >= _nextReactionUpdateTime)
        {
            await RunWithScopeAsync("リアクション再集計", async (scope) =>
            {
                var repo = scope.ServiceProvider.GetRequiredService<DetailPubRepository>();
                await repo.UpdateAllReactionCountsAsync();
            });

            // 3. 次回予定の計算（この時点の最新設定値を使って AddMinutes する）
            _nextReactionUpdateTime = now.AddMinutes(settings.ReactionCountUpdateIntervalMinutes);
        }
    }

    /// <summary>
    /// 各テーブルのレコード数・ユーザー数を集計して管理テーブルを更新する
    /// </summary>
    private async Task TaskUpdateTableStatisticsAsync()
    {
        var settings = _optionsMonitor.CurrentValue;
        var now = DateTime.Now;

        // 設定値チェック
        if (settings.SystemMaintenanceIntervalMinutes <= 0 || settings.MaxTableNum <= 0) return;

        if (now >= _nextMaintenanceTime)
        {
            await RunWithScopeAsync("テーブル統計集計", async (scope) =>
            {
                var repo = scope.ServiceProvider.GetRequiredService<TableStatisticsTaskRepository>();

                // 設定されている最大テーブル数分、ループして集計を実行
                for (int i = 1; i <= settings.MaxTableNum; i++)
                {
                    // レコードがなければ作成、あれば更新
                    await repo.EnsureManagerRecordExistsAsync(i);
                    await repo.SyncStatisticsAsync(i);
                }
            });
            // 次回予定を更新
            _nextMaintenanceTime = now.AddMinutes(settings.SystemMaintenanceIntervalMinutes);
        }
    }

#endregion

}