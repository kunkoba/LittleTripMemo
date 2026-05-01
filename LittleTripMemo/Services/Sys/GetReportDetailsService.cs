using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class GetReportDetailsService : _BaseService
{
    private readonly SysReportRepository _repo;

    public record GetReportDetailsReq(Guid target_user_id, long archive_id);
    public record Response(IEnumerable<TSysReport> reports);

    public GetReportDetailsService(UserContext user, SysReportRepository repo) : base(user)
    {
        _repo = repo;
    }

    public async Task<Response> ExecuteAsync(GetReportDetailsReq req)
    {
        await ValidateAsync();
        var result = await _repo.GetReportsByTargetAsync(req.target_user_id, req.archive_id);
        return new Response(result);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }
}