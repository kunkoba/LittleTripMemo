using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.Sys;

namespace LittleTripMemo.Services.Account;

public class GetUserProfileService(
    UserContext userContext,
    AppUserRepository appUserRepository
) : _BaseService(userContext)
{
    public record GetUserProfileReq(Guid target_user_id);

    public record Response(DtoUserProfile user_profile);

    public async Task<Response> ExecuteAsync(GetUserProfileReq req)
    {
        await ValidateAsync(req.target_user_id);

        // 1. ターゲットユーザーの情報を取得
        var targetUser = await appUserRepository.GetByUserIdAsync(req.target_user_id);
        BusinessException.ThrowIf(targetUser == null, "ユーザーが存在しません", "USER_NOT_FOUND");

        // 2. 共通DTOへマッピング（member_no, user_category, user_rank を含む最新版）
        var profile = new DtoUserProfile(
            targetUser.user_id,
            targetUser.member_no,
            targetUser.user_category,
            targetUser.user_rank,
            targetUser.icon,
            targetUser.nick_name,
            targetUser.description,
            targetUser.link_1,
            targetUser.link_2,
            targetUser.link_3,
            is_owner: (targetUser.user_id == _user.login_user_id),
            targetUser.click_stats,
            targetUser.info_stats,
            targetUser.info_stats_pub,
            targetUser.report_count
        );

        return new Response(profile);
    }

    private async Task ValidateAsync(Guid userId)
    {
        BusinessException.ThrowIf(userId == Guid.Empty, "対象のユーザーIDが指定されていません");
        await Task.CompletedTask;
    }
}