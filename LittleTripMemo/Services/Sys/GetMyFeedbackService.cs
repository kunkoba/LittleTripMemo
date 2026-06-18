using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.Sys;

namespace LittleTripMemo.Services.Sys;

public class GetMyFeedbackService : _BaseService
{
    private readonly SysFeedbackRepository _repo;

    public record Response(TSysFeedback? myFeedback);

    public GetMyFeedbackService(UserContext user, SysFeedbackRepository repo) : base(user)
    {
        _repo = repo;
    }

    public async Task<Response> ExecuteAsync()
    {
        await ValidateAsync();

        // 1件取得
        var result = await _repo.GetMyFeedbacksAsync();

        return new Response(result);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}