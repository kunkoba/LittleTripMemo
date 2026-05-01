using LittleTripMemo.Common;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;

public class GetActiveNotificationsService : _BaseService
{
    private readonly SysNotificationRepository _repo;
    public record Response(IEnumerable<TSysNotification> list);

    public GetActiveNotificationsService(UserContext user, SysNotificationRepository repo) : base(user)
    {
        _repo = repo;
    }

    public async Task<Response> ExecuteAsync()
    {
        await ValidateAsync();
        var result = await _repo.GetActiveNotificationsAsync();
        return new Response(result);
    }

    private async Task ValidateAsync()
    {
        // 誰でも取得可能なため基本チェックのみ
        await Task.CompletedTask;
    }
}