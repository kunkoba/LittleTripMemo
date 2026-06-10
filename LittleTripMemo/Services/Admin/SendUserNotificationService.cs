using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Admin;

public class SendUserNotificationService : _BaseService
{
    private readonly SysUserNotificationRepository _repo;

    public record Request(
        [Required] Guid login_user_id, // ★ 追加
        Guid target_user_id, 
        short kind, 
        string body
    ) : ILoginUserRequest; // ★ インターフェースを実装

    public record Response(bool is_success);

    public SendUserNotificationService(UserContext u, SysUserNotificationRepository r) : base(u) => _repo = r;

    public async Task<Response> ExecuteAsync(Request req)
    {
        // 1. 検証
        await ValidateAsync(req);

        // 2. 実行
        await _repo.InsertAsync(new TSysUserNotification
        {
            user_id = req.target_user_id,
            kind = req.kind,
            body = req.body
        });

        return new Response(true);
    }

    private async Task ValidateAsync(Request req)
    {
        // 権限チェック
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");

        // 入力チェック
        BusinessException.ThrowIf(req.target_user_id == Guid.Empty, "対象ユーザーIDが不正です");
        BusinessException.ThrowIf(string.IsNullOrWhiteSpace(req.body), "本文は必須です");
        BusinessException.ThrowIf(req.body.Length > 500, "本文が長すぎます（最大500文字）");

        await Task.CompletedTask;
    }
}