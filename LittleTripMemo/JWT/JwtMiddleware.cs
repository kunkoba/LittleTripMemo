// JwtMiddleware.cs（ここを唯一のセットアップ場所にする）
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using LittleTripMemo.Common;

namespace LittleTripMemo.JWT;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;

    public JwtMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _configuration = configuration;
    }

    // JwtMiddleware.cs 内の Invoke メソッド
    public async Task Invoke(HttpContext context)
    {
        // ✅ これを追加：OPTIONSリクエストなら何もしないで次へ渡す
        if (context.Request.Method == "OPTIONS")
        {
            await _next(context);
            return;
        }

        var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]);

                // ★ここで署名・有効期限を厳格に検証
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["JwtSettings:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out _);

                // 成功したら UserContext に注入
                var userContext = context.RequestServices.GetRequiredService<UserContext>();
                userContext.login_user_id = Guid.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                userContext.table_id = int.Parse(principal.FindFirst(nameof(UserContext.table_id))?.Value ?? "0");
                userContext.plan_type = principal.FindFirst(nameof(UserContext.plan_type))?.Value ?? PlanType.Free.ToString();

                context.User = principal; // 標準のUserもセットしておく
            }
            catch { /* 検証失敗時は何もしない。後続のAuthorize属性が401を出す */ }
        }
        await _next(context);
    }

}