using LittleTripMemo.Common;
using LittleTripMemo.Configs;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Batch;
using LittleTripMemo.Repository.Core;
using Microsoft.Extensions.Options;
using Serilog.Context;
using System.Text.Json;
using static Dapper.SqlMapper;

namespace LittleTripMemo.Worker;

public class SystemMaintenanceWorker : BackgroundService
{
    private readonly ILogger<SystemMaintenanceWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptionsMonitor<MyAppSettings> _optionsMonitor;
    private readonly SystemStatus _systemStatus; // シングルトンの参照保持

    // 各タスクの次回予定時刻
    private DateTime _nextReactionUpdateTime;
    private DateTime _nextTableStatsUpdateTime;
    private DateTime _nextGarbageCleanupTime;
    private DateTime _nextClickAggregateTime;
    private DateTime _nextDailyMaintenanceTime;
    private string _lastDailyMaintenanceTimeSetting;

    public SystemMaintenanceWorker(
        ILogger<SystemMaintenanceWorker> logger,
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<MyAppSettings> optionsMonitor,
        SystemStatus systemStatus)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _optionsMonitor = optionsMonitor;
        _systemStatus = systemStatus;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("--- システムメンテナンス・バッチを稼働中 ---");

        // 初期設定の取得
        var settings = _optionsMonitor.CurrentValue;

        // 初回実行予定をセット
        _nextReactionUpdateTime = DateTime.Now;
        _nextTableStatsUpdateTime = DateTime.Now;
        _nextGarbageCleanupTime = DateTime.Now;
        _nextClickAggregateTime = DateTime.Now;

        // 定時実行の初回予定計算
        _nextDailyMaintenanceTime = CalculateNextRunTime(settings.DailyMaintenanceTime);
        _lastDailyMaintenanceTimeSetting = settings.DailyMaintenanceTime;

        while (!stoppingToken.IsCancellationRequested)
        {
            using (LogContext.PushProperty("CorrelationId", Guid.NewGuid().ToString()[..8]))
            {
                // ★ 最優先タスク：システムステータスの同期
                await TaskSyncSystemStatusAsync();
                // 各タスクの呼び出し（内部で判定と次回更新を行う）
                await TaskUpdateReactionCountsAsync();
                await TaskUpdateTableStatisticsAsync();
                await TaskGarbageCleanupAsync();
                await TaskAggregateClickQueueAsync();
                await TaskDailyMaintenanceAsync();
            }

            // 心拍（1分待機）
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    #region "共通基盤"

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

    #region "間隔実行タスク"

    /// <summary>
    /// DBの設定値をメモリ上のSystemStatusクラスに同期する
    /// </summary>
    private async Task TaskSyncSystemStatusAsync()
    {
        // 毎回実行（1分ごとの心拍で実行）
        await RunWithScopeAsync("システムステータス同期", async (scope) =>
        {
            var repo = scope.ServiceProvider.GetRequiredService<CoreConfigRepository>();
            var configs = await repo.GetConfigsByCategoryAsync("SYSTEM");

            foreach (var cfg in configs)
            {
                string key = cfg.key;
                string val = cfg.value;

                switch (key)
                {
                    case "MaintenanceMode":
                        _systemStatus.IsMaintenanceMode = (val.ToLower() == "true");
                        break;
                    case "MaintenanceMsg":
                        _systemStatus.MaintenanceMessage = val;
                        break;
                    case "MinAppVersion":
                        _systemStatus.MinAppVersion = val;
                        break;
                    case "LatestAppVersion":
                        _systemStatus.LatestAppVersion = val;
                        break;
                }
            }
            _systemStatus.LastSyncTime = DateTime.Now;
        });
    }

    /// <summary>
    /// リアクション数の再集計を行うタスク
    /// </summary>
    /// <returns></returns>
    private async Task TaskUpdateReactionCountsAsync()
    {
        var settings = _optionsMonitor.CurrentValue;
        var now = DateTime.Now;

        if (settings.ReactionCountUpdateIntervalMinutes <= 0) return;

        if (now >= _nextReactionUpdateTime)
        {
            await RunWithScopeAsync("リアクション再集計", async (scope) =>
            {
                var repo = scope.ServiceProvider.GetRequiredService<DetailPubRepository>();
                await repo.UpdateAllReactionCountsAsync();
            });
            _nextReactionUpdateTime = now.AddMinutes(settings.ReactionCountUpdateIntervalMinutes);
        }
    }

    /// <summary>
    /// テーブル統計情報の更新を行うタスク
    /// </summary>
    /// <returns></returns>
    private async Task TaskUpdateTableStatisticsAsync()
    {
        var settings = _optionsMonitor.CurrentValue;
        var now = DateTime.Now;

        if (settings.TableStatsUpdateIntervalMinutes <= 0 || settings.MaxTableNum <= 0) return;

        if (now >= _nextTableStatsUpdateTime)
        {
            await RunWithScopeAsync("テーブル統計集計", async (scope) =>
            {
                var repo = scope.ServiceProvider.GetRequiredService<TableStatisticsTaskRepository>();
                for (int i = 1; i <= settings.MaxTableNum; i++)
                {
                    await repo.EnsureManagerRecordExistsAsync(i);
                    await repo.SyncStatisticsAsync(i);
                }
            });
            _nextTableStatsUpdateTime = now.AddMinutes(settings.TableStatsUpdateIntervalMinutes);
        }
    }

    /// <summary>
    /// 論理削除済みデータの物理削除を行うタスク
    /// </summary>
    /// <returns></returns>
    private async Task TaskGarbageCleanupAsync()
    {
        var settings = _optionsMonitor.CurrentValue;
        var now = DateTime.Now;

        if (settings.GarbageCleanupIntervalMinutes <= 0) return;

        if (now >= _nextGarbageCleanupTime)
        {
            await RunWithScopeAsync("論理削除データの物理削除", async (scope) =>
            {
                var repo = scope.ServiceProvider.GetRequiredService<TableStatisticsTaskRepository>();
                for (int i = 1; i <= settings.MaxTableNum; i++)
                {
                    await repo.DeleteOldGarbageDetailsAsync(i);
                }
                await repo.DeleteOldGarbagePublicAsync();
            });
            _nextGarbageCleanupTime = now.AddMinutes(settings.GarbageCleanupIntervalMinutes);
        }
    }

    /// <summary>
    /// クリック数集計キューの処理を行うタスク
    /// </summary>
    /// <returns></returns>
    private async Task TaskAggregateClickQueueAsync()
    {
        var settings = _optionsMonitor.CurrentValue;
        var now = DateTime.Now;

        if (settings.ClickAggregateIntervalMinutes <= 0) return;

        if (now >= _nextClickAggregateTime)
        {
            await RunWithScopeAsync("クリック数集計", async (scope) =>
            {
                var repo = scope.ServiceProvider.GetRequiredService<ClickQueueTaskRepository>();
                var queueItems = await repo.GetQueueAllAsync();
                if (!queueItems.Any()) return;

                var lastProcessTime = DateTime.MinValue;
                var targetGroups = queueItems.GroupBy(q => new { t = (int)q.target_type, u = (Guid?)q.target_user_id, a = (int?)q.archive_id, s = (long?)q.seq });

                foreach (var targetGroup in targetGroups)
                {
                    var currentJson = await repo.GetCurrentStatsJsonAsync(targetGroup.Key.t, targetGroup.Key.u, targetGroup.Key.a, targetGroup.Key.s);
                    var statsMap = string.IsNullOrEmpty(currentJson) ? new Dictionary<string, ClickCountData>() : JsonSerializer.Deserialize<Dictionary<string, ClickCountData>>(currentJson) ?? new();

                    foreach (var itemGroup in targetGroup.GroupBy(i => (string)i.item_name))
                    {
                        string key = itemGroup.Key;
                        if (!statsMap.ContainsKey(key)) statsMap[key] = new ClickCountData();
                        statsMap[key].t += itemGroup.Count();
                        statsMap[key].u += itemGroup.Where(x => x.viewer_user_id != null).Select(x => (Guid)x.viewer_user_id).Distinct().Count();
                        statsMap[key].g += itemGroup.Count(x => x.viewer_user_id == null);
                    }

                    var maxTime = targetGroup.Max(x => (DateTime)x.create_tim);
                    if (maxTime > lastProcessTime) lastProcessTime = maxTime;

                    await repo.UpdateStatsJsonAsync(targetGroup.Key.t, targetGroup.Key.u, targetGroup.Key.a, targetGroup.Key.s, JsonSerializer.Serialize(statsMap));
                }
                if (lastProcessTime > DateTime.MinValue) await repo.DeleteProcessedQueueAsync(lastProcessTime);
            });
            _nextClickAggregateTime = now.AddMinutes(settings.ClickAggregateIntervalMinutes);
        }
    }

    #endregion

    #region "定時実行タスク"

    /// <summary>
    /// 次回の実行時刻を計算する
    /// </summary>
    /// 
    private DateTime CalculateNextRunTime(string timeStr)
    {
        if (!TimeSpan.TryParse(timeStr, out var timeOfDay))
        {
            _logger.LogWarning("【時刻設定エラー】{TimeStr} の形式が不正です。00:00 を使用します。", timeStr);
            timeOfDay = TimeSpan.Zero;
        }

        var now = DateTime.Now;
        var nextRun = now.Date.Add(timeOfDay);

        if (now >= nextRun) nextRun = nextRun.AddDays(1);

        return nextRun;
    }

    /// <summary>
    /// 定刻（例：毎日0時）に実行するタスク。今はダミー処理だが、将来的に日次でやりたい処理をここに追加していく。
    /// </summary>
    /// <returns></returns>
    private async Task TaskDailyMaintenanceAsync()
    {
        var settings = _optionsMonitor.CurrentValue;
        var now = DateTime.Now;

        // 設定ファイル（文字列）が変更されていたら、即座に次回予定を再計算する
        if (settings.DailyMaintenanceTime != _lastDailyMaintenanceTimeSetting)
        {
            _nextDailyMaintenanceTime = CalculateNextRunTime(settings.DailyMaintenanceTime);
            _lastDailyMaintenanceTimeSetting = settings.DailyMaintenanceTime;
            _logger.LogInformation("【時刻設定変更検知】次回の実行予定を {Time} に更新しました。", _nextDailyMaintenanceTime.ToString("yyyy/MM/dd HH:mm"));
        }

        if (now >= _nextDailyMaintenanceTime)
        {
            await RunWithScopeAsync("日次メンテナンス", async (scope) =>
            {
                _logger.LogInformation("日次バッチ処理（0時等の定刻処理）を実行します...");
                // 今後、日次でやりたい処理（古いログの圧縮など）をここに追加
                await Task.CompletedTask;
            });

            // 実行後、最新の設定値に基づいて「明日の同時刻」を再計算
            _nextDailyMaintenanceTime = CalculateNextRunTime(_optionsMonitor.CurrentValue.DailyMaintenanceTime);
        }
    }

    #endregion

}