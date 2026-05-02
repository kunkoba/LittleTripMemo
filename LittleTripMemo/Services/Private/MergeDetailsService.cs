using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

/// <summary>
/// 日々の明細をまとめてアーカイブを作成するユースケース。
/// 1. t_memo_archive を新規作成（archive_id を取得）
/// 2. 指定された seq の明細に archive_id をセット
/// </summary>
public class MergeDetailsService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;

    public record MergeDetailsReq(
        [Required(ErrorMessage = "seqリストは必須です")] int[] seqs,
        [Required(ErrorMessage = "タイトルは必須です")][StringLength(100)] string title
    );

    public record Response(int archiveId, int updatedCount);

    public MergeDetailsService(
        UserContext userContext,
        ITransactionProvider provider,
        ArchiveRepository archiveRepo,
        DetailRepository detailRepo)
        : base(userContext)
    {
        _provider = provider;
        _archiveRepo = archiveRepo;
        _detailRepo = detailRepo;
    }

    /// <summary>
    /// 実行（1.検証 → 2.archive作成 → 3.detail更新）
    /// </summary>
    public async Task<Response> ExecuteAsync(MergeDetailsReq req)
    {
        // 1. 検証
        await ValidateAsync(req);

        // 2. 実行
        using var tran = _provider.BeginTransaction();
        try
        {
            // 2-1. archive を新規作成して archive_id を取得
            var archiveId = await _archiveRepo.InsertAsync(new TMemoArchive
            {
                title    = req.title,
                memo     = "メモ全体に対する説明を入力してください",
                link_url = ""
            });

            // 2-2. 対象の明細に archive_id をセット
            var updatedCount = await _detailRepo.UpdateArchiveIdBySeqsAsync(archiveId, req.seqs);

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
    private async Task ValidateAsync(MergeDetailsReq req)
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.seqs.Length == 0, "seqリストが空です");
        await Task.CompletedTask;
    }
}