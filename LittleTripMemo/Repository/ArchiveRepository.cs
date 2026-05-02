using LittleTripMemo.Models;
using LittleTripMemo.Common;

namespace LittleTripMemo.Repository;

/// <summary>
/// 旅の記録（親）のリポジトリ。
/// 継承元（_BaseRepository）の機能を利用し、モデルのスネークケース定義をそのまま使用する。
/// </summary>
public class ArchiveRepository : _BaseRepository
{
    // コンストラクタ
    public ArchiveRepository(
        ITransactionProvider provider,
        ILogger<ArchiveRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    /// <summary>
    /// 新規保存。モデルのスネークケース・プロパティ（user_id）に直接値をセットする。
    /// </summary>
    public async Task<int> InsertAsync(TMemoArchive archive)
    {
        // ログイン中のユーザーIDを強制セット
        archive.user_id = _user.UserId;

        const string sql = @"
            INSERT INTO t_memo_archive (
                user_id, title, memo, link_url, currency_unit, del_flg, create_tim, update_tim
            ) VALUES (
                @user_id, @title, @memo, @link_url, @currency_unit, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING archive_id";

        // 継承元のラップメソッドを使用。transaction引数の記述は不要。
        return await ExecuteScalarAsync<int>(sql, archive);
    }

    /// <summary>
    /// 主キー（archive_id）による単一更新。
    /// </summary>
    public async Task<int> UpdateByKeyAsync(TMemoArchive archive)
    {
        archive.user_id = _user.UserId;

        const string sql = @"
            UPDATE t_memo_archive SET
                title      = @title,
                memo       = @memo,
                link_url   = @link_url,
                currency_unit = @currency_unit,
                update_tim = CURRENT_TIMESTAMP
            WHERE 
                archive_id = @archive_id 
                AND user_id = @user_id";

        return await ExecuteAsync(sql, archive);
    }

    /// <summary>
    /// 主キー（archive_id）による論理削除。
    /// </summary>
    public async Task<int> DeleteByKeyAsync(int archiveId)
    {
        const string sql = @"
            UPDATE t_memo_archive 
            SET del_flg    = true,
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

    /// <summary>
    /// 一覧取得。スネークケースのモデルへそのままマッピング。
    /// </summary>
    public async Task<IEnumerable<TMemoArchive>> GetAllAsync()
    {
        string sql = $@"
            SELECT a.*,
                COUNT(d.archive_id) AS cnt
            FROM t_memo_archive a
            LEFT JOIN t_memo_detail_{_user.TableId} d
                ON a.archive_id = d.archive_id
            WHERE a.user_id = @user_id
              AND a.del_flg = false
            GROUP BY a.archive_id
            ORDER BY a.create_tim DESC";

        // 取得系も継承元のラッパーを使用
        return await QueryAsync<TMemoArchive>(sql, new { user_id = _user.UserId });
    }

    /// <summary>
    /// 主キー（archive_id）による1件取得。
    /// </summary>
    public async Task<TMemoArchive?> GetByKeyAsync(int archiveId)
    {
        const string sql = @"
            SELECT * FROM t_memo_archive 
            WHERE archive_id = @archive_id 
              AND user_id    = @user_id 
              AND del_flg    = false";

        return await QuerySingleOrDefaultAsync<TMemoArchive>(sql, new
        {
            archive_id = archiveId,
            user_id = _user.UserId
        });
    }

    /// <summary>
    /// 秘密データへ戻す（論理削除の復元）。主キー（archive_id）による更新。
    /// </summary>
    /// <param name="archiveId"></param>
    /// <returns></returns>
    public async Task<int> RestoreByKeyAsync(int archiveId)
    {
        const string sql = @"
        UPDATE t_memo_archive
        SET del_flg    = false,
            update_tim = CURRENT_TIMESTAMP
        WHERE
            archive_id = @archive_id
            AND user_id = @user_id";
        return await ExecuteAsync(sql, new { archive_id = archiveId, user_id = _user.UserId });
    }
}