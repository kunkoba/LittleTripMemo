using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository.Core;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Core;

public class UpdateLegalConfigService(UserContext user, CoreConfigRepository coreRepo) : _BaseService(user)
{
    public record UpdateLegalConfigReq([Required] Guid login_user_id, [Required] string key, [Required] string value) : ILoginUserRequest;
    public record Response(bool is_success);
    public async Task<Response> ExecuteAsync(UpdateLegalConfigReq req)
    {
        BusinessException.ThrowIf(_user.plan_type != PlanType.Admin.ToString(), "管理者権限が必要です");
        await coreRepo.UpdateConfigAsync("LEGAL", req.key, req.value);
        return new Response(true);
    }

}