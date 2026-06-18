using Dapper;
using LittleTripMemo.Common;
using LittleTripMemo.Models;
namespace LittleTripMemo.Repository.App;

public class DetailPubRepository : _BaseRepository
{
    public DetailPubRepository(
        ITransactionProvider provider,
        ILogger<DetailPubRepository> logger,
        UserContext user
    ) : base(provider, logger, user) { }

    public async Task<int> InsertAsync(TMemoDetailPub detail)
    {
        detail.user_id = _user.login_user_id;

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
        detail.user_id = _user.login_user_id;

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
        var loginUserId = _user.login_user_id;

        string sql = $@"
            SELECT 
                d.*
            FROM t_memo_detail_pub d
            WHERE d.del_flg = false
              AND d.archive_id = @archive_id
            ORDER BY d.memo_date ASC, d.memo_time ASC, d.seq ASC";

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
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.login_user_id });
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
    /// 地点検索用
    /// </summary>
    /// <param name="latMin"></param>
    /// <param name="latMax"></param>
    /// <param name="lngMin"></param>
    /// <param name="lngMax"></param>
    /// <param name="keyword"></param>
    /// <param name="sortType"></param>
    /// <param name="loginUserId"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    public async Task<IEnumerable<TMemoDetailPub>> SearchByLocationAsync_2(
        decimal latMin, decimal latMax, decimal lngMin, decimal lngMax,
        string? keyword, int sortField, int reactionType, Guid loginUserId, int limit = 20)
    {
        var parameters = new DynamicParameters();
        parameters.Add("lat_min", latMin);
        parameters.Add("lat_max", latMax);
        parameters.Add("lng_min", lngMin);
        parameters.Add("lng_max", lngMax);
        parameters.Add("login_user_id", loginUserId);
        parameters.Add("limit", limit);

        // ソート句の決定
        string orderBy = "d.create_tim DESC"; // デフォルト

        if (sortField == 2)
        {
            orderBy = "d.update_tim DESC";
        }
        else if (sortField == 3)
        {
            // リアクション順。集計済みカラムを指定する
            orderBy = reactionType switch
            {
                1 => "d.count_funny DESC",
                2 => "d.count_love DESC",
                3 => "d.count_surprise DESC",
                4 => "d.count_sad DESC",
                _ => "d.count_funny DESC"
            };
        }

        // リアクションテーブルへのJOIN・GROUP BYが消えて劇的にシンプルに
        var sql = $@"
        SELECT 
            d.*, 
            a.title AS a_title, 
            a.currency_unit
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

        sql += $" ORDER BY {orderBy}, d.seq DESC LIMIT @limit";

        return await QueryAsync<TMemoDetailPub>(sql, parameters);
    }

    /// <summary>
    /// 地点検索用（リアクション種別でのソート・0件除外対応版）
    /// </summary>
    /// <param name="latMin"></param>
    /// <param name="latMax"></param>
    /// <param name="lngMin"></param>
    /// <param name="lngMax"></param>
    /// <param name="keyword"></param>
    /// <param name="sortField"></param>
    /// <param name="reactionType"></param>
    /// <param name="loginUserId"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    public async Task<IEnumerable<TMemoDetailPub>> SearchByLocationAsync(
        decimal latMin, decimal latMax, decimal lngMin, decimal lngMax,
        string? keyword, int sortField, int? reactionType, Guid loginUserId, int limit = 20)
    {
        var parameters = new DynamicParameters();
        parameters.Add("lat_min", latMin);
        parameters.Add("lat_max", latMax);
        parameters.Add("lng_min", lngMin);
        parameters.Add("lng_max", lngMax);
        parameters.Add("login_user_id", loginUserId);
        parameters.Add("limit", limit);

        // 1. 基本となるWHERE句
        string whereClause = @"
            WHERE d.latitude  BETWEEN @lat_min AND @lat_max
              AND d.longitude BETWEEN @lng_min AND @lng_max
              AND d.user_id   <> @login_user_id
              AND d.del_flg   = false
              AND a.closed_flg = false";

        // 2. ソート順と「0件除外」条件の決定
        string orderBy = "d.create_tim DESC";

        if (sortField == 2)
        {
            orderBy = "d.update_tim DESC";
        }
        else if (sortField == 3)
        {
            // 指定されたリアクション種別に応じてソートカラムと「>0」条件をセット
            var (colName, orderQuery) = reactionType switch
            {
                1 => ("count_funny", "d.count_funny DESC"),
                2 => ("count_love", "d.count_love DESC"),
                3 => ("count_surprise", "d.count_surprise DESC"),
                4 => ("count_sad", "d.count_sad DESC"),
                _ => ("count_funny", "d.count_funny DESC")
            };

            orderBy = orderQuery;
            // ★重要：0件のレコードはいらないので条件を追加
            whereClause += $" AND d.{colName} > 0";
        }

        // 3. キーワード検索（あれば追加）
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            whereClause += " AND (d.body ILIKE @keyword OR d.title ILIKE @keyword)";
            parameters.Add("keyword", $"%{keyword}%");
        }

        // 4. 最終的なSQL組み立て
        var sql = $@"
            SELECT 
                d.*, 
                a.title AS a_title, 
                a.currency_unit
            FROM t_memo_detail_pub d
            INNER JOIN t_memo_archive_pub a ON d.archive_id = a.archive_id
            {whereClause}
            ORDER BY {orderBy}, d.seq DESC
            LIMIT @limit";

        return await QueryAsync<TMemoDetailPub>(sql, parameters);
    }

    /// <summary>
    /// 指定された明細(seq)のリアクション数を再集計して t_memo_detail_pub に反映する
    /// </summary>
    public async Task UpdateReactionCountsAsync(int archiveId, long[] seqs)
    {
        const string sql = @"
        UPDATE t_memo_detail_pub
        SET 
            count_funny    = (SELECT count(*) FROM t_reaction_pub r WHERE r.archive_id = t_memo_detail_pub.archive_id AND r.seq = t_memo_detail_pub.seq AND r.has_funny = true),
            count_love     = (SELECT count(*) FROM t_reaction_pub r WHERE r.archive_id = t_memo_detail_pub.archive_id AND r.seq = t_memo_detail_pub.seq AND r.has_love = true),
            count_surprise = (SELECT count(*) FROM t_reaction_pub r WHERE r.archive_id = t_memo_detail_pub.archive_id AND r.seq = t_memo_detail_pub.seq AND r.has_surprise = true),
            count_sad      = (SELECT count(*) FROM t_reaction_pub r WHERE r.archive_id = t_memo_detail_pub.archive_id AND r.seq = t_memo_detail_pub.seq AND r.has_sad = true)
        WHERE archive_id = @archiveId 
          AND user_id    = @user_id
          AND seq = ANY(@seqs)";

        await ExecuteAsync(sql, new { archiveId, seqs, user_id = _user.login_user_id });
    }

    /// <summary>
    /// 【バッチ用】公開明細の全レコードに対し、リアクションテーブルから最新の件数を数え直して上書きする
    /// </summary>
    public async Task UpdateAllReactionCountsAsync()
    {
        const string sql = @"
        UPDATE t_memo_detail_pub d
        SET 
            count_funny    = (SELECT count(*) FROM t_reaction_pub r WHERE r.archive_id = d.archive_id AND r.seq = d.seq AND r.has_funny = true),
            count_love     = (SELECT count(*) FROM t_reaction_pub r WHERE r.archive_id = d.archive_id AND r.seq = d.seq AND r.has_love = true),
            count_surprise = (SELECT count(*) FROM t_reaction_pub r WHERE r.archive_id = d.archive_id AND r.seq = d.seq AND r.has_surprise = true),
            count_sad      = (SELECT count(*) FROM t_reaction_pub r WHERE r.archive_id = d.archive_id AND r.seq = d.seq AND r.has_sad = true)
        WHERE EXISTS (
            SELECT 1 FROM t_reaction_pub r2 WHERE r2.archive_id = d.archive_id AND r2.seq = d.seq
        )";
        // ※リアクションが1件もない明細は更新対象から外すことでSQLを効率化しています

        await ExecuteAsync(sql);
    }
}