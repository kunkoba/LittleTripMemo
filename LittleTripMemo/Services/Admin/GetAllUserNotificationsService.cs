using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class GetAllUserNotificationsService : _BaseService
{
    private readonly SysUserNotificationRepository _repo;

    public record Request(int limit = 100);
    public record Response(IEnumerable<DtoUserNotification> userMailList);

    public GetAllUserNotificationsService(UserContext u, SysUserNotificationRepository r) : base(u) => _repo = r;

    public async Task<Response> ExecuteAsync(Request req)
    {
        // 1. 検証
        await ValidateAsync();

        // 2. 実行
        var result = await _repo.GetAllAsync(req.limit);
        return new Response(result);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }
}