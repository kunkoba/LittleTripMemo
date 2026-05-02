using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class GetMyReportService : _BaseService
{
    private readonly SysReportRepository _repo;

    public record GetMyReportReq(long archive_id);
    public record Response(TSysReport? myReport);

    public GetMyReportService(UserContext user, SysReportRepository repo) : base(user)
    {
        _repo = repo;
    }

    public async Task<Response> ExecuteAsync(GetMyReportReq req)
    {
        await ValidateAsync(req);
        var result = await _repo.GetMyReportByArchiveIdAsync(req.archive_id);
        return new Response(result);
    }

    private async Task ValidateAsync(GetMyReportReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id <= 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }

}