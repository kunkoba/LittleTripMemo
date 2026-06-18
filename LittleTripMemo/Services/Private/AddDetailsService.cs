using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Repository.App;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

/// <summary>
/// 日々の明細をまとめてアーカイブを作成するユースケース。
/// 1. t_memo_archive を新規作成（archive_id を取得）
/// 2. 指定された seq の明細に archive_id をセット
/// </summary>
public class AddDetailsService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly DetailRepository _detailRepo;
    private readonly ArchiveRepository _archiveRepo;

    public record AddDetailsReq(
        [Required] Guid login_user_id,
        [Required(ErrorMessage = "seqリストは必須です")] int[] seqs,
        [Required(ErrorMessage = "archiveIdは必須です")] int archive_id
    ) : ILoginUserRequest;

    public record Response(int archiveId, int updatedCount);

    public AddDetailsService(
        UserContext userContext,
        ITransactionProvider provider,
        DetailRepository detailRepo,
        ArchiveRepository archiveRepo)
        : base(userContext)
    {
        _provider = provider;
        _detailRepo = detailRepo;
        _archiveRepo = archiveRepo;
    }

    /// <summary>
    /// 実行（1.検証 → 2.実行）
    /// </summary>
    public async Task<Response> ExecuteAsync(AddDetailsReq req)
    {
        // 1. 検証
        await ValidateAsync(req);

        // 2. 実行
        using var tran = _provider.BeginTransaction();
        try
        {
            var archiveId = req.archive_id;
            // 対象の明細に 指定のarchive_id をセット
            var updatedCount = await _detailRepo.UpdateArchiveIdBySeqsAsync(archiveId, req.seqs);

            // 親の件数を更新
            await _archiveRepo.UpdateDetailCountAsync(req.archive_id);

            tran.Commit();
            return new Response(archiveId, updatedCount);
        }
        catch
        {
            throw;
        }
    }

    /// <summary>
    /// 1. 検証（業務チェック）
    /// </summary>
    private async Task ValidateAsync(AddDetailsReq req)
    {
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.seqs.Length == 0, "seqリストが空です");
        BusinessException.ThrowIf(req.archive_id == 0, "archiveIdが無効です");
        await Task.CompletedTask;
    }

}