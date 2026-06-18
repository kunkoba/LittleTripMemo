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
                record_count = (SELECT count(*) FROM t_memo_detail_{tableId} ),
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

    /// <summary>
    /// 論理削除から1ヶ月以上経過した明細を物理削除する
    /// </summary>
    public async Task DeleteOldGarbageDetailsAsync(int tableId)
    {
        // del_flgがtrue かつ update_tim（削除日時）から1ヶ月以上経過したものを削除
        string sql = $@"
            DELETE FROM t_memo_detail_{tableId}
            WHERE del_flg = true 
              AND archive_id = 0
              AND update_tim < CURRENT_TIMESTAMP - INTERVAL '1 month'";

        await ExecuteAsync(sql);
    }

    /// <summary>
    /// 公開側の論理削除データ（アーカイブ・明細・リアクション）を掃除する
    /// </summary>
    /// <returns></returns>
    public async Task DeleteOldGarbagePublicAsync()
    {
        // 1. 公開アーカイブの掃除
        const string sqlArchive = @"
            DELETE FROM t_memo_archive_pub 
            WHERE del_flg = true AND update_tim < CURRENT_TIMESTAMP - INTERVAL '1 month'";

        // 2. 公開明細の掃除
        const string sqlDetail = @"
            DELETE FROM t_memo_detail_pub 
            WHERE del_flg = true AND update_tim < CURRENT_TIMESTAMP - INTERVAL '1 month'";

        // 3. リアクションの掃除（★追加）
        const string sqlReaction = @"
            DELETE FROM t_reaction_pub 
            WHERE del_flg = true AND update_tim < CURRENT_TIMESTAMP - INTERVAL '1 month'";

        await ExecuteAsync(sqlArchive);
        await ExecuteAsync(sqlDetail);
        await ExecuteAsync(sqlReaction);
    }

}