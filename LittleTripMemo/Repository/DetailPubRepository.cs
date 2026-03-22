using LittleTripMemo.Models;
using LittleTripMemo.Common;
namespace LittleTripMemo.Repository;

public class DetailPubRepository : _BaseRepository
{
    public DetailPubRepository(
        ITransactionProvider provider,
        ILogger<DetailPubRepository> logger,
        UserContext user
    ) : base(provider, logger, user) { }

    #region CUD
    public async Task<int> InsertAsync(TMemoDetailPub detail)
    {
        detail.user_id = _user.UserId;
        const string sql = @"
            INSERT INTO t_memo_detail_pub (
                archive_id, seq, user_id, latitude, longitude, title, body,
                memo_date, memo_time, face_emoji, weather_emoji, link_url,
                memo_price, del_flg, create_tim, update_tim
            ) VALUES (
                @archive_id, @seq, @user_id, @latitude, @longitude, @title, @body,
                @memo_date, @memo_time, @face_emoji, @weather_emoji, @link_url,
                @memo_price, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )";
        return await ExecuteAsync(sql, detail);
    }

    public async Task<int> UpdateByKeyAsync(TMemoDetailPub detail)
    {
        detail.user_id = _user.UserId;
        const string sql = @"
            UPDATE t_memo_detail_pub SET
                title      = @title,
                body       = @body,
                link_url   = @link_url,
                memo_price = @memo_price,
                update_tim = CURRENT_TIMESTAMP
            WHERE
                archive_id = @archive_id
                AND seq    = @seq
                AND user_id = @user_id";
        return await ExecuteAsync(sql, detail);
    }

    public async Task<int> DeleteByKeyAsync(int archiveId, int seq)
    {
        const string sql = @"
            UPDATE t_memo_detail_pub
            SET del_flg    = true,
                update_tim = CURRENT_TIMESTAMP
            WHERE
                archive_id = @archive_id
                AND seq    = @seq
                AND user_id = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, seq, user_id = _user.UserId });
    }
    #endregion

    #region R
    public async Task<IEnumerable<TMemoDetailPub>> GetByArchiveIdAsync(int archiveId)
    {
        const string sql = @"
            SELECT * FROM t_memo_detail_pub
            WHERE archive_id = @archive_id
              AND del_flg    = false
            ORDER BY memo_date, memo_time";
        return await QueryAsync<TMemoDetailPub>(sql, new { archive_id = archiveId });
    }
    #endregion

    // 緯度経度範囲で明細＋リアクション集計取得
    public async Task<IEnumerable<TMemoDetailPub>> GetByLocationAsync(
        decimal latMin, decimal latMax,
        decimal lngMin, decimal lngMax,
        int limit = 50)
    {
        const string sql = @"
            SELECT
                d.*,
                COUNT(CASE WHEN r.reaction_type = 1 THEN 1 END) as count_funny,
                COUNT(CASE WHEN r.reaction_type = 2 THEN 1 END) as count_helpful,
                COUNT(CASE WHEN r.reaction_type = 3 THEN 1 END) as count_surprise,
                COUNT(CASE WHEN r.reaction_type = 4 THEN 1 END) as count_empathy
            FROM t_memo_detail_pub d
            LEFT JOIN t_reaction_pub r ON d.archive_id = r.archive_id AND d.seq = r.seq
            WHERE d.latitude  BETWEEN @lat_min AND @lat_max
              AND d.longitude BETWEEN @lng_min AND @lng_max
              AND d.del_flg   = false
              AND d.closed_flg = false
            GROUP BY d.archive_id, d.seq
            LIMIT @limit";

        return await QueryAsync<TMemoDetailPub>(sql, new { lat_min = latMin, lat_max = latMax, lng_min = lngMin, lng_max = lngMax, limit });
    }

    public async Task<int> DeletePhysicalByArchiveIdAsync(int archiveId)
    {
        const string sql = @"
        DELETE FROM t_memo_detail_pub
        WHERE archive_id = @archive_id
          AND user_id    = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }

}