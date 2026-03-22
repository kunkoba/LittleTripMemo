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

    #region CUD
    public async Task<int> InsertAsync(TMemoArchivePub archive)
    {
        archive.user_id = _user.UserId;
        const string sql = @"
        INSERT INTO t_memo_archive_pub (
            archive_id, user_id, title, memo, link_url, closed_flg, del_flg, create_tim, update_tim
        ) VALUES (
            @archive_id, @user_id, @title, @memo, @link_url, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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
                update_tim = CURRENT_TIMESTAMP
            WHERE
                archive_id = @archive_id
                AND user_id = @user_id";
        return await ExecuteAsync(sql, archive);
    }

    public async Task<int> DeleteByKeyAsync(int archiveId)
    {
        const string sql = @"
            UPDATE t_memo_archive_pub
            SET del_flg    = true,
                update_tim = CURRENT_TIMESTAMP
            WHERE
                archive_id = @archive_id
                AND user_id = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }
    #endregion

    #region R
    public async Task<TMemoArchivePub?> GetByKeyAsync(int archiveId)
    {
        const string sql = @"
            SELECT * FROM t_memo_archive_pub
            WHERE archive_id = @archive_id
              AND del_flg    = false";
        return await QuerySingleOrDefaultAsync<TMemoArchivePub>(sql, new { archive_id = archiveId });
    }
    #endregion

    public async Task<int> DeletePhysicalByKeyAsync(int archiveId)
    {
        const string sql = @"
        DELETE FROM t_memo_archive_pub
        WHERE archive_id = @archive_id
          AND user_id    = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }
}