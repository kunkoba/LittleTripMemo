using LittleTripMemo.Common;

namespace LittleTripMemo.Repository.Batch;

/// <summary>
/// 定期バッチ専用：テーブル統計情報の更新処理を担当するリポジトリ
/// </summary>
public class TableStatisticsTaskRepository : _BaseRepository
{
    public TableStatisticsTaskRepository(
        ITransactionProvider provider,
        ILogger<TableStatisticsTaskRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    /// <summary>
    /// 指定されたテーブルIDの実数（レコード数・ユーザー数）を計測し、管理テーブルを更新する
    /// </summary>
    /// <param name="tableId">集計対象のテーブル番号</param>
    public async Task SyncStatisticsAsync(int tableId)
    {
        // 動的なテーブル名を含むSQL
        // 1. 各明細テーブルから有効なレコード数をカウント
        // 2. t_app_user からそのテーブルに割り当てられているユーザー数をカウント
        // 3. 結果を mgr_table_statistics に反映
        string sql = $@"
            UPDATE mgr_table_statistics 
            SET 
                record_count = (SELECT count(*) FROM t_memo_detail_{tableId} WHERE del_flg = false),
                user_count   = (SELECT count(*) FROM t_app_user WHERE table_id = @tableId),
                last_count_tim = CURRENT_TIMESTAMP
            WHERE table_id = @tableId";

        await ExecuteAsync(sql, new { tableId });
    }

    /// <summary>
    /// 管理テーブルに存在しないテーブルIDがあれば初期レコードを挿入する（安全策）
    /// </summary>
    public async Task EnsureManagerRecordExistsAsync(int tableId)
    {
        const string sql = @"
            INSERT INTO mgr_table_statistics (table_id, table_name, last_count_tim)
            VALUES (@tableId, @tableName, CURRENT_TIMESTAMP)
            ON CONFLICT (table_id) DO NOTHING";

        await ExecuteAsync(sql, new
        {
            tableId,
            tableName = $"t_memo_detail_{tableId}"
        });
    }
}