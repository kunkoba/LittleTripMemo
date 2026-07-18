using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository.Core;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Core;

/// <summary>
/// 管理者権限で法的文書（規約等）を更新するサービス
/// </summary>
public class UpdateLegalConfigService : _BaseService
{
    private readonly CoreConfigRepository _coreRepo;

public record UpdateLegalConfigReq(
    [Required] Guid login_user_id,
    [Required] string key,
    [Required] string value
) : ILoginUserRequest;

    public record Response(bool is_success);

    public UpdateLegalConfigService(UserContext user, CoreConfigRepository coreRepo) : base(user)
    {
        _coreRepo = coreRepo;
    }

    public async Task<Response> ExecuteAsync(UpdateLegalConfigReq req)
    {
        // 1. バリデーション
        await ValidateAsync(req);

        // 2. 設定の更新
        await _coreRepo.UpdateConfigAsync("LEGAL", req.key, req.value);

        return new Response(true);
    }

    private async Task ValidateAsync(UpdateLegalConfigReq req)
    {
        // 管理者権限の確認
        BusinessException.ThrowIf(_user.plan_type != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }

}