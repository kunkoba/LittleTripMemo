using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Sys;

namespace LittleTripMemo.Services.Public;

public class GetArchiveDetailsPubService : _BaseService
{
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ReactionPubRepository _reactionPubRepo;
    private readonly AppUserRepository _appUserRepo; 

    public record GetArchiveDetailsPubReq(int archive_id);

    public record Response(
        TMemoArchivePub archive,
        IEnumerable<TMemoDetailPub> details,
        IEnumerable<TReactionPub> myReactions,
        DtoUserProfile userProfile 
    );

    public GetArchiveDetailsPubService(
        UserContext userContext,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo,
        ReactionPubRepository reactionPubRepo,
        AppUserRepository appUserRepo) 
        : base(userContext)
    {
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
        _reactionPubRepo = reactionPubRepo;
        _appUserRepo = appUserRepo;
    }

    public async Task<Response> ExecuteAsync(GetArchiveDetailsPubReq req)
    {
        await ValidateAsync(req);

        // 親取得
        var archive = await _archivePubRepo.GetByKeyAsync(req.archive_id);
        
        // 存在チェック
        BusinessException.ThrowIf(archive == null, "アーカイブが見つかりません");
        
        // 「非公開(closed)」かつ「所有者ではない」場合はエラーにする
        if (archive.closed_flg && archive.user_id != _user.login_user_id)
        {
            throw new BusinessException("このアーカイブは現在非公開に設定されています。");
        }

        SetAppFlags(archive);

        // 明細取得（リアクション集計含む）
        var details = await _detailPubRepo.GetByArchiveIdAsync(req.archive_id);
        SetAppFlags(details);

        // 自分のリアクション取得（ログイン済みの場合のみ）
        var reactions = _user.login_user_id != Guid.Empty
            ? await _reactionPubRepo.GetMyReactionsByArchiveIdAsync(req.archive_id)
            : Enumerable.Empty<TReactionPub>();

        // ユーザープロフィールの取得
        var user = await _appUserRepo.GetByUserIdAsync(archive.user_id)
            ?? throw new BusinessException("ユーザーが存在しません");

        var profile = new DtoUserProfile(
            user.user_id,
            user.icon,
            user.nick_name,
            user.description,
            user.link_1, user.link_2, user.link_3,
            is_owner: (user.user_id == _user.login_user_id),
            user.click_stats
        );

        return new Response(archive, details, reactions, profile);
    }

    private async Task ValidateAsync(GetArchiveDetailsPubReq req)
    {
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}