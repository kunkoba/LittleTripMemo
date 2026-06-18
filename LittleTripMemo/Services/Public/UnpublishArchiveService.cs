using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Sys;
using LittleTripMemo.Services;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Public;

public class UnpublishArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ReactionPubRepository _reactionPubRepo;
    private readonly SysReportRepository _reportRepo;
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;

    public record UnpublishArchiveReq(
        [Required] Guid login_user_id,
        int archive_id
    ) : ILoginUserRequest;

    public record Response(int archiveId);

    public UnpublishArchiveService(
        UserContext userContext,
        ITransactionProvider provider,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo,
        ReactionPubRepository reactionPubRepo, 
        SysReportRepository reportRepo,       
        DetailRepository detailRepo,
        ArchiveRepository archiveRepo)
        : base(userContext)
    {
        _provider = provider;
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
        _reactionPubRepo = reactionPubRepo; 
        _reportRepo = reportRepo;           
        _archiveRepo = archiveRepo;
        _detailRepo = detailRepo;
    }

    public async Task<Response> ExecuteAsync(UnpublishArchiveReq req)
    {
        await ValidateAsync(req);

        // トランザクション開始
        using var tran = _provider.BeginTransaction();
        try
        {
            // 所有権の確認（公開親からデータを取得してチェック）
            var archive = await _archivePubRepo.GetByKeyAsync(req.archive_id);
            BusinessException.ThrowIf(archive == null || archive.user_id != _user.login_user_id, 
                "対象のアーカイブが見つからないか、権限がありません。");

            // 公開明細・アーカイブを論理削除
            await _detailPubRepo.DeleteLogicalByArchiveIdAsync(req.archive_id);
            await _archivePubRepo.DeleteLogicalByKeyAsync(req.archive_id);

            // リアクションも論理削除（1ヶ月保持のため）
            await _reactionPubRepo.DeleteLogicalByArchiveIdAsync(req.archive_id);

            // 秘密アーカイブ・明細の論理削除を復元
            await _archiveRepo.RestoreByKeyAsync(req.archive_id);
            await _detailRepo.RestoreByKeyAsync(req.archive_id);

            tran.Commit();
            return new Response(req.archive_id);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(UnpublishArchiveReq req)
    {
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }

}