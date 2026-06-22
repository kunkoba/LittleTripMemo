using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Sys;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Admin;

public class UpdateUserBanStatusService : _BaseService
{
    private readonly AppUserRepository _appUserRepo;

    public record UpdateUserBanStatusReq(
        [Required] Guid login_user_id,
        [Required] Guid target_user_id,
        [Required] bool is_banned
    ) : ILoginUserRequest;

    public record Response(bool is_success);

    public UpdateUserBanStatusService(UserContext userContext, AppUserRepository appUserRepo)
        : base(userContext)
    {
        _appUserRepo = appUserRepo;
    }

    public async Task<Response> ExecuteAsync(UpdateUserBanStatusReq req)
    {
        await ValidateAsync();

        // 指定されたユーザーの BAN フラグを更新
        int affected = await _appUserRepo.UpdateBanStatusAsync(req.target_user_id, req.is_banned);

        return new Response(affected > 0);
    }

    private async Task ValidateAsync()
    {
        // 管理者権限チェック
        BusinessException.ThrowIf(_user.plan_type != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }

}