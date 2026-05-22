using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using Microsoft.AspNetCore.Identity;

namespace LittleTripMemo.Services.Sys;

public class AdminUnpublishArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;
    private readonly UserManager<MyAppUser> _userManager;

    public record Request(int archive_id, Guid target_user_id);
    public record Response(bool is_success);

    public AdminUnpublishArchiveService(
        UserContext u, ITransactionProvider p,
        ArchivePubRepository ap, DetailPubRepository dp,
        ArchiveRepository ar, DetailRepository dr,
        UserManager<MyAppUser> um) : base(u)
    {
        _provider = p; _archivePubRepo = ap; _detailPubRepo = dp;
        _archiveRepo = ar; _detailRepo = dr; _userManager = um;
    }

    public async Task<Response> ExecuteAsync(Request req)
    {
        await ValidateAsync(req);

        // 対象ユーザーの情報を取得（TableId特定のため）
        var targetUser = await _userManager.FindByIdAsync(req.target_user_id.ToString());
        BusinessException.ThrowIf(targetUser == null, "対象ユーザーが見つかりません");

        using var tran = _provider.BeginTransaction();
        try
        {
            // 1. 公開側を物理削除
            await _detailPubRepo.AdminDeletePhysicalByArchiveIdAsync(req.archive_id, req.target_user_id);
            await _archivePubRepo.AdminDeletePhysicalByKeyAsync(req.archive_id, req.target_user_id);

            // 2. 秘密側を復元（論理削除解除）
            await _archiveRepo.AdminRestoreByKeyAsync(req.archive_id, req.target_user_id);
            await _detailRepo.AdminRestoreByKeyAsync(req.archive_id, req.target_user_id, targetUser.TableId);

            tran.Commit();
            return new Response(true);
        }
        catch { throw; }
    }

    private async Task ValidateAsync(Request req)
    {
        BusinessException.ThrowIf(_user.Plan != PlanType.Admin.ToString(), "管理者権限が必要です");
        BusinessException.ThrowIf(req.archive_id == 0 || req.target_user_id == Guid.Empty, "パラメータが不正です");
        await Task.CompletedTask;
    }
}