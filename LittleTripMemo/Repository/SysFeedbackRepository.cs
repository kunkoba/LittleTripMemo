using LittleTripMemo.Models;
using LittleTripMemo.Common;

namespace LittleTripMemo.Repository;

public class SysFeedbackRepository : _BaseRepository
{
    public SysFeedbackRepository(
        ITransactionProvider provider,
        ILogger<SysFeedbackRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    /// <summary>
    /// フィードバックの登録または更新 (Upsert)
    /// </summary>
    public async Task<int> UpsertAsync(TSysFeedback feedback)
    {
        feedback.user_id = _user.UserId;

        const string sql = @"
            INSERT INTO t_sys_feedbacks (
                user_id, 
                body, 
                score, 
                update_tim
            ) VALUES (
                @user_id, 
                @body, 
                @score, 
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (user_id) DO UPDATE SET
                body = EXCLUDED.body,
                score = EXCLUDED.score,
                update_tim = CURRENT_TIMESTAMP";

        return await ExecuteAsync(sql, feedback);
    }

    /// <summary>
    /// フィードバックを範囲指定で取得（更新日時降順）
    /// </summary>
    public async Task<IEnumerable<TSysFeedback>> GetFeedbacksAsync(int offset = 0, int limit = 50)
    {
        const string sql = @"
            SELECT * FROM t_sys_feedbacks 
            ORDER BY update_tim DESC 
            LIMIT @limit OFFSET @offset";

        return await QueryAsync<TSysFeedback>(sql, new { limit, offset });
    }

    /// <summary>
    /// 全体平均スコアを取得
    /// </summary>
    public async Task<double> GetAverageScoreAsync()
    {
        const string sql = "SELECT COALESCE(AVG(score), 0) FROM t_sys_feedbacks";

        return await ExecuteScalarAsync<double>(sql);
    }
}