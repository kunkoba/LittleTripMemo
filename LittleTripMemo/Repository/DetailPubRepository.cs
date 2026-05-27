using Dapper;
using LittleTripMemo.Common;
using LittleTripMemo.Models;
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
        var loginUserId = _user.UserId;

        string sql = $@"
            SELECT 
                d.*,
                COALESCE(r.count_funny, 0)   AS count_funny,
                COALESCE(r.count_love, 0)    AS count_love,
                COALESCE(r.count_surprise, 0)AS count_surprise,
                COALESCE(r.count_sad, 0)     AS count_sad
            FROM t_memo_detail_pub d
            LEFT JOIN (
                SELECT 
                    archive_id,
                    seq,
                    COUNT(CASE WHEN reaction_type = 1 THEN 1 END) as count_funny,
                    COUNT(CASE WHEN reaction_type = 2 THEN 1 END) as count_love,
                    COUNT(CASE WHEN reaction_type = 3 THEN 1 END) as count_surprise,
                    COUNT(CASE WHEN reaction_type = 4 THEN 1 END) as count_sad
                FROM t_reaction_pub
                WHERE user_id <> @login_user_id
                GROUP BY archive_id, seq
            ) r
                ON d.archive_id = r.archive_id
                AND d.seq        = r.seq
            WHERE d.del_flg = false
                AND d.archive_id = @archive_id
            ORDER BY d.memo_date ASC, d.memo_time ASC";

        return await QueryAsync<TMemoDetailPub>(sql, new
        {
            archive_id = archiveId,
            login_user_id = loginUserId
        });
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
    /// 管理者権限で削除
    /// </summary>
    /// <param name="archiveId"></param>
    /// <param name="targetUserId"></param>
    /// <returns></returns>
    public async Task<int> AdminDeletePhysicalByArchiveIdAsync(int archiveId, Guid targetUserId)
    {
        const string sql = @"
        DELETE FROM t_memo_detail_pub 
        WHERE archive_id = @archive_id 
          AND user_id    = @target_user_id"; // 所有者チェック追加

        return await ExecuteAsync(sql, new { archive_id = archiveId, target_user_id = targetUserId });
    }

    /// <summary>
    /// 通常検索（軽量）：作成順(1) または 更新順(2)
    /// </summary>
    public async Task<IEnumerable<TMemoDetailPub>> GetByLocationBasicAsync(
        decimal latMin, decimal latMax, decimal lngMin, decimal lngMax,
        string? keyword, int sortField, Guid loginUserId, int limit = 50)
    {
        var parameters = new DynamicParameters();
        parameters.Add("lat_min", latMin); parameters.Add("lat_max", latMax);
        parameters.Add("lng_min", lngMin); parameters.Add("lng_max", lngMax);
        parameters.Add("login_user_id", loginUserId);
        parameters.Add("limit", limit);

        // ソート句の決定
        string orderBy = sortField == 2 ? "d.update_tim DESC" : "d.create_tim DESC";

        var sql = $@"
        SELECT d.*, a.title AS a_title
        FROM t_memo_detail_pub d
        INNER JOIN t_memo_archive_pub a ON d.archive_id = a.archive_id
        WHERE d.latitude  BETWEEN @lat_min AND @lat_max
          AND d.longitude BETWEEN @lng_min AND @lng_max
          AND d.user_id   <> @login_user_id
          AND d.del_flg   = false
          AND a.closed_flg = false";

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            sql += " AND (d.body ILIKE @keyword OR d.title ILIKE @keyword)";
            parameters.Add("keyword", $"%{keyword}%");
        }

        sql += $" ORDER BY {orderBy} LIMIT @limit";

        return await QueryAsync<TMemoDetailPub>(sql, parameters);
    }

    /// <summary>
    /// ランキング検索（重め）：リアクション順(3)
    /// </summary>
    public async Task<IEnumerable<TMemoDetailPub>> GetByLocationRankAsync(
        decimal latMin, decimal latMax, decimal lngMin, decimal lngMax,
        string? keyword, int reactionType, Guid loginUserId, int limit = 50)
    {
        var parameters = new DynamicParameters();
        parameters.Add("lat_min", latMin); parameters.Add("lat_max", latMax);
        parameters.Add("lng_min", lngMin); parameters.Add("lng_max", lngMax);
        parameters.Add("login_user_id", loginUserId);
        parameters.Add("limit", limit);

        // リアクション種別に応じたソートカラム
        string orderCol = reactionType switch
        {
            1 => "count_funny",
            2 => "count_helpful",
            3 => "count_surprise",
            4 => "count_empathy",
            _ => "count_funny"
        };

        var sql = $@"
        SELECT d.*, a.title AS a_title,
            COUNT(CASE WHEN r.reaction_type = 1 THEN 1 END) as count_funny,
            COUNT(CASE WHEN r.reaction_type = 2 THEN 1 END) as count_helpful,
            COUNT(CASE WHEN r.reaction_type = 3 THEN 1 END) as count_surprise,
            COUNT(CASE WHEN r.reaction_type = 4 THEN 1 END) as count_empathy
        FROM t_memo_detail_pub d
        INNER JOIN t_memo_archive_pub a ON d.archive_id = a.archive_id
        LEFT JOIN t_reaction_pub r ON d.archive_id = r.archive_id AND d.seq = r.seq
        WHERE d.latitude  BETWEEN @lat_min AND @lat_max
          AND d.longitude BETWEEN @lng_min AND @lng_max
          AND d.user_id   <> @login_user_id
          AND d.del_flg   = false
          AND a.closed_flg = false";

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            sql += " AND (d.body ILIKE @keyword OR d.title ILIKE @keyword)";
            parameters.Add("keyword", $"%{keyword}%");
        }

        sql += $@" GROUP BY d.archive_id, d.seq, a.title
               ORDER BY {orderCol} DESC LIMIT @limit";

        return await QueryAsync<TMemoDetailPub>(sql, parameters);
    }

}