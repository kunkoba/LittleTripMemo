using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LittleTripMemo.Common;
using Microsoft.AspNetCore.Mvc;


namespace LittleTripMemo.Controllers;

[ApiController]
public abstract class _BaseController : ControllerBase
{
    protected readonly UserContext _user;

    protected _BaseController(UserContext userContext, IHttpContextAccessor httpContextAccessor)
    {
        _user = userContext;

        // Authorization ヘッダーから JWT トークンを取得
        var httpContext = httpContextAccessor.HttpContext;
        var token = httpContext?.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtToken = tokenHandler.ReadJwtToken(token);

                // UserId を取得
                var userIdClaim = jwtToken.Claims.FirstOrDefault(c =>
                    c.Type == ClaimTypes.NameIdentifier ||
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
                if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    _user.UserId = userId;
                }

                // TableId を取得
                var tableIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "TableId");
                if (tableIdClaim != null && int.TryParse(tableIdClaim.Value, out var tableId))
                {
                    _user.TableId = tableId;
                }
            }
            catch (Exception ex)
            {
                // JWT デコードに失敗した場合（トークンが無効など）
                Console.WriteLine($"JWT decode failed: {ex.Message}");
            }
        }
    }
}
