// Services/DeleteStrayDetailsService.cs

using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

/// <summary>
/// 未まとめ明細（archive_id=0）を削除（論理削除）するサービス
/// </summary>
public class DeleteStrayDetailsService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly DetailRepository _detailRepo;

    public record DeleteStrayDetailsReq(
        [Required] Guid login_user_id,
        [Required(ErrorMessage = "削除対象のseqリストは必須です")] int[] seqs
    ) : ILoginUserRequest;

    public record Response(int deletedCount);

    public DeleteStrayDetailsService(
        UserContext userContext,
        ITransactionProvider provider,
        DetailRepository detailRepo) : base(userContext)
    {
        _provider = provider;
        _detailRepo = detailRepo;
    }

    public async Task<Response> ExecuteAsync(DeleteStrayDetailsReq req)
    {
        BusinessException.ThrowIf(req.seqs.Length == 0, "削除対象が選択されていません。");

        using var tran = _provider.BeginTransaction();
        try
        {
            var count = await _detailRepo.DeleteStrayBySeqsAsync(req.seqs);
            tran.Commit();
            return new Response(count);
        }
        catch
        {
            throw;
        }
    }

}