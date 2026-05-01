using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;

public class GetReportSummaryService : _BaseService
{
    private readonly SysReportRepository _repo;
    public record GetReportSummaryReq(int min_count);
    public record Response(IEnumerable<DtoReportSummary> list);

    public GetReportSummaryService(UserContext user, SysReportRepository repo) : base(user) => _repo = repo;

    public async Task<Response> ExecuteAsync(GetReportSummaryReq req)
    {
        await ValidateAsync();
        var result = await _repo.GetReportSummaryAsync(req.min_count);
        return new Response(result);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }
}