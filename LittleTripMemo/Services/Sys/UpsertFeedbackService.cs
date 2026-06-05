using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;
using System.ComponentModel.DataAnnotations;

public class UpsertFeedbackService : _BaseService
{
    private readonly SysFeedbackRepository _repo;

    public record UpsertFeedbackReq(
        [Required] Guid login_user_id, // ★ 追加
        string? body, 
        int score
    ) : ILoginUserRequest; // ★ インターフェースを実装

    public record Response(bool is_success);

    public UpsertFeedbackService(UserContext user, SysFeedbackRepository repo) : base(user) => _repo = repo;

    public async Task<Response> ExecuteAsync(UpsertFeedbackReq req)
    {
        await ValidateAsync(req);
        await _repo.UpsertAsync(new TSysFeedback { body = req.body, score = req.score });
        return new Response(true);
    }

    private async Task ValidateAsync(UpsertFeedbackReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.score < 1 || req.score > 5, "スコアは1~5の間で指定してください");
        await Task.CompletedTask;
    }
}