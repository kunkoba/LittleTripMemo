namespace LittleTripMemo.Services.Admin;
using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.Sys;
using static LittleTripMemo.Services.Admin.AdminCloseArchivePubService;

public class GetShadowBanUsersService(UserContext userContext, AppUserRepository appUserRepository) : _BaseService(userContext)
{
    public record Response(IEnumerable<TAppUser> banUserList);
    public async Task<Response> ExecuteAsync()
    {
        // 管理者権限チェック
        BusinessException.ThrowIf(_user.plan_type != PlanType.Admin.ToString(), "管理者権限が必要です");

        var users = await appUserRepository.GetShadowBanUsersAsync();
        return new Response(users);
    }
}