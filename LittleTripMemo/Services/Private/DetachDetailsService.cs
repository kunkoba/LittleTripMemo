// Services/DetachDetailsService.cs

using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

/// <summary>
/// まとめられた明細をアーカイブから解除し、未まとめ状態に戻すサービス
/// </summary>
public class DetachDetailsService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly DetailRepository _detailRepo;

    public record DetachDetailsReq(
        [Required] Guid login_user_id,
        [Required(ErrorMessage = "解除対象のseqリストは必須です")] int[] seqs
    ) : ILoginUserRequest;

    public record Response(int detachedCount);

    public DetachDetailsService(
        UserContext userContext,
        ITransactionProvider provider,
        DetailRepository detailRepo) : base(userContext)
    {
        _provider = provider;
        _detailRepo = detailRepo;
    }

    public async Task<Response> ExecuteAsync(DetachDetailsReq req)
    {
        BusinessException.ThrowIf(req.seqs.Length == 0, "対象が選択されていません。");

        using var tran = _provider.BeginTransaction();
        try
        {
            // archive_id > 0 のものを 0 に更新
            var count = await _detailRepo.DetachBySeqsAsync(req.seqs);
            tran.Commit();
            return new Response(count);
        }
        catch
        {
            throw;
        }
    }

}