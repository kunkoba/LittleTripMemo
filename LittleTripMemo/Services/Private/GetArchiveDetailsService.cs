using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Sys;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

/// <summary>
/// 特定のアーカイブ（まとめ）の詳細情報と、紐づく明細一覧を取得するサービス
/// </summary>
public class GetArchiveDetailsService(
    UserContext userContext,
    ArchiveRepository archiveRepository,
    DetailRepository detailRepository,
    AppUserRepository appUserRepository
) : _BaseService(userContext)
{
    public record GetArchiveDetailsReq(
        [Required(ErrorMessage = "アーカイブIDは必須です")] int archive_id
    );

    public record Response(
        TMemoArchive archive,
        IEnumerable<TMemoDetail> details,
        DtoUserProfile userProfile
    );

    /// <summary>
    /// アーカイブ詳細取得処理を実行する
    /// </summary>
    public async Task<Response> ExecuteAsync(GetArchiveDetailsReq req)
    {
        // 1. バリデーション
        await ValidateAsync(req);

        // 2. 存在チェック（冒頭で親データの存在を確認）
        var archive = await archiveRepository.GetByKeyAsync(req.archive_id);
        BusinessException.ThrowIf(archive == null, "指定されたまとめが見つかりません。");

        // 3. 明細の取得と存在チェック
        var details = await detailRepository.GetByArchiveIdAsync(req.archive_id);
        // リストが空の場合は異常（本来は明細0で自動解体されるため）
        BusinessException.ThrowIf(!details.Any(), "まとめの中に明細が見つかりません。");

        // 4. 所有者情報の取得
        var ownerUser = await appUserRepository.GetByUserIdAsync(archive!.user_id);
        BusinessException.ThrowIf(ownerUser == null, "まとめの所有者情報が見つかりません。");

        // 5. フラグセットと返却準備
        SetAppFlags(archive);
        SetAppFlags(details);

        var userProfile = new DtoUserProfile(
            ownerUser!.user_id,
            ownerUser.icon,
            ownerUser.nick_name,
            ownerUser.description,
            ownerUser.link_1, ownerUser.link_2, ownerUser.link_3,
            is_owner: (ownerUser.user_id == _user.login_user_id),
            ownerUser.click_stats,
            ownerUser.info_stats,     // 秘密側統計
            ownerUser.info_stats_pub  // 公開側統計
        );

        return new Response(archive, details, userProfile);
    }

    /// <summary>
    /// 業務バリデーション
    /// </summary>
    private async Task ValidateAsync(GetArchiveDetailsReq req)
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(req.archive_id <= 0, "アーカイブIDが不正です");

        await Task.CompletedTask;
    }

}