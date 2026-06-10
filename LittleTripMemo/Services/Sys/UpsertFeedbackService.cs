using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class UpsertFeedbackService : _BaseService
{
    private readonly SysFeedbackRepository _repo;
    private readonly SysUserNotificationRepository _userNoteRepo; // ★追加
    private readonly ITransactionProvider _provider;           // ★トランザクション用に追加

    // 前回の修正方針に合わせ ILoginUserRequest を実装
    public record UpsertFeedbackReq(Guid login_user_id, string? body, int score) : ILoginUserRequest;
    public record Response(bool is_success);

    public UpsertFeedbackService(
        UserContext user,
        SysFeedbackRepository repo,
        SysUserNotificationRepository userNoteRepo, // ★追加
        ITransactionProvider provider               // ★追加
    ) : base(user)
    {
        _repo = repo;
        _userNoteRepo = userNoteRepo;
        _provider = provider;
    }

    public async Task<Response> ExecuteAsync(UpsertFeedbackReq req)
    {
        await ValidateAsync(req);

        // 2. 実行（フィードバックと通知をセットで行うためトランザクション開始）
        using var tran = _provider.BeginTransaction();
        try
        {
            // ① 初回投稿かどうかをチェック（既存データがあるか）
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
                    kind = (short)UserNotificationKind.Info, // 1: 通常
                    body = "フィードバックありがとうございます！\nいただいた内容はアプリの改善に役立てさせていただきます。今後ともよろしくお願いいたします。🌻",
                });
            }

            tran.Commit();
            return new Response(true);
        }
        catch
        {
            // ロールバックは provider が自動で行う
            throw;
        }
    }

    private async Task ValidateAsync(UpsertFeedbackReq req)
    {
        // 権限チェック
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(req.score < 1 || req.score > 5, "スコアは1~5の間で指定してください");
        await Task.CompletedTask;
    }

}