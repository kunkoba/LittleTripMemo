using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace LittleTripMemo.JWT;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;

    public JwtMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        // Authorizationヘッダーからトークン取得
        var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

        if (token != null)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                // トークンデコード（検証ロジックはプロジェクトのセキュリティ要件に合わせて追加）
                var jwtToken = tokenHandler.ReadJwtToken(token);

                // 独自クレーム「table_id」等を含むClaimsIdentityを作成
                var claims = jwtToken.Claims;
                var identity = new ClaimsIdentity(claims, "TableId");

                // HttpContext.Userにセットすることで、以降の処理でUser.FindFirstが有効になる
                context.User = new ClaimsPrincipal(identity);
            }
            catch
            {
                // デコード失敗時は何もしない（後続のAuthorizationFilter等で401にする想定）
            }
        }

        await _next(context);
    }
}

