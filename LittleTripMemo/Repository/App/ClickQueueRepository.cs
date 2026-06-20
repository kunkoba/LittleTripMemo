using LittleTripMemo.Common;

namespace LittleTripMemo.Repository.App;

public class ClickQueueRepository : _BaseRepository
{
    public ClickQueueRepository(ITransactionProvider p, ILogger<ClickQueueRepository> l, UserContext u) : base(p, l, u) { }

    /// <summary>
    /// クリック情報を一時テーブル（キュー）に保存
    /// </summary>
    public async Task InsertQueueAsync(int targetType, Guid targetUserId, int? archiveId, long? seq, string itemName, Guid? viewerId)
    {
        const string sql = @"
            INSERT INTO tmp_click_queue (
                target_type, target_user_id, archive_id, seq, item_name, viewer_user_id, create_tim
            ) VALUES (
                @targetType, @targetUserId, @archiveId, @seq, @itemName, @viewerId, CURRENT_TIMESTAMP
            )";

        await ExecuteAsync(sql, new { targetType, targetUserId, archiveId, seq, itemName, viewerId });
    }

}