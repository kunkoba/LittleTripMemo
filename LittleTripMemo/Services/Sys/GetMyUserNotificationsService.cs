using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class GetMyUserNotificationsService : _BaseService
{
    private readonly SysUserNotificationRepository _repo;
    public record Response(IEnumerable<TSysUserNotification> notifications);

    public GetMyUserNotificationsService(UserContext u, SysUserNotificationRepository r) : base(u) => _repo = r;

    public async Task<Response> ExecuteAsync()
    {
        // 1. 検証
        await ValidateAsync();

        // 2. 実行
        var list = await _repo.GetByUserIdAsync();
        return new Response(list);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です。ログインしてください。");
        await Task.CompletedTask;
    }
}