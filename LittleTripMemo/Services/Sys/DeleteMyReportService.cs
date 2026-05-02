using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class DeleteMyReportService : _BaseService
{
    private readonly SysReportRepository _repo;

    public record DeleteMyReportReq(long archive_id);
    public record Response(bool is_success);

    public DeleteMyReportService(UserContext user, SysReportRepository repo) : base(user)
    {
        _repo = repo;
    }

    public async Task<Response> ExecuteAsync(DeleteMyReportReq req)
    {
        await ValidateAsync(req);
        await _repo.DeletePhysicalAsync(req.archive_id);
        return new Response(true);
    }

    private async Task ValidateAsync(DeleteMyReportReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id <= 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}