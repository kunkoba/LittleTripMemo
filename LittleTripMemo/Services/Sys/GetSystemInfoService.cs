using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class GetSystemInfoService : _BaseService
{
    private readonly SysFeedbackRepository _feedbackRepo;
    private readonly SysNotificationRepository _notificationRepo;

    // レスポンス：平均点、最新100件、有効な通知を統合
    public record Response(
        double score_avg,
        IEnumerable<TSysFeedback> feedbacks,
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

        // 2. 順番に実行（並列実行はエラーになるため）
        var avg = await _feedbackRepo.GetAverageScoreAsync();
        var feedback = await _feedbackRepo.GetFeedbacksAsync();
        var notifications = await _notificationRepo.GetActiveNotificationsAsync();

        return new Response(avg, feedback, notifications);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}