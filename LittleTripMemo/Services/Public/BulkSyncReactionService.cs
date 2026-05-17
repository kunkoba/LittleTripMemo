// Services/BulkSyncReactionService.cs

using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

public class BulkSyncReactionService : _BaseService
{
    private readonly ReactionPubRepository _repo;
    private readonly ITransactionProvider _provider;

    // 1明細ごとのリアクション状態
    public record ReactionSyncItem(
        [Required] int archive_id,
        [Required] long seq,
        bool is_funny,
        bool is_love,
        bool is_surprise,
        bool is_sad
    );

    public record BulkSyncReactionReq(
        [Required] IEnumerable<ReactionSyncItem> items
    );

    public record Response(bool is_success, int updatedCount);

    public BulkSyncReactionService(
        UserContext userContext,
        ITransactionProvider provider,
        ReactionPubRepository repo) : base(userContext)
    {
        _provider = provider;
        _repo = repo;
    }

    public async Task<Response> ExecuteAsync(BulkSyncReactionReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            // アーカイブごとにまとめて削除するためにグループ化
            var groups = req.items.GroupBy(x => x.archive_id);
            int count = 0;

            foreach (var group in groups)
            {
                var archiveId = group.Key;
                var seqs = group.Select(x => x.seq);

                // 1. このアーカイブ内の対象seqの自分のリアクションを一括削除
                await _repo.DeletePhysicalBySeqsAsync(archiveId, seqs);

                // 2. 新しい状態を1つずつ登録
                foreach (var item in group)
                {
                    if (item.is_funny) await _repo.InsertAsync(archiveId, (int)item.seq, 1);
                    if (item.is_love) await _repo.InsertAsync(archiveId, (int)item.seq, 2);
                    if (item.is_surprise) await _repo.InsertAsync(archiveId, (int)item.seq, 3);
                    if (item.is_sad) await _repo.InsertAsync(archiveId, (int)item.seq, 4);
                    count++;
                }
            }

            tran.Commit();
            return new Response(true, count);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(BulkSyncReactionReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(req.items == null || !req.items.Any(), "同期データがありません");
        await Task.CompletedTask;
    }
}