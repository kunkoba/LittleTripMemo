using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Sys;

public class AdminCloseArchivePubService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly SysUserNotificationRepository _userNoteRepo; // 追加

    // 安全のため target_user_id を必須に
    public record Request(int archive_id, Guid target_user_id);
    public record Response(bool is_success);

    public AdminCloseArchivePubService(
        UserContext u,
        ITransactionProvider p,
        ArchivePubRepository r,
        SysUserNotificationRepository un) : base(u)
    {
        _provider = p;
        _archivePubRepo = r;
        _userNoteRepo = un;
    }

    public async Task<Response> ExecuteAsync(Request req)
    {
        // 1. 検証
        await ValidateAsync(req);

        // 2. 実行（一括処理のためトランザクション開始）
        using var tran = _provider.BeginTransaction();
        try
        {
            // ① 強制クローズ実行
            int affected = await _archivePubRepo.AdminCloseByKeyAsync(req.archive_id, req.target_user_id);

            // 対象が見つからない（ID間違い等）場合は通知を送らず終了
            if (affected == 0) return new Response(false);

            // ② 個人通知送信（固定文言）
            // 以前追加した link_url も活用して、該当記事へ誘導
            await _userNoteRepo.InsertAsync(new TSysUserNotification
            {
                user_id = req.target_user_id,
                emoji = "⚠️",
                body = "【警告】公開中のまとめが規約制限により運営側で非公開（クローズ）に設定されました。内容を確認・修正してください。",
            });

            tran.Commit();
            return new Response(true);
        }
        catch
        {
            // ロールバックは provider が Dispose 時に自動で行うが、例外は再送出
            throw;
        }
    }

    private async Task ValidateAsync(Request req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが不正です");
        BusinessException.ThrowIf(req.target_user_id == Guid.Empty, "ターゲットユーザーIDが不正です");

        await Task.CompletedTask;
    }
}