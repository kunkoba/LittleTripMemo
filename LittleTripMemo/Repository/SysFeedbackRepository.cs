using LittleTripMemo.Models;
using LittleTripMemo.Common;

namespace LittleTripMemo.Repository;

public class FeedbackRepository : _BaseRepository
{
    public FeedbackRepository(
        ITransactionProvider provider,
        ILogger<FeedbackRepository> logger,
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
            INSERT INTO t_app_feedbacks (
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
    /// 自分のフィードバックを取得
    /// </summary>
    public async Task<TSysFeedback?> GetMyFeedbackAsync()
    {
        const string sql = @"
            SELECT * FROM t_app_feedbacks 
            WHERE user_id = @user_id";

        return await QuerySingleOrDefaultAsync<TSysFeedback>(sql, new { user_id = _user.UserId });
    }

    /// <summary>
    /// 最新100件のフィードバックを取得
    /// </summary>
    public async Task<IEnumerable<TSysFeedback>> GetLatestFeedbacksAsync()
    {
        const string sql = @"
            SELECT * FROM t_app_feedbacks 
            ORDER BY update_tim DESC 
            LIMIT 100";

        return await QueryAsync<TSysFeedback>(sql);
    }

    /// <summary>
    /// 全体平均スコアを取得
    /// </summary>
    public async Task<double> GetAverageScoreAsync()
    {
        const string sql = "SELECT COALESCE(AVG(score), 0) FROM t_app_feedbacks";

        return await ExecuteScalarAsync<double>(sql);
    }
}