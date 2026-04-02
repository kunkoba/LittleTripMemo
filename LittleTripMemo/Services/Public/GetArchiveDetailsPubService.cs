using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class GetArchiveDetailsPubService : _BaseService
{
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ReactionPubRepository _reactionPubRepo;

    public record GetArchiveDetailsPubReq(int archive_id);
    public record Response(
        TMemoArchivePub archive,
        IEnumerable<TMemoDetailPub> details,
        IEnumerable<TReactionPub> my_reactions
    );

    public GetArchiveDetailsPubService(
        UserContext userContext,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo,
        ReactionPubRepository reactionPubRepo)
        : base(userContext)
    {
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
        _reactionPubRepo = reactionPubRepo;
    }

    public async Task<Response> ExecuteAsync(GetArchiveDetailsPubReq req)
    {
        await ValidateAsync(req);

        // 親取得
        var archive = await _archivePubRepo.GetByKeyAsync(req.archive_id);
        BusinessException.ThrowIf(archive == null, "アーカイブが見つかりません");

        // 明細取得（リアクション集計含む）
        var details = await _detailPubRepo.GetByArchiveIdAsync(req.archive_id);

        // 自分のリアクション取得（ログイン済みの場合のみ）
        var myReactions = _user.UserId != Guid.Empty
            ? await _reactionPubRepo.GetMyReactionsByArchiveIdAsync(req.archive_id)
            : Enumerable.Empty<TReactionPub>();

        SetAppFlags(archive);
        SetAppFlags(details);
        return new Response(archive, details, myReactions);
    }

    private async Task ValidateAsync(GetArchiveDetailsPubReq req)
    {
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}