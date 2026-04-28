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

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["JwtSettings:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                // トークン検証
                var principal = tokenHandler.ValidateToken(
                    token,
                    validationParameters,
                    out _);

                // 標準の User へのセット
                context.User = principal;

                // =============================================================
                // ✅ 追加：UserContext への値のセット
                // =============================================================
                var userContext = context.RequestServices.GetRequiredService<UserContext>();

                // UserId (NameIdentifier)
                var userIdStr = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdStr, out var userId))
                {
                    userContext.UserId = userId;
                }

                // TableId
                var tableIdStr = principal.FindFirst(nameof(UserContext.TableId))?.Value;
                if (int.TryParse(tableIdStr, out var tableId))
                {
                    userContext.TableId = tableId;
                }

                // Plan
                userContext.Plan = principal.FindFirst(nameof(UserContext.Plan))?.Value ?? PlanType.Free.ToString();
                // =============================================================

            }
            catch (SecurityTokenExpiredException)
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"message\":\"Token has expired\"}");
                return;
            }
            catch (Exception)
            {
                // 不正なトークンの場合はここでは何もしない（CustomAuthorize が 401 を出すため）
            }
        }

        await _next(context);
    }
}