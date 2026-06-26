using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.Sys;

namespace LittleTripMemo.Services.Sys;

/// <summary>
/// システム全体の共通情報と、ログインユーザー固有のステータスを一括取得するサービス
/// </summary>
public class GetSystemInfoService(
    UserContext userContext,
    SysFeedbackRepository sysFeedbackRepository,
    SysNotificationRepository sysNotificationRepository,
    SysUserNotificationRepository sysUserNotificationRepository,
    SysReportRepository sysReportRepository,
    AppUserRepository appUserRepository
) : _BaseService(userContext)
{
    /// <summary>
    /// システム情報のデータ構造
    /// </summary>
    public record SystemInfoData(
        Guid login_user_id,
        double score_avg,
        IEnumerable<DtoFeedbackDetail> feedbacks,
        IEnumerable<TSysNotification> notifications,
        DtoUserProfile? ownerProfile,
        IEnumerable<TSysUserNotification>? userNotifications,
        IEnumerable<DtoMyReportDetail>? myReports
    );

    public record Response(SystemInfoData systemInfo);

    /// <summary>
    /// システム情報の取得処理を実行する
    /// </summary>
    public async Task<Response> ExecuteAsync()
    {
        // 1. バリデーション
        await ValidateAsync();

        // 2. システム共通情報の取得（未ログインでも取得可能）
        var averageScore = await sysFeedbackRepository.GetAverageScoreAsync();
        var latestFeedbacks = await sysFeedbackRepository.GetAllFeedbacksAsync(0);
        var activeNotifications = await sysNotificationRepository.GetActiveNotificationsAsync();

        // 3. ユーザー固有情報の初期化
        DtoUserProfile? ownerProfile = null;
        IEnumerable<TSysUserNotification>? userNotifications = null;
        IEnumerable<DtoMyReportDetail>? myReports = null;

        // 4. ログイン済みの場合のみ、詳細情報を取得
        if (_user.login_user_id != Guid.Empty)
        {
            // ユーザープロフィールの取得（バッチ集計済みの統計情報を含む）
            var appUser = await appUserRepository.GetByUserIdAsync(_user.login_user_id);
            if (appUser != null)
            {
                ownerProfile = new DtoUserProfile(
                    appUser.user_id,
                    appUser.icon,
                    appUser.nick_name,
                    appUser.description,
                    appUser.link_1,
                    appUser.link_2,
                    appUser.link_3,
                    is_owner: true,
                    appUser.click_stats,
                    appUser.info_stats,     // 秘密側統計
                    appUser.info_stats_pub  // 公開側統計
                );
            }

            // 自分宛ての通知一覧
            userNotifications = await sysUserNotificationRepository.GetByUserIdAsync();
            // 自分が行った通報の状態
            myReports = await sysReportRepository.GetMyReportsWithDetailsAsync();
        }

        // 5. 結果を集約して返却
        return new Response(new SystemInfoData(
            _user.login_user_id,
            averageScore,
            latestFeedbacks,
            activeNotifications,
            ownerProfile,
            userNotifications,
            myReports
        ));
    }

    /// <summary>
    /// 業務バリデーション（基本はスルーだが作法として定義）
    /// </summary>
    private async Task ValidateAsync()
    {
        // 特になし
        await Task.CompletedTask;
    }

}