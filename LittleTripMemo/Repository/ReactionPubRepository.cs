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
    /// 登録処理
    /// </summary>
    public async Task<int> InsertAsync(int archiveId, int seq, int type)
    {
        const string sql = @"
            INSERT INTO t_reaction_pub (archive_id, seq, user_id, reaction_type) 
            VALUES (@archiveId, @seq, @user_id, @type)";

        return await ExecuteAsync(sql, new
        {
            archiveId,
            seq,
            user_id = _user.UserId,
            type
        });
    }

    /// <summary>
    /// 物理削除
    /// </summary>
    public async Task<int> DeletePhysicalBySeqAsync(int archiveId, int seq)
    {
        const string sql = @"
        DELETE FROM t_reaction_pub
        WHERE archive_id = @archive_id
          AND seq        = @seq
          AND user_id    = @user_id";

        return await ExecuteAsync(sql, new { archive_id = archiveId, seq = seq, user_id = _user.UserId });
    }

    /// <summary>
    /// アーカイブIDに紐づく「自分の」全リアクションを取得
    /// GetArchiveDetailsPubService で使用
    /// </summary>
    public async Task<IEnumerable<TReactionPub>> GetMyReactionsByArchiveIdAsync(int archiveId)
    {
        const string sql = @"
            SELECT * FROM t_reaction_pub 
            WHERE archive_id = @archiveId 
              AND user_id    = @user_id";

        return await QueryAsync<TReactionPub>(sql, new { archiveId = archiveId, user_id = _user.UserId });
    }

}