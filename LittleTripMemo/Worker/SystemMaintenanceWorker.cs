using LittleTripMemo.Configs;
using LittleTripMemo.Common;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Batch;
using LittleTripMemo.Repository.Core;
using Microsoft.Extensions.Options;
using Serilog.Context;

namespace LittleTripMemo.Worker;

/// <summary>
/// 統計集計やゴミ掃除など、定期的なシステムメンテナンス処理を実行するバックグラウンドサービス
/// </summary>
public class SystemMaintenanceWorker(
    ILogger<SystemMaintenanceWorker> logger,
    IServiceScopeFactory serviceScopeFactory,
    IOptionsMonitor<MyAppSettings> optionsMonitor,
    SystemStatus systemStatus
) : BackgroundService
{
    private DateTime _nextReactionUpdateTime = DateTime.Now;
    private DateTime _nextTableStatsUpdateTime = DateTime.Now;
    private DateTime _nextGarbageCleanupTime = DateTime.Now;
    private DateTime _nextClickAggregateTime = DateTime.Now;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("--- システムメンテナンス・バッチを稼働中 ---");

        while (!stoppingToken.IsCancellationRequested)
        {
            using (LogContext.PushProperty("CorrelationId", Guid.NewGuid().ToString()[..8]))
            {
                await TaskSyncSystemStatusAsync();
                await TaskUpdateReactionCountsAsync();
                await TaskUpdateTableStatisticsAsync();
                await TaskGarbageCleanupAsync();
                await TaskAggregateClickQueueAsync();
            }

            // 1分間隔でチェック
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task RunWithScopeAsync(string taskName, Func<IServiceScope, Task> action)
    {
        try
        {
            logger.LogInformation("【{TaskName}】を開始します...", taskName);
            using (var scope = serviceScopeFactory.CreateScope())
            {
                await action(scope);
            }
            logger.LogInformation("【{TaskName}】を完了しました。", taskName);
        }
        catch (Exception exception)
        {
            logger.LogError("【{TaskName}失敗】{Type}: {Message}", taskName, exception.GetType().Name, exception.Message);
        }
    }

    private async Task TaskSyncSystemStatusAsync()
    {
        await RunWithScopeAsync("システムステータス同期", async (scope) =>
        {
            var configRepository = scope.ServiceProvider.GetRequiredService<CoreConfigRepository>();
            var configs = await configRepository.GetConfigsByCategoryAsync("SYSTEM");
            foreach (var config in configs)
            {
                string key = config.key;
                string value = config.value;
                switch (key)
                {
                    case "MaintenanceMode": systemStatus.IsMaintenanceMode = (value.ToLower() == "true"); break;
                    case "MaintenanceMsg": systemStatus.MaintenanceMessage = value; break;
                    case "MinAppVersion": systemStatus.MinAppVersion = value; break;
                }
            }
        });
    }

    private async Task TaskUpdateReactionCountsAsync()
    {
        var settings = optionsMonitor.CurrentValue;
        if (settings.ReactionCountUpdateIntervalMinutes > 0 && DateTime.Now >= _nextReactionUpdateTime)
        {
            await RunWithScopeAsync("リアクション再集計", async (scope) =>
            {
                var repository = scope.ServiceProvider.GetRequiredService<DetailPubRepository>();
                await repository.UpdateAllReactionCountsAsync();
            });
            _nextReactionUpdateTime = DateTime.Now.AddMinutes(settings.ReactionCountUpdateIntervalMinutes);
        }
    }

    private async Task TaskUpdateTableStatisticsAsync()
    {
        var settings = optionsMonitor.CurrentValue;
        if (settings.TableStatsUpdateIntervalMinutes > 0 && DateTime.Now >= _nextTableStatsUpdateTime)
        {
            await RunWithScopeAsync("テーブル統計集計", async (scope) =>
            {
                var repository = scope.ServiceProvider.GetRequiredService<TableStatisticsTaskRepository>();
                for (int i = 1; i <= settings.MaxTableNum; i++)
                {
                    await repository.SyncStatisticsAsync(i);
                }
            });
            _nextTableStatsUpdateTime = DateTime.Now.AddMinutes(settings.TableStatsUpdateIntervalMinutes);
        }
    }

    private async Task TaskGarbageCleanupAsync()
    {
        var settings = optionsMonitor.CurrentValue;
        if (settings.GarbageCleanupIntervalMinutes > 0 && DateTime.Now >= _nextGarbageCleanupTime)
        {
            await RunWithScopeAsync("論理削除データの物理削除", async (scope) =>
            {
                var repository = scope.ServiceProvider.GetRequiredService<TableStatisticsTaskRepository>();
                await repository.DeleteOldGarbagePublicAsync();
            });
            _nextGarbageCleanupTime = DateTime.Now.AddMinutes(settings.GarbageCleanupIntervalMinutes);
        }
    }

    private async Task TaskAggregateClickQueueAsync()
    {
        var settings = optionsMonitor.CurrentValue;
        if (settings.ClickAggregateIntervalMinutes > 0 && DateTime.Now >= _nextClickAggregateTime)
        {
            await RunWithScopeAsync("クリック数集計", async (scope) => { /* ロジック省略... */ await Task.CompletedTask; });
            _nextClickAggregateTime = DateTime.Now.AddMinutes(settings.ClickAggregateIntervalMinutes);
        }
    }

}