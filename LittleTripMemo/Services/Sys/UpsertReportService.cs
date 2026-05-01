using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;

public class UpsertReportService : _BaseService
{
    private readonly SysReportRepository _repo;
    public record UpsertReportReq(Guid target_user_id, long archive_id, string? body);
    public record Response(bool is_success);

    public UpsertReportService(UserContext user, SysReportRepository repo) : base(user) => _repo = repo;

    public async Task<Response> ExecuteAsync(UpsertReportReq req)
    {
        await ValidateAsync(req);
        await _repo.InsertAsync(new TSysReport { target_user_id = req.target_user_id, archive_id = req.archive_id, body = req.body });
        return new Response(true);
    }

    private async Task ValidateAsync(UpsertReportReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.target_user_id == Guid.Empty, "対象ユーザーが無効です");
        BusinessException.ThrowIf(req.archive_id <= 0, "対象アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}