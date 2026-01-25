
using LittleTripMemo.Models;
using LittleTripMemo.Common;

namespace LittleTripMemo.DataAccess;

/// <summary>
/// 旅の詳細履歴（t_memo_detail_n）用リポジトリ。
/// 動的テーブル生成に対応し、基底クラスを通じてログ・トランザクションを管理する。
/// </summary>
public class HistoryRepository : _BaseRepository
{
    //private readonly Guid _userId;
    //private readonly int _tableId;

    // コンストラクタ
    public HistoryRepository(
        ITransactionProvider provider,
        ILogger<HistoryRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    #region CUD (更新・削除系)

    /// <summary>
    /// 明細登録。モデルのスネークケース（user_id等）をそのままSQLパラメータに使用。
    /// </summary>
    public async Task<int> InsertAsync(TMemoHistory history)
    {
        history.user_id = _user.UserId;

        // _tableId を用いて物理テーブル名を指定
        string sql = $@"
            INSERT INTO t_memo_detail_{_user.TableId.ToString()} (
                archive_id, user_id, latitude, longitude, title, body, 
                memo_date, memo_time, face_id, weather_id, link_url, 
                memo_price, create_tim, update_tim
            ) VALUES (
                @archive_id, @user_id, @latitude, @longitude, @title, @body, 
                @memo_date, @memo_time, @face_id, @weather_id, @link_url, 
                @memo_price, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING seq";

        return await ExecuteScalarAsync<int>(sql, history);
    }

    /// <summary>
    /// 明細更新。
    /// </summary>
    public async Task<int> UpdateAsync(TMemoHistory history)
    {
        history.user_id = _user.UserId;

        string sql = $@"
            UPDATE t_memo_detail_{_user.TableId.ToString()} SET
                latitude = @latitude,
                longitude = @longitude,
                title = @title,
                body = @body,
                memo_date = @memo_date,
                memo_time = @memo_time,
                face_id = @face_id,
                weather_id = @weather_id,
                link_url = @link_url,
                memo_price = @memo_price,
                update_tim = CURRENT_TIMESTAMP
            WHERE 
                seq = @seq 
                AND user_id = @user_id";

        return await ExecuteAsync(sql, history);
    }

    /// <summary>
    /// 論理削除。
    /// </summary>
    public async Task<int> DeleteAsync(int seq)
    {
        string sql = $@"
            UPDATE t_memo_detail_{_user.TableId.ToString()} SET
                del_flg = true,
                update_tim = CURRENT_TIMESTAMP
            WHERE 
                seq = @seq 
                AND user_id = @user_id";

        return await ExecuteAsync(sql, new { seq, user_id = _user.UserId });
    }

    #endregion

    #region Read (取得系)

    /// <summary>
    /// 全明細取得。モデルがスネークケースなので SELECT * でそのまま受ける。
    /// </summary>
    public async Task<IEnumerable<TMemoHistory>> GetAllAsync()
    {
        string sql = $@"
            SELECT * FROM t_memo_detail_{_user.TableId.ToString()} 
            WHERE user_id = @user_id 
              AND del_flg = false 
            ORDER BY memo_date ASC, memo_time ASC";

        return await QueryAsync<TMemoHistory>(sql, new { user_id = _user.UserId });
    }

    /// <summary>
    /// 親ID（archive_id）紐づき取得。
    /// </summary>
    public async Task<IEnumerable<TMemoHistory>> GetByArchiveIdAsync(int archiveId)
    {
        string sql = $@"
            SELECT * FROM t_memo_detail_{_user.TableId.ToString()} 
            WHERE archive_id = @archive_id 
              AND user_id = @user_id 
              AND del_flg = false 
            ORDER BY memo_date ASC, memo_time ASC";

        return await QueryAsync<TMemoHistory>(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }

    #endregion
}

