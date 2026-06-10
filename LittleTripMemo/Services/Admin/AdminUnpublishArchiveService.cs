using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Sys;

public class AdminUnpublishArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ReactionPubRepository _reactionPubRepo; // 追加
    private readonly SysReportRepository _reportRepo;       // 追加
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;
    private readonly SysUserNotificationRepository _userNoteRepo;
    private readonly UserManager<MyAppUser> _userManager;

    public record Request(
        [Required] Guid login_user_id, // ★ 追加  
        int archive_id, 
        Guid target_user_id
    ) : ILoginUserRequest; // ★ インターフェースを実装

    public record Response(bool is_success);

    public AdminUnpublishArchiveService(
        UserContext u, ITransactionProvider p,
        ArchivePubRepository ap, DetailPubRepository dp,
        ReactionPubRepository rp, SysReportRepository srr,
        ArchiveRepository ar, DetailRepository dr,
        SysUserNotificationRepository un,
        UserManager<MyAppUser> um) : base(u)
    {
        _provider = p; _archivePubRepo = ap; _detailPubRepo = dp;
        _reactionPubRepo = rp; _reportRepo = srr;
        _archiveRepo = ar; _detailRepo = dr;
        _userNoteRepo = un; _userManager = um;
    }

    public async Task<Response> ExecuteAsync(Request req)
    {
        // 1. 検証
        await ValidateAsync(req);

        // 対象ユーザーの情報を取得（TableId特定のため）
        var targetUser = await _userManager.FindByIdAsync(req.target_user_id.ToString());
        BusinessException.ThrowIf(targetUser == null, "対象ユーザーが見つかりません");

        var archive = await _archivePubRepo.GetByKeyAsync(req.archive_id);
        BusinessException.ThrowIf(archive == null || archive.user_id != req.target_user_id, "対象の公開アーカイブが見つかりません");

        // 2. 実行
        using var tran = _provider.BeginTransaction();
        try
        {
            // ① 公開側の所有者限定データを物理削除
            await _detailPubRepo.AdminDeletePhysicalByArchiveIdAsync(req.archive_id, req.target_user_id);
            await _archivePubRepo.AdminDeletePhysicalByKeyAsync(req.archive_id, req.target_user_id);

            // ② ★追加：その記事に紐づくリアクション・通報データを全削除（物理削除）
            await _reactionPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
            await _reportRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);

            // ③ 秘密側を復元（論理削除解除）
            await _archiveRepo.AdminRestoreByKeyAsync(req.archive_id, req.target_user_id);
            await _detailRepo.AdminRestoreByKeyAsync(req.archive_id, req.target_user_id, targetUser.TableId);

            // ④ 対象ユーザーへ個人通知送信（固定文言）
            await _userNoteRepo.InsertAsync(new TSysUserNotification
            {
                user_id = req.target_user_id,
                kind = (short)UserNotificationKind.Warning, // 9
                body = $"【重要】公開中のまとめ『{archive.title}』が規約違反により運営側で公開停止されました。データは「非公開」へ戻され、評価等はリセットされました。"
            });

            tran.Commit();
            return new Response(true);
        }
        catch { throw; }
    }

    private async Task ValidateAsync(Request req)
    {
        // お作法の管理者チェック
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");

        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが不正です");
        BusinessException.ThrowIf(req.target_user_id == Guid.Empty, "ターゲットユーザーIDが不正です");

        await Task.CompletedTask;
    }
}