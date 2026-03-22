using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class UpsertReactionService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ReactionPubRepository _reactionPubRepo;

    public record ReactionDetail(int seq, int[] reaction_types);
    public record UpsertReactionReq(
        int archive_id,
        IEnumerable<ReactionDetail> reactions
    );
    public record Response(int updatedCount);

    public UpsertReactionService(
        UserContext userContext,
        ITransactionProvider provider,
        ReactionPubRepository reactionPubRepo)
        : base(userContext)
    {
        _provider = provider;
        _reactionPubRepo = reactionPubRepo;
    }

    public async Task<Response> ExecuteAsync(UpsertReactionReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            int count = 0;
            foreach (var detail in req.reactions)
            {
                // ① 対象明細のリアクションを全件物理削除
                await _reactionPubRepo.DeletePhysicalBySeqAsync(req.archive_id, detail.seq);

                // ② フラグ分だけ登録
                foreach (var reactionType in detail.reaction_types)
                {
                    await _reactionPubRepo.InsertAsync(new TReactionPub
                    {
                        archive_id = req.archive_id,
                        seq = detail.seq,
                        user_id = _user.UserId,
                        reaction_type = reactionType
                    });
                    count++;
                }
            }
            tran.Commit();
            return new Response(count);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(UpsertReactionReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}