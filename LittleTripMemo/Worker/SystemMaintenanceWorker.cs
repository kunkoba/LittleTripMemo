using LittleTripMemo.Common;
using LittleTripMemo.Configs;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Batch;
using LittleTripMemo.Repository.Core;
using Microsoft.Extensions.Options;
using Serilog.Context;
using System.Text.Json;

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

    /// <summary>
    /// 実行するタスクをスコープ付きでラップし、ログ出力と例外処理を行う
    /// </summary>
    /// <param name="taskName"></param>
    /// <param name="action"></param>
    /// <returns></returns>
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

    #region "タスク"

    /// <summary>
    /// システムステータス（メンテナンスモードや最小アプリバージョンなど）を DB から取得して同期するタスク
    /// </summary>
    /// <returns></returns>
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

    /// <summary>
    /// リアクション数の再集計を行うタスク（tmp_reaction_count_queue を処理して、各テーブルの reaction_counts を更新する）
    /// </summary>
    /// <returns></returns>
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

    /// <summary>
    /// テーブル統計情報（各テーブルの件数や最大IDなど）を更新するタスク
    /// </summary>
    /// <returns></returns>
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

    /// <summary>
    /// 論理削除された古いデータを物理削除するタスク
    /// </summary>
    /// <returns></returns>
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

    /// <summary>
    /// クリック・閲覧数集計キュー（tmp_count_queue）を処理し、各テーブルの統計情報を更新するタスク
    /// </summary>
    private async Task TaskAggregateClickQueueAsync()
    {
        var settings = optionsMonitor.CurrentValue;
        if (settings.ClickAggregateIntervalMinutes <= 0) return;

        if (DateTime.Now >= _nextClickAggregateTime)
        {
            await RunWithScopeAsync("統計データ集計", async (scope) =>
            {
                var repository = scope.ServiceProvider.GetRequiredService<CountQueueTaskRepository>();

                // 1. キューテーブルから未処理の生データを全件取得
                var queueItems = await repository.GetQueueAllAsync();
                if (!queueItems.Any()) return;

                DateTime lastProcessedTime = DateTime.MinValue;

                // 2. ターゲット（更新対象の行）ごとにグループ化
                var targetGroups = queueItems.GroupBy(queue => new {
                    TargetType = (int)queue.target_type,
                    UserId = (Guid?)queue.target_user_id,
                    ArchiveId = (int?)queue.archive_id,
                    Seq = (long?)queue.seq
                });

                foreach (var targetGroup in targetGroups)
                {
                    // 3. 現在の統計 JSONB を対象テーブルから取得
                    var currentJson = await repository.GetCurrentStatsJsonAsync(
                        targetGroup.Key.TargetType,
                        targetGroup.Key.UserId,
                        targetGroup.Key.ArchiveId,
                        targetGroup.Key.Seq
                    );

                    // JSON を Dictionary にデシリアライズ（存在しなければ新規作成）
                    var statsMap = string.IsNullOrEmpty(currentJson)
                        ? new Dictionary<string, ClickCountData>()
                        : JsonSerializer.Deserialize<Dictionary<string, ClickCountData>>(currentJson) ?? new();

                    // 4. アイテム（イベント名）ごとに集計
                    var itemGroups = targetGroup.GroupBy(item => (string)item.item_name);
                    foreach (var itemGroup in itemGroups)
                    {
                        string key = itemGroup.Key;

                        if (!statsMap.ContainsKey(key))
                        {
                            statsMap[key] = new ClickCountData();
                        }

                        var stats = statsMap[key];
                        // 総クリック/閲覧数
                        stats.t += itemGroup.Count();
                        // ユニークユーザー数（ログイン済みの viewer_user_id があるもののみ重複排除して加算）
                        stats.u += itemGroup.Where(x => x.viewer_user_id != null).Select(x => (Guid)x.viewer_user_id!).Distinct().Count();
                        // ゲスト閲覧数
                        stats.g += itemGroup.Count(x => x.viewer_user_id == null);
                    }

                    // 5. 計算後の JSON を DB へ書き戻し
                    await repository.UpdateStatsJsonAsync(
                        targetGroup.Key.TargetType,
                        targetGroup.Key.UserId,
                        targetGroup.Key.ArchiveId,
                        targetGroup.Key.Seq,
                        JsonSerializer.Serialize(statsMap)
                    );

                    // 処理したデータの最大時刻を保持
                    var maxTimeInGroup = targetGroup.Max(x => (DateTime)x.create_tim);
                    if (maxTimeInGroup > lastProcessedTime) lastProcessedTime = maxTimeInGroup;
                }

                // 6. 今回処理した時刻までのキューを削除（物理削除）
                if (lastProcessedTime > DateTime.MinValue)
                {
                    await repository.DeleteProcessedQueueAsync(lastProcessedTime);
                }
            });

            _nextClickAggregateTime = DateTime.Now.AddMinutes(settings.ClickAggregateIntervalMinutes);
        }
    }

    #endregion

}