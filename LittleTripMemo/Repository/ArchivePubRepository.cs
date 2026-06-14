using LittleTripMemo.Models;
using LittleTripMemo.Common;
namespace LittleTripMemo.Repository;

public class ArchivePubRepository : _BaseRepository
{
    public ArchivePubRepository(
        ITransactionProvider provider,
        ILogger<ArchivePubRepository> logger,
        UserContext user
    ) : base(provider, logger, user) { }

    public async Task<int> InsertAsync(TMemoArchivePub archive)
    {
        archive.user_id = _user.UserId;
        const string sql = @"
            INSERT INTO t_memo_archive_pub (
                archive_id, user_id, title, memo, link_url, currency_unit, closed_flg, del_flg, create_tim, update_tim
            ) VALUES (
                @archive_id, @user_id, @title, @memo, @link_url, @currency_unit, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )";
        return await ExecuteAsync(sql, archive);
    }

    public async Task<int> UpdateByKeyAsync(TMemoArchivePub archive)
    {
        archive.user_id = _user.UserId;

        const string sql = @"
            UPDATE t_memo_archive_pub SET
                title      = @title,
                memo       = @memo,
                link_url   = @link_url,
                currency_unit = @currency_unit,
                update_tim = CURRENT_TIMESTAMP
            WHERE
                archive_id = @archive_id
                AND user_id = @user_id
                AND closed_flg = @closed_flg
                AND del_flg    = false";
        
        return await ExecuteAsync(sql, archive);
    }

    public async Task<TMemoArchivePub?> GetByKeyAsync(int archiveId)
    {
        const string sql = @"
            SELECT * FROM t_memo_archive_pub
            WHERE archive_id = @archive_id
              AND del_flg    = false";
        return await QuerySingleOrDefaultAsync<TMemoArchivePub>(sql, new { archive_id = archiveId });
    }

    public async Task<int> DeletePhysicalByKeyAsync(int archiveId)
    {
        const string sql = @"
        DELETE FROM t_memo_archive_pub
        WHERE archive_id = @archive_id
          AND user_id    = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }

    public async Task<int> OpenByKeyAsync(int archiveId)
    {
        const string sql = @"
        UPDATE t_memo_archive_pub
        SET closed_flg = false,
            update_tim = CURRENT_TIMESTAMP
        WHERE archive_id = @archive_id
          AND user_id    = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }

    public async Task<int> CloseByKeyAsync(int archiveId)
    {
        const string sql = @"
        UPDATE t_memo_archive_pub
        SET closed_flg = true,
            update_tim = CURRENT_TIMESTAMP
        WHERE archive_id = @archive_id
          AND user_id    = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }

    /// <summary>
    /// 管理者による強制クローズ（closed_flg = true）
    /// </summary>
    /// <param name="archiveId"></param>
    /// <param name="targetUserId"></param>
    /// <returns></returns>
    public async Task<int> AdminCloseByKeyAsync(int archiveId, Guid targetUserId)
    {
        const string sql = @"
        UPDATE t_memo_archive_pub 
        SET closed_flg = true, 
            update_tim = CURRENT_TIMESTAMP 
        WHERE archive_id = @archive_id 
          AND user_id    = @target_user_id"; // 所有者チェック追加

        return await ExecuteAsync(sql, new { archive_id = archiveId, target_user_id = targetUserId });
    }

    /// <summary>
    /// 管理者による物理削除
    /// </summary>
    /// <param name="archiveId"></param>
    /// <param name="targetUserId"></param>
    /// <returns></returns>
    public async Task<int> AdminDeletePhysicalByKeyAsync(int archiveId, Guid targetUserId)
    {
        const string sql = @"
        DELETE FROM t_memo_archive_pub 
        WHERE archive_id = @archive_id 
          AND user_id    = @target_user_id"; // 所有者チェック追加

        return await ExecuteAsync(sql, new { archive_id = archiveId, target_user_id = targetUserId });
    }

    /// <summary>
    /// 他の公開アーカイブ用ID一括チェック
    /// </summary>
    /// <param name="ids"></param>
    /// <returns></returns>
    public async Task<IEnumerable<int>> GetActiveArchiveIdsAsync(IEnumerable<int> ids)
    {
        const string sql = @"
        SELECT archive_id 
        FROM t_memo_archive_pub 
        WHERE archive_id = ANY(@ids) 
          AND del_flg    = false 
          AND closed_flg = false";

        return await QueryAsync<int>(sql, new { ids = ids.ToArray() });
    }

    /// <summary>
    /// 明細件数を更新
    /// </summary>
    /// <param name="archiveId"></param>
    /// <returns></returns>
    public async Task UpdateDetailCountAsync(int archiveId)
    {
        const string sql = @"
        UPDATE t_memo_archive_pub a
        SET detail_count = (
            SELECT count(*) 
            FROM t_memo_detail_pub d 
            WHERE d.archive_id = a.archive_id 
              AND d.del_flg = false
        )
        WHERE a.archive_id = @archive_id";

        await ExecuteAsync(sql, new { archive_id = archiveId });
    }

    /// <summary>
    /// 一覧取得
    /// </summary>
    /// <returns></returns>
    public async Task<IEnumerable<TMemoArchivePub>> GetAllAsync()
    {
        const string sql = @"
        SELECT * FROM t_memo_archive_pub
        WHERE user_id = @user_id
          AND del_flg = false
        ORDER BY create_tim DESC";

        return await QueryAsync<TMemoArchivePub>(sql, new { user_id = _user.UserId });
    }
}