using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LittleTripMemo.Common;
using Microsoft.AspNetCore.Mvc;


namespace LittleTripMemo.Controllers;

[ApiController]
public abstract class _BaseController : ControllerBase
{
    protected readonly UserContext _user;

    /// <summary>
    /// 基底クラスでJWTトークンからユーザ情報を抽出して UserContext にセットする
    /// </summary>
    /// <param name="userContext"></param>
    /// <param name="httpContextAccessor"></param>
    protected _BaseController(UserContext userContext, IHttpContextAccessor httpContextAccessor)
    {
        _user = userContext;

        // Authorization ヘッダーから JWT トークンを取得
        var httpContext = httpContextAccessor.HttpContext;

        // ユーザID
        if (httpContext?.Items[nameof(_user.UserId)] is string userIdStr && Guid.TryParse(userIdStr, out var userId))
        {
            _user.UserId = userId;
        }

        // テーブルID
        if (httpContext?.Items[nameof(_user.TableId)] is string tableIdStr && int.TryParse(tableIdStr, out var tableId))
        {
            _user.TableId = tableId;
        }

        // 料金プラン
        if (httpContext?.Items[nameof(_user.Plan)] is string plan)
        {
            _user.Plan = plan;
        }
    }
}
