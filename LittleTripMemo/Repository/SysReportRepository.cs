using LittleTripMemo.Models;
using LittleTripMemo.Common;

namespace LittleTripMemo.Repository;

public class SysReportRepository : _BaseRepository
{
    public SysReportRepository(
        ITransactionProvider provider,
        ILogger<SysReportRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    /// <summary>
    /// 通報内容を新規登録
    /// </summary>
    public async Task<int> InsertAsync(TSysReport report)
    {
        // ログイン中のユーザーを通報者としてセット
        report.reporter_user_id = _user.UserId;

        const string sql = @"
            INSERT INTO t_sys_reports (
                reporter_user_id, 
                target_user_id, 
                archive_id, 
                body, 
                report_tim
            ) VALUES (
                @reporter_user_id, 
                @target_user_id, 
                @archive_id, 
                @body, 
                CURRENT_TIMESTAMP
            )";

        return await ExecuteAsync(sql, report);
    }

    /// <summary>
    /// 通報件数が多い順にアーカイブを集計して取得
    /// </summary>
    /// <param name="minCount">抽出対象とする最小通報件数</param>
    public async Task<IEnumerable<DtoReportSummary>> GetReportSummaryAsync(int minCount = 10)
    {
        const string sql = @"
            SELECT 
                target_user_id, 
                archive_id, 
                COUNT(1) AS report_count
            FROM t_sys_reports
            GROUP BY target_user_id, archive_id
            HAVING COUNT(*) >= @min_count
            ORDER BY report_count DESC";

        return await QueryAsync<DtoReportSummary>(sql, new { min_count = minCount });
    }

    public async Task<IEnumerable<TSysReport>> GetReportsByTargetAsync(Guid targetUserId, long archiveId)
    {
        const string sql = @"
        SELECT * FROM t_sys_reports 
        WHERE target_user_id = @target_user_id 
          AND archive_id = @archive_id 
        ORDER BY report_tim DESC";
        return await QueryAsync<TSysReport>(sql, new { target_user_id = targetUserId, archive_id = archiveId });
    }

}