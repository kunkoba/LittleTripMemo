using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class GetSystemInfoService : _BaseService
{
    private readonly SysFeedbackRepository _feedbackRepo;
    private readonly SysNotificationRepository _notificationRepo;
    private readonly SysUserNotificationRepository _userNoteRepo;
    private readonly SysReportRepository _reportRepo; // ★DI追加
    private readonly GetUserProfileService _getUserProfileService;

    // 統合されたレスポンス構造
    public record SystemInfoData(
        // --- システム全体（全ユーザー共通） ---
        double score_avg,
        IEnumerable<DtoFeedbackDetail> feedbacks,
        IEnumerable<TSysNotification> notifications,
        GetUserProfileService.Response? ownerProfile,
        IEnumerable<TSysUserNotification>? userNotifications,
        IEnumerable<DtoMyReportDetail>? myReports // ★これを通報履歴として追加
    );

    // レスポンス形式（systemInfo でラップ）
    public record Response(SystemInfoData systemInfo);

    public GetSystemInfoService(
        UserContext userContext,
        SysFeedbackRepository feedbackRepo,
        SysNotificationRepository notificationRepo,
        SysUserNotificationRepository userNoteRepo,
        SysReportRepository reportRepo, // ★DI追加
        GetUserProfileService getUserProfileService)
        : base(userContext)
    {
        _feedbackRepo = feedbackRepo;
        _notificationRepo = notificationRepo;
        _userNoteRepo = userNoteRepo;
        _reportRepo = reportRepo; // ★割り当て
        _getUserProfileService = getUserProfileService;
    }

    public async Task<Response> ExecuteAsync()
    {
        // 検証（必要に応じて。システム情報の取得なので基本はスルー可能）
        await ValidateAsync();

        // 1. システム共通情報の取得（お作法：ValidateAsync は基本スルーでOK）
        var avg = await _feedbackRepo.GetAverageScoreAsync();
        var feeds = await _feedbackRepo.GetAllFeedbacksAsync(0);
        var notes = await _notificationRepo.GetActiveNotificationsAsync();

        // 2. ユーザー固有情報の取得（ログイン時のみ）
        GetUserProfileService.Response? profile = null;
        IEnumerable<TSysUserNotification>? userNotes = null;
        IEnumerable<DtoMyReportDetail>? myReports = null; // ★変数用意

        if (_user.UserId != Guid.Empty)
        {
            // プロフィール取得（既存サービス再利用）
            profile = await _getUserProfileService.ExecuteAsync(_user.UserId);
            // 自分宛通知
            userNotes = await _userNoteRepo.GetByUserIdAsync();
            // ユーザ通報情報
            myReports = await _reportRepo.GetMyReportsWithDetailsAsync(); // ★ここで取得
        }

        return new Response(new SystemInfoData(
            avg, feeds, notes, profile, userNotes, myReports
        ));
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}