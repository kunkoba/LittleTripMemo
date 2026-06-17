using LittleTripMemo.Common;
using Serilog.Context;

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
        // リクエストごとに一意なID（TraceIdentifier）をコンテキストに押し込む
        using (LogContext.PushProperty("CorrelationId", context.TraceIdentifier))
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
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

            // ★ リポジトリ側で既にSQL詳細を出しているので、ここでは型とメッセージのみ1行で出す
            _logger.LogError("【DBシステムエラー】{Type}: {Msg}", pgEx.GetType().Name, pgEx.MessageText);
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
            // 第一引数の ex を削除し、メッセージに型と内容を埋め込む
            _logger.LogCritical("【DB接続失敗】{Type}: {Msg}", ex.GetType().Name, ex.Message);
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
            // ★ スタックトレースを省き、エラーの型とメッセージだけを1行で出力
            _logger.LogError("【予期せぬエラー】{Type}: {Msg}", ex.GetType().Name, ex.Message);
        }

        await context.Response.WriteAsJsonAsync(errorRes);
    }

}

