using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using LittleTripMemo.Repository.Core;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Core;

public class UpdateCoreConfigService : _BaseService
{
    private readonly CoreConfigRepository _coreRepo;
    private readonly ITransactionProvider _provider;

    public record ConfigUpdateItem(string key, string value);
    public record UpdateCoreConfigReq(
        [Required] Guid login_user_id,
        IEnumerable<ConfigUpdateItem> items
    ) : ILoginUserRequest;

    public record Response(bool is_success);

    public UpdateCoreConfigService(UserContext user, CoreConfigRepository coreRepo, ITransactionProvider provider) : base(user)
    {
        _coreRepo = coreRepo;
        _provider = provider;
    }

    public async Task<Response> ExecuteAsync(UpdateCoreConfigReq req)
    {
        await ValidateAsync();

        using var tran = _provider.BeginTransaction();
        try
        {
            foreach (var item in req.items)
            {
                // カテゴリー「SYSTEM」固定で更新を実行
                await _coreRepo.UpdateConfigAsync("SYSTEM", item.key, item.value);
            }

            tran.Commit();
            return new Response(true);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.plan_type != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }

}