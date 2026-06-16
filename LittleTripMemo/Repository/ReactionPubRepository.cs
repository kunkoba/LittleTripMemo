using LittleTripMemo.Models;
using LittleTripMemo.Common;

namespace LittleTripMemo.Repository;

public class ReactionPubRepository : _BaseRepository
{
    public ReactionPubRepository(
        ITransactionProvider provider,
        ILogger<ReactionPubRepository> logger,
        UserContext user
    ) : base(provider, logger, user) { }

    /// <summary>
    /// リアクション状態の更新（UPSERT）
    /// </summary>
    public async Task<int> UpsertAsync(TReactionPub reaction)
    {
        reaction.user_id = _user.login_user_id;

        const string sql = @"
            INSERT INTO t_reaction_pub (
                archive_id, seq, user_id, 
                has_funny, has_love, has_surprise, has_sad, 
                update_tim
            ) VALUES (
                @archive_id, @seq, @user_id, 
                @has_funny, @has_love, @has_surprise, @has_sad, 
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (archive_id, seq, user_id) 
            DO UPDATE SET
                has_funny    = EXCLUDED.has_funny,
                has_love  = EXCLUDED.has_love,
                has_surprise = EXCLUDED.has_surprise,
                has_sad      = EXCLUDED.has_sad,
                update_tim   = CURRENT_TIMESTAMP";

        return await ExecuteAsync(sql, reaction);
    }

    /// <summary>
    /// アーカイブIDに紐づく「自分の」全リアクションを取得
    /// 1レコードに4種入っているため、取得後のハンドリングが楽になります
    /// </summary>
    public async Task<IEnumerable<TReactionPub>> GetMyReactionsByArchiveIdAsync(int archiveId)
    {
        const string sql = @"
            SELECT * FROM t_reaction_pub 
            WHERE archive_id = @archiveId 
              AND user_id    = @user_id";

        return await QueryAsync<TReactionPub>(sql, new { archiveId = archiveId, user_id = _user.login_user_id });
    }

    /// <summary>
    /// 特定の明細に対する自分のリアクションを物理削除（レコードごと削除）
    /// ※全フラグがfalseになった場合などに呼び出す想定
    /// </summary>
    public async Task<int> DeletePhysicalBySeqAsync(int archiveId, long seq)
    {
        const string sql = @"
            DELETE FROM t_reaction_pub
            WHERE archive_id = @archiveId
              AND seq        = @seq
              AND user_id    = @user_id";

        return await ExecuteAsync(sql, new { archiveId, seq, user_id = _user.login_user_id });
    }

    /// <summary>
    /// アーカイブIDに紐づくリアクションをすべて物理削除（公開停止・削除用）
    /// </summary>
    public async Task<int> DeletePhysicalByArchiveIdAsync(int archiveId)
    {
        const string sql = "DELETE FROM t_reaction_pub WHERE archive_id = @archive_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId });
    }

    /// <summary>
    /// リアクションを更新し、その増減値を DetailPub テーブルにアトミックに反映する
    /// </summary>
    public async Task UpsertWithCounterAsync(TReactionPub reaction)
    {
        reaction.user_id = _user.login_user_id;

        const string sql = @"
            WITH old_val AS (
                SELECT has_funny, has_love, has_surprise, has_sad
                FROM t_reaction_pub
                WHERE archive_id = @archive_id AND seq = @seq AND user_id = @user_id
            ),
            upserted AS (
                INSERT INTO t_reaction_pub (
                    archive_id, seq, user_id, has_funny, has_love, has_surprise, has_sad
                ) VALUES (
                    @archive_id, @seq, @user_id, @has_funny, @has_love, @has_surprise, @has_sad
                )
                ON CONFLICT (archive_id, seq, user_id) DO UPDATE SET
                    has_funny    = EXCLUDED.has_funny,
                    has_love     = EXCLUDED.has_love,
                    has_surprise = EXCLUDED.has_surprise,
                    has_sad      = EXCLUDED.has_sad
                RETURNING *
            )
            UPDATE t_memo_detail_pub
            SET 
                count_funny = count_funny + ((CASE WHEN u.has_funny THEN 1 ELSE 0 END) - (CASE WHEN COALESCE(o.has_funny, false) THEN 1 ELSE 0 END)),
                count_love  = count_love  + ((CASE WHEN u.has_love  THEN 1 ELSE 0 END) - (CASE WHEN COALESCE(o.has_love,  false) THEN 1 ELSE 0 END)),
                count_surprise = count_surprise + ((CASE WHEN u.has_surprise THEN 1 ELSE 0 END) - (CASE WHEN COALESCE(o.has_surprise, false) THEN 1 ELSE 0 END)),
                count_sad   = count_sad   + ((CASE WHEN u.has_sad   THEN 1 ELSE 0 END) - (CASE WHEN COALESCE(o.has_sad,   false) THEN 1 ELSE 0 END))
            FROM upserted u
            LEFT JOIN old_val o ON true
            WHERE t_memo_detail_pub.archive_id = u.archive_id 
              AND t_memo_detail_pub.seq = u.seq";
            // ※ t_memo_detail_pub 側の user_id チェックは、公開データであるため 
            //    archive_id/seq が一致すれば OK（作成者以外もリアクションするため）

        await ExecuteAsync(sql, reaction);
    }

}