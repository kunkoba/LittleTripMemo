using LittleTripMemo.Common;
using LittleTripMemo.Models;
using System.Collections.Generic;

namespace LittleTripMemo.Repository.Sys;

/// <summary>
/// アプリ専用ユーザ情報（t_app_user）および
/// ユーザ管理に付随するDB操作を担当するリポジトリ。
/// </summary>
public class AppUserRepository : _BaseRepository
{
    public AppUserRepository(
        ITransactionProvider provider,
        ILogger<AppUserRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    /// <summary>
    /// 業務ユーザ情報の新規登録
    /// </summary>
    public async Task<int> InsertAsync(TAppUser user)
    {
        const string sql = @"
            INSERT INTO t_app_user (
                user_id, 
                table_id, 
                plan_type, 
                icon, 
                nick_name, 
                description, 
                link_1, 
                link_2, 
                link_3,
                create_tim,
                update_tim
            ) VALUES (
                @user_id, 
                @table_id, 
                @plan_type, 
                @icon, 
                @nick_name, 
                @description, 
                @link_1, 
                @link_2, 
                @link_3,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )";
        return await ExecuteAsync(sql, user);
    }

    /// <summary>
    /// ユーザIDによる業務ユーザ情報の取得
    /// </summary>
    public async Task<TAppUser?> GetByUserIdAsync(Guid user_id)
    {
        const string sql = "SELECT * FROM t_app_user WHERE user_id = @user_id";
        return await QuerySingleOrDefaultAsync<TAppUser>(sql, new { user_id });
    }

    /// <summary>
    /// ユーザプロフィールの更新
    /// </summary>
    public async Task<int> UpdateProfileAsync(TAppUser user)
    {
        const string sql = @"
            UPDATE t_app_user SET
                nick_name   = @nick_name,
                icon        = @icon,
                description = @description,
                link_1      = @link_1,
                link_2      = @link_2,
                link_3      = @link_3,
                update_tim  = CURRENT_TIMESTAMP
            WHERE user_id = @user_id";
        return await ExecuteAsync(sql, user);
    }

    /// <summary>
    /// 指定された番号の明細テーブルのレコード件数を統計情報から取得する（高速版）
    /// 旧 AccountRepository からの移行
    /// </summary>
    public async Task<long> GetTableCountAsync(int table_no)
    {
        var table_name = $"t_memo_detail_{table_no}";
        const string sql = @"
            SELECT reltuples::BIGINT 
            FROM pg_class 
            WHERE relname = @table_name";

        return await ExecuteScalarAsync<long>(sql, new { table_name });
    }

}