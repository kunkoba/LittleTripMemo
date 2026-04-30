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
    private readonly GetUserProfileService _getUserProfileService;

    public record GetArchiveDetailsPubReq(int archive_id);
    public record Response(
        TMemoArchivePub archive,
        IEnumerable<TMemoDetailPub> details,
        IEnumerable<TReactionPub> my_reactions,
        GetUserProfileService.Response userProfile
    );

    public GetArchiveDetailsPubService(
        UserContext userContext,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo,
        ReactionPubRepository reactionPubRepo,
        GetUserProfileService getUserProfileService)
        : base(userContext)
    {
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
        _reactionPubRepo = reactionPubRepo;
        _getUserProfileService = getUserProfileService;
    }

    public async Task<Response> ExecuteAsync(GetArchiveDetailsPubReq req)
    {
        await ValidateAsync(req);

        // 親取得
        var archive = await _archivePubRepo.GetByKeyAsync(req.archive_id);
        BusinessException.ThrowIf(archive == null, "アーカイブが見つかりません");
        SetAppFlags(archive);

        // 明細取得（リアクション集計含む）
        var details = await _detailPubRepo.GetByArchiveIdAsync(req.archive_id);
        SetAppFlags(details);

        // 自分のリアクション取得（ログイン済みの場合のみ）
        var myReactions = _user.UserId != Guid.Empty
            ? await _reactionPubRepo.GetMyReactionsByArchiveIdAsync(req.archive_id)
            : Enumerable.Empty<TReactionPub>();

        var profile = await _getUserProfileService.ExecuteAsync(archive.user_id);

        return new Response(archive, details, myReactions, profile);
    }

    private async Task ValidateAsync(GetArchiveDetailsPubReq req)
    {
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}