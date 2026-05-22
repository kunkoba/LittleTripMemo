using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class AdminCloseArchivePubService : _BaseService
{
    private readonly ArchivePubRepository _archivePubRepo;

    public record Request(int archive_id, Guid target_user_id);
    public record Response(bool is_success);

    public AdminCloseArchivePubService(UserContext u, ArchivePubRepository r) : base(u) => _archivePubRepo = r;

    public async Task<Response> ExecuteAsync(Request req)
    {
        await ValidateAsync();
        await _archivePubRepo.AdminCloseByKeyAsync(req.archive_id, req.target_user_id);
        return new Response(true);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }
}