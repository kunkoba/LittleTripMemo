using LittleTripMemo.Repository;
using Npgsql; // PostgreSQLの場合
using System.Data;

namespace LittleTripMemo.DataAccess;

public class TransactionProvider : ITransactionProvider
{
    private readonly string _connectionString;
    private IDbConnection _connection;
    private IDbTransaction _transaction;

    public TransactionProvider(string connectionString)
    {
        _connectionString = connectionString;
    }

    // Connectionが必要になったタイミングで生成（Lazy Load）
    public IDbConnection Connection => _connection ??= new NpgsqlConnection(_connectionString);

    // 現在のトランザクション（開始されていなければ null）
    public IDbTransaction Transaction => _transaction;

    // トランザクション開始
    public IDbTransaction BeginTransaction()
    {
        if (Connection.State != ConnectionState.Open) Connection.Open();
        _transaction = Connection.BeginTransaction();
        return _transaction;
    }

    // トランザクション解放
    public void Dispose()
    {
        _transaction?.Dispose();
        _connection?.Dispose();
    }
}

