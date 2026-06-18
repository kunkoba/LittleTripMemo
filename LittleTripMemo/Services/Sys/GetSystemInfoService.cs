using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.Sys;

namespace LittleTripMemo.Services.Sys;

public class GetSystemInfoService : _BaseService
{
    private readonly SysFeedbackRepository _feedbackRepo;
    private readonly SysNotificationRepository _notificationRepo;
    private readonly SysUserNotificationRepository _userNoteRepo;
    private readonly SysReportRepository _reportRepo;
    private readonly AppUserRepository _appUserRepo;

    // 統合されたレスポンス構造
    public record SystemInfoData(
        Guid login_user_id,
        double score_avg,
        IEnumerable<DtoFeedbackDetail> feedbacks,
        IEnumerable<TSysNotification> notifications,
        DtoUserProfile? ownerProfile, 
        IEnumerable<TSysUserNotification>? userNotifications,
        IEnumerable<DtoMyReportDetail>? myReports
    );

    // レスポンス形式（systemInfo でラップ）
    public record Response(SystemInfoData systemInfo);

    public GetSystemInfoService(
        UserContext userContext,
        SysFeedbackRepository feedbackRepo,
        SysNotificationRepository notificationRepo,
        SysUserNotificationRepository userNoteRepo,
        SysReportRepository reportRepo,
        AppUserRepository appUserRepo)
        : base(userContext)
    {
        _feedbackRepo = feedbackRepo;
        _notificationRepo = notificationRepo;
        _userNoteRepo = userNoteRepo;
        _reportRepo = reportRepo; 
        _appUserRepo = appUserRepo;
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
        DtoUserProfile? profile = null;
        IEnumerable<TSysUserNotification>? userNotes = null;
        IEnumerable<DtoMyReportDetail>? myReports = null;

        if (_user.login_user_id != Guid.Empty)
        {

            // プロフィールをリポジトリから直接取得
            var user = await _appUserRepo.GetByUserIdAsync(_user.login_user_id);
            if (user != null)
            {
                profile = new DtoUserProfile(
                    user.user_id,
                    user.icon,
                    user.nick_name,
                    user.description,
                    user.link_1, user.link_2, user.link_3,
                    is_owner: true // 自分の情報なので常にtrue
                );
            }

            // 自分宛通知
            userNotes = await _userNoteRepo.GetByUserIdAsync();
            // ユーザ通報情報
            myReports = await _reportRepo.GetMyReportsWithDetailsAsync();
        }

        return new Response(new SystemInfoData(
            _user.login_user_id, avg, feeds, notes, profile, userNotes, myReports
        ));
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}