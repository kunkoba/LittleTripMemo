using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class GetMyFeedbackService : _BaseService
{
    private readonly SysFeedbackRepository _repo;

    // 返却件数は1件だが、規約に従い IEnumerable で定義
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
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}