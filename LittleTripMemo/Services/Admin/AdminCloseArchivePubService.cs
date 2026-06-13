using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Sys;

public class AdminCloseArchivePubService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly SysUserNotificationRepository _userNoteRepo; 

    // 安全のため target_user_id を必須に
    public record AdminCloseArchivePubReq(
        [Required] Guid login_user_id, // ★ 追加
        int archive_id, 
        Guid target_user_id
    ) : ILoginUserRequest; // ★ インターフェースを実装

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

    public async Task<Response> ExecuteAsync(AdminCloseArchivePubReq req)
    {
        // 1. 検証
        await ValidateAsync(req);

        var archive = await _archivePubRepo.GetByKeyAsync(req.archive_id);
        if (archive == null || archive.user_id != req.target_user_id) return new Response(false);

        // 2. 実行（一括処理のためトランザクション開始）
        using var tran = _provider.BeginTransaction();
        try
        {
            // ① 強制クローズ実行
            int affected = await _archivePubRepo.AdminCloseByKeyAsync(req.archive_id, req.target_user_id);

            // 対象が見つからない（ID間違い等）場合は通知を送らず終了
            if (affected == 0) return new Response(false);

            // ② 個人通知送信（タイトルを含める）
            await _userNoteRepo.InsertAsync(new TSysUserNotification
            {
                user_id = req.target_user_id,
                kind = (short)UserNotificationKind.Caution, // 8
                body = $"【警告】公開中のまとめ『{archive.title}』が規約制限により運営側で非公開に設定されました。\n内容を確認・修正してください。"
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

    private async Task ValidateAsync(AdminCloseArchivePubReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが不正です");
        BusinessException.ThrowIf(req.target_user_id == Guid.Empty, "ターゲットユーザーIDが不正です");

        await Task.CompletedTask;
    }
}