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
    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";
        var errorRes = new ErrorResponse();

        if (ex is BusinessException bEx)
        {
            // 【業務エラー】Check()等で意図的に投げたもの -> 400を返す
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            errorRes = new ErrorResponse
            {
                Message = bEx.Message,
                ErrorCode = bEx.ErrorCode
            };
            _logger.LogWarning("業務エラーが発生: {Message}", bEx.Message);
        }
        else if (ex is Npgsql.PostgresException pgEx)
        {
            // 【SQL・DBエラー】ここを追加
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            errorRes = new ErrorResponse
            {
                Message = "データベース操作に失敗しました。",
                ErrorCode = $"DB_ERROR_{pgEx.SqlState}", // 42P01 等のSQLステートを付与
                DebugInfo = ex.ToString() // スタックトレース
            };
            _logger.LogError(pgEx, "SQLエラーが発生 (State: {SqlState}): {Message}", pgEx.SqlState, pgEx.MessageText);
        }
        else
        {
            // 【想定外のエラー】バグや障害 -> 500を返す
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            errorRes = new ErrorResponse
            {
                Message = "予期せぬシステムエラーが発生しました。",
                DebugInfo = ex.ToString() // スタックトレース
            };
            _logger.LogError(ex, "予期せぬ例外をキャッチしました。");
        }

        // 共通の型でJSONとして返却
        await context.Response.WriteAsJsonAsync(errorRes);
    }
}

