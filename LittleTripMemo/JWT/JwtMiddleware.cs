using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

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

    public async Task Invoke(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]);

                // ✅ ちゃんと検証する
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["JwtSettings:Audience"],
                    ValidateLifetime = true, // ✅ 有効期限チェック
                    ClockSkew = TimeSpan.Zero // トークン期限のズレ許容なし
                };

                // ValidateToken で署名・有効期限をすべて検証
                var principal = tokenHandler.ValidateToken(
                    token,
                    validationParameters,
                    out SecurityToken validatedToken);

                //// ★ AuthenticationType を付けて再構築
                //var identity = new ClaimsIdentity(
                //    principal.Claims,
                //    "Bearer" // ←これが重要
                //);

                // 再セット
                context.User = principal;
                //context.User = new ClaimsPrincipal(identity);
            }
            catch (SecurityTokenExpiredException)
            {
                // 有効期限切れ
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    "{\"message\":\"Token has expired\"}");
                return;
            }
            catch (SecurityTokenException)
            {
                // 署名が無効など
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    "{\"message\":\"Invalid token\"}");
                return;
            }
            catch (Exception ex)
            {
                // その他のエラー
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    $"{{\"message\":\"Token validation failed: {ex.Message}\"}}");
                return;
            }
        }

        await _next(context);
    }
}

