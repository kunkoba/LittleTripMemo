using LittleTripMemo.Common;
using LittleTripMemo.Configs;
using LittleTripMemo.Repository;
using Microsoft.Extensions.Options;
using Serilog.Context;

namespace LittleTripMemo.Worker;

public class SystemMaintenanceWorker : BackgroundService
{
    private readonly ILogger<SystemMaintenanceWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly MyAppSettings _settings;

    // 各タスクの「次回実行予定時刻」を保持する変数
    private DateTime _nextReactionUpdateTime;
    private DateTime _nextMaintenanceTime;

    public SystemMaintenanceWorker(
        ILogger<SystemMaintenanceWorker> logger,
        IServiceScopeFactory scopeFactory,
        IOptions<MyAppSettings> settings)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _settings = settings.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("--- システムメンテナンス・バッチを起動しました ---");

        try
        {
            // 次回実行時刻の初期化（起動直後に1回目が動くように設定）
            _nextReactionUpdateTime = DateTime.Now;
            _nextMaintenanceTime = DateTime.Now;

            // アプリ終了まで 1分間隔のループ（ハートビート）を開始
            while (!stoppingToken.IsCancellationRequested)
            {
                // サイクルごとに相関IDを発番
                using (LogContext.PushProperty("CorrelationId", Guid.NewGuid().ToString()[..8]))
                {
                    // 関数を呼ぶだけ（判定も更新も関数内で完結）
                    await TaskUpdateReactionCountsAsync();
                    await TaskSystemMaintenanceAsync();
                }

                // 1分間待機（心拍）
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
        catch (Exception ex)
        {
            // 設定エラーや致命的なクラッシュ時にここを通る
            _logger.LogCritical(ex, "【致命的エラー】メンテナンス・バッチが異常終了しました。");
        }

        _logger.LogInformation("--- システムメンテナンス・バッチを終了しました ---");
    }

    /// <summary>
    /// 窓口の生成とログ・エラー管理の共通枠
    /// </summary>
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

    /// <summary>
    /// リアクション集計タスクの実行判定と実行
    /// </summary>
    private async Task TaskUpdateReactionCountsAsync()
    {
        var now = DateTime.Now;

        if (now >= _nextReactionUpdateTime)
        {
            await RunWithScopeAsync("リアクション再集計", async (scope) =>
            {
                var repo = scope.ServiceProvider.GetRequiredService<DetailPubRepository>();
                await repo.UpdateAllReactionCountsAsync();
            });

            // 実行後に次回予定を更新
            _nextReactionUpdateTime = now.AddMinutes(_settings.ReactionCountUpdateIntervalMinutes);
        }
    }

    /// <summary>
    /// システムメンテナンス（ゴミ掃除など）の実行判定と実行
    /// </summary>
    private async Task TaskSystemMaintenanceAsync()
    {
        var now = DateTime.Now;

        if (now >= _nextMaintenanceTime)
        {
            await RunWithScopeAsync("システムメンテナンス", async (scope) =>
            {
                _logger.LogInformation("（ダミー処理）論理削除データのクリーンアップ等実行中...");
                await Task.CompletedTask;
            });

            // 実行後に次回予定を更新
            _nextMaintenanceTime = now.AddMinutes(_settings.SystemMaintenanceIntervalMinutes);
        }
    }

}