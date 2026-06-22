using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository.Core;

namespace LittleTripMemo.Services.Core;

public class GetCoreConfigService : _BaseService
{
    private readonly CoreConfigRepository _coreRepo;

    public record Response(IEnumerable<dynamic> configs);

    public GetCoreConfigService(UserContext user, CoreConfigRepository coreRepo) : base(user)
    {
        _coreRepo = coreRepo;
    }

    public async Task<Response> ExecuteAsync()
    {
        await ValidateAsync();

        // カテゴリー「SYSTEM」の設定一覧を取得
        var result = await _coreRepo.GetConfigsByCategoryAsync("SYSTEM");
        return new Response(result);
    }

    private async Task ValidateAsync()
    {
        // 管理者権限チェック
        BusinessException.ThrowIf(_user.plan_type != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }

}