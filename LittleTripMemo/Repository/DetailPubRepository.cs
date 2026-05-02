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

    public async Task<int> InsertAsync(TMemoDetailPub detail)
    {
        detail.user_id = _user.UserId;
        const string sql = @"
            INSERT INTO t_memo_detail_pub (
                archive_id, seq, user_id, latitude, longitude, title, body,
                memo_date, memo_time, face_emoji, weather_code, link_url,
                memo_price, del_flg, create_tim, update_tim
            ) VALUES (
                @archive_id, @seq, @user_id, @latitude, @longitude, @title, @body,
                @memo_date, @memo_time, @face_emoji, @weather_code, @link_url,
                @memo_price, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )";
        return await ExecuteAsync(sql, detail);
    }

    public async Task<int> UpdateByKeyAsync(TMemoDetailPub detail)
    {
        detail.user_id = _user.UserId;

        const string sql = @"
            UPDATE t_memo_detail_pub SET
                latitude     = @latitude,
                longitude    = @longitude,
                title        = @title,
                body         = @body,
                memo_date    = @memo_date,
                memo_time    = @memo_time,
                face_emoji   = @face_emoji,
                weather_code = @weather_code,
                link_url     = @link_url,
                memo_price   = @memo_price,
                update_tim   = CURRENT_TIMESTAMP
            WHERE   seq         = @seq 
                AND archive_id  = @archive_id 
                AND user_id     = @user_id";

        return await ExecuteAsync(sql, detail);
    }

    public async Task<IEnumerable<TMemoDetailPub>> GetByArchiveIdAsync(int archiveId)
    {
        const string sql = @"
            SELECT * FROM t_memo_detail_pub
            WHERE archive_id = @archive_id
              AND del_flg    = false
            ORDER BY memo_date, memo_time";
        return await QueryAsync<TMemoDetailPub>(sql, new { archive_id = archiveId });
    }

    /// <summary>
    /// 物理削除
    /// </summary>
    /// <param name="archiveId"></param>
    /// <returns></returns>
    public async Task<int> DeletePhysicalByArchiveIdAsync(int archiveId)
    {
        const string sql = @"
        DELETE FROM t_memo_detail_pub
        WHERE archive_id = @archive_id
          AND user_id    = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }

    /// <summary>
    /// 緯度経度範囲で明細＋リアクション集計取得
    /// </summary>
    /// <returns></returns>
    public async Task<IEnumerable<TMemoDetailPub>> GetByLocationAsync(
        decimal latMin, decimal latMax,
        decimal lngMin, decimal lngMax,
        int sortField, int? reactionType,
        int limit = 50)
    {
        // ソート句の決定
        string orderBy = sortField switch
        {
            1 => "d.create_tim DESC",
            2 => "d.update_tim DESC",
            3 => reactionType switch
            {
                1 => "count_funny DESC",
                2 => "count_love DESC",
                3 => "count_surprise DESC",
                4 => "count_sad DESC",
                5 => "count_report DESC",
                _ => "d.create_tim DESC"
            },
            _ => "d.create_tim DESC"
        };

        string sql = $@"
            SELECT d.*, a.title AS a_title,
                COUNT(CASE WHEN r.reaction_type = 1 THEN 1 END) as count_funny,
                COUNT(CASE WHEN r.reaction_type = 2 THEN 1 END) as count_love,
                COUNT(CASE WHEN r.reaction_type = 3 THEN 1 END) as count_surprise,
                COUNT(CASE WHEN r.reaction_type = 4 THEN 1 END) as count_sad,
                COUNT(CASE WHEN r.reaction_type = 5 THEN 1 END) as count_report
            FROM t_memo_detail_pub d
            INNER JOIN t_memo_archive_pub a ON d.archive_id = a.archive_id
            LEFT JOIN t_reaction_pub r ON d.archive_id = r.archive_id AND d.seq = r.seq
            WHERE d.latitude  BETWEEN @lat_min AND @lat_max
              AND d.longitude BETWEEN @lng_min AND @lng_max
              AND d.del_flg   = false
              AND a.closed_flg = false
            GROUP BY d.archive_id, d.seq, a.title
            ORDER BY {orderBy}
            LIMIT @limit";

        return await QueryAsync<TMemoDetailPub>(sql, new 
        { 
            lat_min = latMin, 
            lat_max = latMax, 
            lng_min = lngMin, 
            lng_max = lngMax, 
            limit 
        });
    }

}