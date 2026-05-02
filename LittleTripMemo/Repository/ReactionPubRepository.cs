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

    public async Task<int> InsertAsync(TReactionPub reaction)
    {
        reaction.user_id = _user.UserId;
        const string sql = @"
            INSERT INTO t_reaction_pub (
                archive_id, seq, user_id, reaction_type
            ) VALUES (
                @archive_id, @seq, @user_id, @reaction_type
            ) ON CONFLICT DO NOTHING";
        return await ExecuteAsync(sql, reaction);
    }

    // 自分のリアクション取得（アーカイブID指定）
    public async Task<IEnumerable<TReactionPub>> GetMyReactionsByArchiveIdAsync(int archiveId)
    {
        const string sql = @"
        SELECT * FROM t_reaction_pub
        WHERE archive_id = @archive_id
          AND user_id    = @user_id";
        return await QueryAsync<TReactionPub>(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }

    public async Task<int> DeletePhysicalBySeqAsync(int archiveId, int seq)
    {
        const string sql = @"
        DELETE FROM t_reaction_pub
        WHERE archive_id = @archive_id
          AND seq        = @seq
          AND user_id    = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, seq, user_id = _user.UserId });
    }
}