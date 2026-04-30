using LittleTripMemo.Models;
using LittleTripMemo.Common;

namespace LittleTripMemo.Repository;

public class SysNotificationRepository : _BaseRepository
{
    public SysNotificationRepository(
        ITransactionProvider provider,
        ILogger<SysNotificationRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    /// <summary>
    /// 現在の表示期間内にある有効なお知らせを全件取得
    /// </summary>
    public async Task<IEnumerable<TSysNotification>> GetActiveNotificationsAsync()
    {
        const string sql = @"
            SELECT * FROM t_app_notifications 
            WHERE CURRENT_TIMESTAMP BETWEEN disp_from AND disp_to 
              AND kind > 0
            ORDER BY update_tim DESC";

        return await QueryAsync<TSysNotification>(sql);
    }

    /// <summary>
    /// お知らせの登録または更新 (Upsert)
    /// seq が 0 の場合は新規登録、0以外の場合は更新を行う
    /// </summary>
    public async Task<int> UpsertAsync(TSysNotification notification)
    {
        const string sql = @"
            INSERT INTO t_app_notifications (
                seq, 
                title, 
                body, 
                kind, 
                disp_from, 
                disp_to, 
                update_tim
            ) VALUES (
                CASE WHEN @seq = 0 THEN nextval('t_app_notifications_seq_seq') ELSE @seq END, 
                @title, 
                @body, 
                @kind, 
                @disp_from, 
                @disp_to, 
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (seq) DO UPDATE SET
                title = EXCLUDED.title,
                body = EXCLUDED.body,
                kind = EXCLUDED.kind,
                disp_from = EXCLUDED.disp_from,
                disp_to = EXCLUDED.disp_to,
                update_tim = CURRENT_TIMESTAMP";

        return await ExecuteAsync(sql, notification);
    }

}