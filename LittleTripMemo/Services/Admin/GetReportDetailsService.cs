using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class GetReportDetailsService : _BaseService
{
    private readonly SysReportRepository _repo;
    private readonly GetUserProfileService _getUserProfileService; // 追加

    public record GetReportDetailsReq(Guid target_user_id, long archive_id);

    // ★ Response に target_userProfile を追加
    public record Response(
        IEnumerable<DtoReportDetail> reports,
        GetUserProfileService.Response target_userProfile
    );

    public GetReportDetailsService(
        UserContext user,
        SysReportRepository repo,
        GetUserProfileService getUserProfileService) : base(user)
    {
        _repo = repo;
        _getUserProfileService = getUserProfileService;
    }

    public async Task<Response> ExecuteAsync(GetReportDetailsReq req)
    {
        // 1. 検証
        await ValidateAsync();

        // 2. 実行
        // 通報詳細リスト（通報者情報入り）を取得
        var reports = await _repo.GetReportsByTargetAsync(req.target_user_id, req.archive_id);

        // ターゲットユーザーのプロフィールを取得（既存サービスを再利用）
        var targetProfile = await _getUserProfileService.ExecuteAsync(req.target_user_id);

        // 3. マッピング
        return new Response(reports, targetProfile);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }
}