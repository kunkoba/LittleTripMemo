using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;

public class GetMyFeedbackService : _BaseService
{
    private readonly SysFeedbackRepository _repo;
    public record Response(TSysFeedback? feedback);

    public GetMyFeedbackService(UserContext user, SysFeedbackRepository repo) : base(user)
    {
        _repo = repo;
    }

    public async Task<Response> ExecuteAsync()
    {
        await ValidateAsync();
        var result = await _repo.GetMyFeedbackAsync();
        return new Response(result);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}