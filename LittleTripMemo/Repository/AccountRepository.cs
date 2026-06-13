using LittleTripMemo.Common;

namespace LittleTripMemo.Repository;

/// <summary>
/// ユーザー関連の独自DB操作を担当するリポジトリ。
/// BaseRepository の共通機能を前提とし、例外的なSQLのみを実装する。
/// </summary>
public class AccountRepository : _BaseRepository
{
    /// <summary>
    /// コンストラクタ。
    /// BaseRepository と同一の引数構成に統一。
    /// </summary>
    public AccountRepository(
        ITransactionProvider provider,
        ILogger<AccountRepository> logger,
        UserContext user
    ) : base(provider, logger, user)
    {
    }

    /// <summary>
    /// 指定された番号の明細テーブルのレコード件数を取得する。
    /// ※ テーブル名が動的なため、ここでのみSQLを組み立てる。
    /// </summary>
    public async Task<long> GetTableCountAsync(int tableNo)
    {
        // テーブル番号は外部入力のため、数値前提で制御
        var tableName = $"t_memo_detail_{tableNo}";

        // システムカタログ(pg_class)からタプル推定数を取得
        const string sql = @"
        SELECT reltuples::BIGINT 
        FROM pg_class 
        WHERE relname = @tableName";

        return await ExecuteScalarAsync<long>(sql);
    }

}


