using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

/// <summary>
/// まとめられた明細をアーカイブから解除し、未まとめ状態に戻すサービス
/// </summary>
public class DetachDetailsService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly DetailRepository _detailRepo;
    private readonly ArchiveRepository _archiveRepo;

    public record DetachDetailsReq(
        [Required] Guid login_user_id,
        [Required(ErrorMessage = "解除対象のseqリストは必須です")] int[] seqs,
        [Required(ErrorMessage = "元のアーカイブIDは必須です")] int archive_id
    ) : ILoginUserRequest;

    public record Response(int detachedCount);

    public DetachDetailsService(
        UserContext userContext,
        ITransactionProvider provider,
        DetailRepository detailRepo,
        ArchiveRepository archiveRepo
    ) : base(userContext)
    {
        _provider = provider;
        _detailRepo = detailRepo;
        _archiveRepo = archiveRepo;
    }

    public async Task<Response> ExecuteAsync(DetachDetailsReq req)
    {
        BusinessException.ThrowIf(req.seqs.Length == 0, "対象が選択されていません。");

        using var tran = _provider.BeginTransaction();
        try
        {
            // archive_id > 0 のものを 0 に更新
            var count = await _detailRepo.DetachBySeqsAsync(req.seqs);

            // ★追加：影響を受けたアーカイブIDのカウントをリフレッシュ
            // ※req に archive_id が含まれている、もしくは明細から特定して渡す
            await _archiveRepo.UpdateDetailCountAsync(req.archive_id);

            tran.Commit();
            return new Response(count);
        }
        catch
        {
            throw;
        }
    }

}