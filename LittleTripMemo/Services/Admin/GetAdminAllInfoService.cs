using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Services.Admin;
using LittleTripMemo.Services.Sys;

namespace LittleTripMemo.Services.Admin;

/// <summary>
/// 管理者ダッシュボード用の一括情報取得サービス。
/// 既存の4つの管理系サービスを集約します。
/// </summary>
public class GetAdminAllInfoService : _BaseService
{
    private readonly GetAllNotificationsService _notificationsService;
    private readonly GetReportSummaryService _reportSummaryService;
    private readonly GetAllFeedbackService _feedbackService;
    private readonly GetAllUserNotificationsService _userNotificationsService;

    // まとめて取得する際の各サービスのパラメータ
    public record Request();

    // 4つのデータセットを内包するレスポンス
    public record Response(
        IEnumerable<TSysNotification> notifications,
        IEnumerable<DtoReportSummary> reportSummary,
        IEnumerable<DtoFeedbackDetail> feedbackList,
        IEnumerable<DtoUserNotification> userMailList
    );

    public GetAdminAllInfoService(
        UserContext user,
        GetAllNotificationsService notificationsService,
        GetReportSummaryService reportSummaryService,
        GetAllFeedbackService feedbackService,
        GetAllUserNotificationsService userNotificationsService
    ) : base(user)
    {
        _notificationsService = notificationsService;
        _reportSummaryService = reportSummaryService;
        _feedbackService = feedbackService;
        _userNotificationsService = userNotificationsService;
    }

    /// <summary>
    /// サービスからサービスを呼び出す（アグリゲータサービス）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    public async Task<Response> ExecuteAsync(Request req)
    {
        // 1. 検証（管理者権限チェック）
        await ValidateAsync();

        // 2. 並列(WhenAll)ではなく、1つずつ順番に実行する
        // PostgreSQLは1つの接続で同時に複数のコマンドを実行できません
        var resNotes = await _notificationsService.ExecuteAsync(new GetAllNotificationsService.GetAllNotificationsReq(100));
        var resReports = await _reportSummaryService.ExecuteAsync(new GetReportSummaryService.GetReportSummaryReq());
        var resFeedbacks = await _feedbackService.ExecuteAsync(new GetAllFeedbackService.GetAllFeedbackReq(0));
        var resUserNotes = await _userNotificationsService.ExecuteAsync(new GetAllUserNotificationsService.Request(100));

        // 3. 結果の集約
        return new Response(
            resNotes.notifications,
            resReports.reportSummary,
            resFeedbacks.feedbackList,
            resUserNotes.userMailList
        );
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        await Task.CompletedTask;
    }
}