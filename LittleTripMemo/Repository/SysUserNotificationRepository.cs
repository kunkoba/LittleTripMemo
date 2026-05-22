using LittleTripMemo.Common;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

public class SysUserNotificationRepository : _BaseRepository
{
    public SysUserNotificationRepository(ITransactionProvider p, ILogger<SysUserNotificationRepository> l, UserContext u) : base(p, l, u) { }

    /// <summary>
    /// メッセージ送信（管理者用）
    /// </summary>
    public async Task<int> InsertAsync(TSysUserNotification note)
    {
        const string sql = @"
            INSERT INTO t_sys_user_notifications (user_id, emoji, body, send_tim)
            VALUES (@user_id, @emoji, @body, CURRENT_TIMESTAMP)";
        return await ExecuteAsync(sql, note);
    }

    /// <summary>
    /// 自分宛てのメッセージ取得
    /// </summary>
    public async Task<IEnumerable<TSysUserNotification>> GetByUserIdAsync()
    {
        const string sql = @"
            SELECT * FROM t_sys_user_notifications 
            WHERE user_id = @user_id 
            ORDER BY send_tim DESC LIMIT 20";
        return await QueryAsync<TSysUserNotification>(sql, new { user_id = _user.UserId });
    }
}