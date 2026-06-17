using LittleTripMemo.Common;

namespace LittleTripMemo.Exceptions;

/// <summary>
/// アプリ全体の例外を1箇所で捕まえる「網」の役割。
/// コントローラーでtry-catchを書く手間を省き、エラー応答を統一します。
/// </summary>
public class ExceptionHandling
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandling> _logger;

    public ExceptionHandling(RequestDelegate next, ILogger<ExceptionHandling> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// ASP.NET Coreのパイプライン処理の核となるメソッド。
    /// </summary>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // 次の処理（サービスやコントローラー）を実行
            await _next(context);
        }
        catch (Exception ex)
        {
            // どこでエラーが起きてもここに集約される
            await HandleExceptionAsync(context, ex);
        }
    }

    /// <summary>
    /// 例外の種類を判定し、適切なHTTPレスポンスを作成する。
    /// </summary>
    // --- 修正後 (DBエラー部分を抜粋) ---
    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";
        var errorRes = new ErrorResponse();

        if (ex is BusinessException bEx)
        {
            // (既存の BusinessException 処理は一旦そのまま)
            context.Response.StatusCode = (bEx.ErrorCode == "AUTH_REQUIRED")
                ? StatusCodes.Status401Unauthorized : StatusCodes.Status400BadRequest;
            errorRes = new ErrorResponse { Message = bEx.Message, ErrorCode = bEx.ErrorCode };
            _logger.LogWarning("業務エラー: {Message}", bEx.Message);
        }
        else if (ex is Npgsql.PostgresException pgEx)
        {
            // ★ DBエラー (PostgreSQL固有)
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            // ユーザーには抽象的なメッセージとコードだけ返す
            errorRes = new ErrorResponse
            {
                Message = "データの処理中にエラーが発生しました。時間をおいて再度お試しください。",
                ErrorCode = pgEx.SqlState == "23505" ? ErrorCodes.DB_CONFLICT_ERROR : ErrorCodes.DB_QUERY_ERROR
            };

            // 管理者ログには詳細（SqlState, テーブル名, メッセージ）をしっかり残す
            _logger.LogCritical(pgEx, "DBエラー発生 [State: {SqlState}] [Detail: {Detail}] [Table: {Table}]",
                pgEx.SqlState, pgEx.MessageText, pgEx.TableName);
        }
        else if (ex is System.Net.Sockets.SocketException || ex.Message.Contains("Failed to connect"))
        {
            // ★ ネットワーク・接続エラー
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            errorRes = new ErrorResponse
            {
                Message = "サーバーに接続できません。通信状況を確認してください。",
                ErrorCode = ErrorCodes.DB_CONNECTION_ERROR
            };
            _logger.LogCritical(ex, "DB接続失敗 (SocketException)");
        }
        else
        {
            // ★ その他予期せぬエラー
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            errorRes = new ErrorResponse
            {
                Message = "予期せぬエラーが発生しました。",
                ErrorCode = ErrorCodes.SYSTEM_ERROR
            };
            _logger.LogError(ex, "予期せぬ例外");
        }

        await context.Response.WriteAsJsonAsync(errorRes);
    }
}

