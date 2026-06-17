using LittleTripMemo.Common;
using LittleTripMemo.Repository;
using Serilog.Context;

namespace LittleTripMemo.Worker;

/// <summary>
/// システムの定期メンテナンス（件数集計・ゴミ掃除など）を担当するバックグラウンドサービス
/// </summary>
public class SystemMaintenanceWorker : BackgroundService
{
    private readonly ILogger<SystemMaintenanceWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public SystemMaintenanceWorker(
        ILogger<SystemMaintenanceWorker> logger,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory; // これが「窓口（スコープ）」を作るための工場です
    }

    /// <summary>
    /// アプリ起動時に一度だけ呼ばれ、アプリが終了するまでこのメソッドが動き続けます
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("--- システムメンテナンス・バッチを起動しました ---");

        // アプリが終了（ストップ）されるまで無限ループ
        while (!stoppingToken.IsCancellationRequested)
        {
            // 1サイクルごとに短いID（Guidの先頭8文字）を発番して紐付け
            using (LogContext.PushProperty("CorrelationId", Guid.NewGuid().ToString()[..8]))
            { 
                try
                {
                    //_logger.LogInformation("【定期実行】システムメンテナンス処理を開始します: {time}", DateTime.Now);

                    // --- ここに実際の業務ロジック（リアクション集計など）を後で追加します ---
                    // 今回は「窓口(Scope)を開く呪文」の準備だけ書いておきます
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        // 1. 窓口（scope）からリポジトリのインスタンスを取り出す
                        var detailPubRepo = scope.ServiceProvider.GetRequiredService<DetailPubRepository>();

                        // 2. 実際の集計処理を実行
                        _logger.LogInformation("リアクション件数の再集計を開始します...");
                        await detailPubRepo.UpdateAllReactionCountsAsync();
                        _logger.LogInformation("リアクション件数の再集計が完了しました。");
                    }

                    //_logger.LogInformation("【定期実行】処理が正常に完了しました。次回実行まで待機します。");
                }
                catch (Exception ex)
                {
                    // PostgresException の場合は詳細情報を省く
                    var msg = (ex is Npgsql.PostgresException pgEx) ? pgEx.MessageText : ex.Message;
                    _logger.LogError("【バッチ実行エラー】{Type}: {Msg}", ex.GetType().Name, msg);
                }
            }

            // 1分間待機（stoppingTokenを渡すことで、アプリ終了時に即座に待機を中断できます）
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }

        _logger.LogInformation("--- システムメンテナンス・バッチを終了しました ---");
    }
}