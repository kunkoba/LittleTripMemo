using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class GetSystemInfoService : _BaseService
{
    private readonly SysFeedbackRepository _feedbackRepo;
    private readonly SysNotificationRepository _notificationRepo;

    // レスポンス：平均点、最新100件、有効な通知を統合
    public record Response(
        double feedback_average,
        IEnumerable<TSysFeedback> latest_feedbacks,
        IEnumerable<TSysNotification> notifications
    );

    public GetSystemInfoService(
        UserContext userContext,
        SysFeedbackRepository feedbackRepo,
        SysNotificationRepository notificationRepo)
        : base(userContext)
    {
        _feedbackRepo = feedbackRepo;
        _notificationRepo = notificationRepo;
    }

    public async Task<Response> ExecuteAsync()
    {
        // 1. 検証（必要に応じて。システム情報の取得なので基本はスルー可能）
        await ValidateAsync();

        // 2. 並列でデータを取得して効率化
        var avgTask = _feedbackRepo.GetAverageScoreAsync();
        var latestTask = _feedbackRepo.GetLatestFeedbacksAsync();
        var notifyTask = _notificationRepo.GetActiveNotificationsAsync();

        await Task.WhenAll(avgTask, latestTask, notifyTask);

        // 3. 結果をまとめて返却
        return new Response(
            await avgTask,
            await latestTask,
            await notifyTask
        );
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        
        // ✅ 管理者でない場合はエラー（データを返さない）
        BusinessException.ThrowIf(
            _user.Plan != PlanType.Admin.ToString(),
            "この操作には管理者権限が必要です",
            "FORBIDDEN"
        );

        await Task.CompletedTask;
    }
}