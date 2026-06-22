using LittleTripMemo.Common;
using System.Net;
using System.Text.Json;

namespace LittleTripMemo.Middleware;

public class SystemManagementMiddleware
{
    private readonly RequestDelegate _next;
    private readonly SystemStatus _systemStatus;

    public SystemManagementMiddleware(RequestDelegate next, SystemStatus systemStatus)
    {
        _next = next;
        _systemStatus = systemStatus;
    }

    public async Task InvokeAsync(HttpContext context, UserContext userContext)
    {
        // 1. バージョンチェック (カスタムヘッダー "X-App-Version" を想定)
        // ※ フロント側でこのヘッダーを載せて送る必要があります
        var appVersion = context.Request.Headers["X-App-Version"].ToString();
        if (!string.IsNullOrEmpty(_systemStatus.MinAppVersion) && !string.IsNullOrEmpty(appVersion))
        {
            // バージョン比較 (簡易的な文字列比較または Version クラスでの比較)
            // ここでは簡易的に「現在のバージョン < 最小必須バージョン」を判定
            if (IsVersionOlder(appVersion, _systemStatus.MinAppVersion))
            {
                await ReturnErrorResponse(context, HttpStatusCode.UpgradeRequired, "新しいバージョンのアプリが利用可能です。更新（リロード）してください。", "VERSION_UP_REQUIRED");
                return;
            }
        }

        // 2. メンテナンスチェック
        if (_systemStatus.IsMaintenanceMode)
        {
            // 管理者権限（Admin）を持つユーザーのみ通過を許可する
            if (userContext.plan_type != PlanType.Admin.ToString())
            {
                await ReturnErrorResponse(context, HttpStatusCode.ServiceUnavailable, _systemStatus.MaintenanceMessage, "MAINTENANCE_MODE");
                return;
            }
        }

        // 全てのチェックを通過
        await _next(context);
    }

    /// <summary>
    /// エラーレスポンスをJSONで返却
    /// </summary>
    private static async Task ReturnErrorResponse(HttpContext context, HttpStatusCode code, string message, string errorCode)
    {
        context.Response.StatusCode = (int)code;
        context.Response.ContentType = "application/json";

        var response = new { message, errorCode };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }

    /// <summary>
    /// バージョン比較ロジック (1.0.0 形式を想定)
    /// </summary>
    private static bool IsVersionOlder(string current, string minRequired)
    {
        if (Version.TryParse(current, out var v1) && Version.TryParse(minRequired, out var v2))
        {
            return v1 < v2;
        }
        return false;
    }

}