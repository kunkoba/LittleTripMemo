using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;

public class UnpublishArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;

    public record UnpublishArchiveReq(int archive_id);
    public record Response(int archiveId);

    public UnpublishArchiveService(
        UserContext userContext,
        ITransactionProvider provider,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo)
        : base(userContext)
    {
        _provider = provider;
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
    }

    public async Task<Response> ExecuteAsync(UnpublishArchiveReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            await _detailPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
            await _archivePubRepo.DeletePhysicalByKeyAsync(req.archive_id);
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