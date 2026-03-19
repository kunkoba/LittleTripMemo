using LittleTripMemo.Common;
using LittleTripMemo.Models;
using Npgsql;

namespace LittleTripMemo.Repository;

/// <summary>
/// 旅の詳細履歴（t_memo_detail_n）用リポジトリ。
/// 動的テーブル生成に対応し、基底クラスを通じてログ・トランザクションを管理する。
/// </summary>
public class DetailRepository : _BaseRepository
{
    // コンストラクタ
    public DetailRepository(
        ITransactionProvider provider,
        ILogger<DetailRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    #region CUD (更新・削除系)

    /// <summary>
    /// 明細登録。モデルのスネークケース（user_id等）をそのままSQLパラメータに使用。
    /// </summary>
    public async Task<int> InsertAsync(TMemoDetail entity)
    {
        entity.user_id = _user.UserId;

        // _tableId を用いて物理テーブル名を指定
        string sql = $@"
            INSERT INTO t_memo_detail_{_user.TableId} (
                archive_id, user_id, latitude, longitude, title, body, 
                memo_date, memo_time, face_emoji, weather_emoji, link_url, 
                memo_price, create_tim, update_tim
            ) VALUES (
                @archive_id, @user_id, @latitude, @longitude, @title, @body, 
                @memo_date, @memo_time, @face_emoji, @weather_emoji, @link_url, 
                @memo_price, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING seq";

        return await ExecuteScalarAsync<int>(sql, entity);
    }

    /// <summary>
    /// 主キー（seq）による単一更新。
    /// </summary>
    public async Task<int> UpdateByKeyAsync(TMemoDetail entity)
    {
        entity.user_id = _user.UserId;

        string sql = $@"
            UPDATE t_memo_detail_{_user.TableId} SET
                latitude     = @latitude,
                longitude    = @longitude,
                title        = @title,
                body         = @body,
                memo_date    = @memo_date,
                memo_time    = @memo_time,
                face_emoji   = @face_emoji,
                weather_emoji = @weather_emoji,
                link_url     = @link_url,
                memo_price   = @memo_price,
                update_tim   = CURRENT_TIMESTAMP
            WHERE 
                seq     = @seq 
                AND user_id = @user_id";

        return await ExecuteAsync(sql, entity);
    }

    /// <summary>
    /// 一括更新。archive_id に紐づく明細を全件更新し、更新件数を返す。
    /// </summary>
    public async Task<int> UpdateBulkAsync(IEnumerable<TMemoDetail> entities)
    {
        var count = 0;
        foreach (var entity in entities)
        {
            entity.user_id = _user.UserId;

            string sql = $@"
                UPDATE t_memo_detail_{_user.TableId} SET
                    latitude      = @latitude,
                    longitude     = @longitude,
                    title         = @title,
                    body          = @body,
                    memo_date     = @memo_date,
                    memo_time     = @memo_time,
                    face_emoji    = @face_emoji,
                    weather_emoji = @weather_emoji,
                    link_url      = @link_url,
                    memo_price    = @memo_price,
                    update_tim    = CURRENT_TIMESTAMP
                WHERE 
                    seq     = @seq 
                    AND user_id = @user_id";

            count += await ExecuteAsync(sql, entity);
        }
        return count;
    }

    /// <summary>
    /// 主キー（seq）による論理削除。
    /// </summary>
    public async Task<int> DeleteByKeyAsync(int seq)
    {
        string sql = $@"
            UPDATE t_memo_detail_{_user.TableId} SET
                del_flg    = true,
                update_tim = CURRENT_TIMESTAMP
            WHERE 
                seq     = @seq 
                AND user_id = @user_id";

        return await ExecuteAsync(sql, new { seq, user_id = _user.UserId });
    }

    #endregion

    #region Read (取得系)

    /// <summary>
    /// 全明細取得。モデルがスネークケースなので SELECT * でそのまま受ける。
    /// </summary>
    public async Task<IEnumerable<TMemoDetail>> GetAllAsync()
    {
        string sql = $@"
            SELECT * FROM t_memo_detail_{_user.TableId} 
            WHERE user_id = @user_id 
              AND del_flg = false 
            ORDER BY memo_date ASC, memo_time ASC";

        return await QueryAsync<TMemoDetail>(sql, new { user_id = _user.UserId });
    }

    /// <summary>
    /// 親ID（archive_id）紐づき取得。
    /// </summary>
    public async Task<IEnumerable<TMemoDetail>> GetByArchiveIdAsync(int archiveId)
    {
        string sql = $@"
            SELECT * FROM t_memo_detail_{_user.TableId} 
            WHERE archive_id = @archive_id 
              AND user_id    = @user_id 
              AND del_flg    = false 
            ORDER BY memo_date ASC, memo_time ASC";

        return await QueryAsync<TMemoDetail>(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }

    #endregion

    /// <summary>
    /// 指定された seq リストの明細に archive_id をセット。
    /// 条件：seq IN (@seqs) AND archive_id = 0 AND user_id = @user_id
    /// </summary>
    public async Task<int> UpdateArchiveIdBySeqsAsync(int archiveId, int[] seqs)
    {
        string sql = $@"
        UPDATE t_memo_detail_{_user.TableId} SET
            archive_id = @archive_id,
            update_tim = CURRENT_TIMESTAMP
        WHERE 
            seq        = ANY(@seqs)
            AND archive_id = 0
            AND user_id    = @user_id";

        return await ExecuteAsync(sql, new
        {
            archive_id = archiveId,
            seqs,
            user_id = _user.UserId
        });
    }

    /// <summary>
    /// 未まとめ明細取得（archive_id = 0）。
    /// </summary>
    public async Task<IEnumerable<TMemoDetail>> GetUnMergedAsync()
    {
        string sql = $@"
        SELECT * FROM t_memo_detail_{_user.TableId} 
        WHERE archive_id = 0
          AND user_id    = @user_id 
          AND del_flg    = false 
        ORDER BY memo_date ASC, memo_time ASC";

        return await QueryAsync<TMemoDetail>(sql, new { user_id = _user.UserId });
    }

    /// <summary>
    /// 指定されたアーカイブIDに紐づく明細を解放（archive_id = 0 に戻す）
    /// </summary>
    public async Task<int> ReleaseArchiveIdAsync(int archiveId)
    {
        string sql = $@"
            UPDATE t_memo_detail_{_user.TableId} SET
                archive_id = 0,
                update_tim = CURRENT_TIMESTAMP
            WHERE 
                archive_id = @archive_id 
                AND user_id = @user_id";

        return await ExecuteAsync(sql, new
        {
            archive_id = archiveId,
            user_id = _user.UserId
        });
    }

}