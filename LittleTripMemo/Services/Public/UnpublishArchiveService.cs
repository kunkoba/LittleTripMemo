using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;

public class UnpublishArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ArchiveRepository _archiveRepo;

    public record UnpublishArchiveReq(int archive_id);
    public record Response(int archiveId);

    public UnpublishArchiveService(
        UserContext userContext,
        ITransactionProvider provider,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo,
        ArchiveRepository archiveRepo)
        : base(userContext)
    {
        _provider = provider;
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
        _archiveRepo = archiveRepo;
    }

    public async Task<Response> ExecuteAsync(UnpublishArchiveReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            // ① 公開明細を物理削除
            await _detailPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
            // ② 公開アーカイブを物理削除
            await _archivePubRepo.DeletePhysicalByKeyAsync(req.archive_id);
            // ③ 秘密アーカイブの論理削除を戻す
            await _archiveRepo.RestoreByKeyAsync(req.archive_id);

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
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}