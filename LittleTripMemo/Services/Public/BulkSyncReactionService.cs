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
    private readonly ArchivePubRepository _archivePubRepo;
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
        [Required] Guid login_user_id,
        [Required] IEnumerable<ReactionSyncItem> items
    ) : ILoginUserRequest;

    public record Response(int updatedCount);

    public BulkSyncReactionService(
        UserContext userContext,
        ITransactionProvider provider,
        ReactionPubRepository repo,
        ArchivePubRepository archivePubRepo) : base(userContext)
    {
        _provider = provider;
        _repo = repo;
        _archivePubRepo = archivePubRepo;
    }

    public async Task<Response> ExecuteAsync(BulkSyncReactionReq req)
    {
        await ValidateAsync(req);

        // 1. リクエスト内の全アーカイブIDを抽出し、現在「公開かつオープン」なものだけを取得
        var targetIds = req.items.Select(x => x.archive_id).Distinct();
        var activeIds = (await _archivePubRepo.GetActiveArchiveIdsAsync(targetIds)).ToHashSet();

        using var tran = _provider.BeginTransaction();
        try
        {
            int totalInserted = 0;
            var groups = req.items.GroupBy(x => x.archive_id);

            foreach (var group in groups)
            {
                // 2. 公開状態でなければそのアーカイブのリアクション処理はスキップ
                if (!activeIds.Contains(group.Key)) continue;

                var seqs = group.Select(x => x.seq);
                await _repo.DeletePhysicalBySeqsAsync(group.Key, seqs);

                foreach (var item in group)
                {
                    // 有効なものだけインサート
                    if (item.is_funny) totalInserted += await _repo.InsertAsync(group.Key, (int)item.seq, 1);
                    if (item.is_love) totalInserted += await _repo.InsertAsync(group.Key, (int)item.seq, 2);
                    if (item.is_surprise) totalInserted += await _repo.InsertAsync(group.Key, (int)item.seq, 3);
                    if (item.is_sad) totalInserted += await _repo.InsertAsync(group.Key, (int)item.seq, 4);
                }
            }
            tran.Commit();
            return new Response(totalInserted); // メインテーブル(Reaction)の挿入数を返す
        }
        catch { throw; }
    }

    private async Task ValidateAsync(BulkSyncReactionReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(req.items == null || !req.items.Any(), "同期データがありません");
        await Task.CompletedTask;
    }
}