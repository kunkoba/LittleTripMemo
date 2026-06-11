// Services/Sys/UpsertFeedbackService.cs

using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class UpsertFeedbackService : _BaseService
{
    private readonly SysFeedbackRepository _repo;
    private readonly SysUserNotificationRepository _userNoteRepo;
    private readonly ITransactionProvider _provider;

    public record UpsertFeedbackReq(Guid login_user_id, string? body, int score) : ILoginUserRequest;

    // ✅ レスポンスを bool から フィードバックモデル(TSysFeedback) に変更
    public record Response(TSysFeedback? feedback);

    public UpsertFeedbackService(
        UserContext user,
        SysFeedbackRepository repo,
        SysUserNotificationRepository userNoteRepo,
        ITransactionProvider provider
    ) : base(user)
    {
        _repo = repo;
        _userNoteRepo = userNoteRepo;
        _provider = provider;
    }

    public async Task<Response> ExecuteAsync(UpsertFeedbackReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            // ① 初回投稿かどうかをチェック
            var existing = await _repo.GetMyFeedbacksAsync();
            bool isFirstTime = (existing == null);

            // ② フィードバックを保存（Upsert）
            await _repo.UpsertAsync(new TSysFeedback
            {
                user_id = _user.UserId,
                body = req.body,
                score = req.score
            });

            // ③ 初回登録時のみ、個別通知を送信
            if (isFirstTime)
            {
                await _userNoteRepo.InsertAsync(new TSysUserNotification
                {
                    user_id = _user.UserId,
                    kind = (short)UserNotificationKind.Info,
                    body = "フィードバックありがとうございます！\nいただいた内容はアプリの改善に役立てさせていただきます。今後ともよろしくお願いいたします。🌻",
                });
            }

            tran.Commit();

            // ✅ ④ コミット後、最新のフィードバック情報を取得して返却する
            var updatedFeedback = await _repo.GetMyFeedbacksAsync();
            return new Response(updatedFeedback);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(UpsertFeedbackReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(req.score < 1 || req.score > 5, "スコアは1~5の間で指定してください");
        await Task.CompletedTask;
    }
}