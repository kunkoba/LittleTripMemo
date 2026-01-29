// CustomAuthorizeAttribute.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LittleTripMemo.Common;

/// <summary>
/// カスタム認証機能（標準機能だとJWTをデコードできず認証が通らないので、自前で作成）
/// </summary>
public class CustomAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    /// <summary>
    /// コントローラのアノテーション（コントローラに入る前にここを通る）
    /// </summary>
    /// <param name="context"></param>
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var token = context.HttpContext.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

        if (string.IsNullOrEmpty(token))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = "Token is missing"
            });
            return;
        }

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            // トークンの有効期限チェック
            if (jwtToken.ValidTo < DateTime.UtcNow)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "Token has expired"
                });
                return;
            }

            // UserId の存在チェック
            var userIdClaim = jwtToken.Claims.FirstOrDefault(c =>
                c.Type == ClaimTypes.NameIdentifier ||
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

            if (userIdClaim == null)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "Invalid token: UserId not found"
                });
                return;
            }

            // 認証成功 - HttpContext.Items に情報を格納
            context.HttpContext.Items[nameof(UserContext.UserId)] = userIdClaim.Value;

            // TableId の取得と格納
            var tableIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == nameof(UserContext.TableId));
            if (tableIdClaim != null)
            {
                context.HttpContext.Items[nameof(UserContext.TableId)] = tableIdClaim.Value;
            }

            // Plan の取得と格納
            var planClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == nameof(UserContext.Plan));
            if (planClaim != null)
            {
                // HttpContext.Items に Plan 名をキーとして値を格納
                context.HttpContext.Items[nameof(UserContext.Plan)] = planClaim.Value;
            }
        }
        catch (Exception ex)
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = $"Token validation failed: {ex.Message}"
            });
        }
    }
}

