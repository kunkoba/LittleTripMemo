using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LittleTripMemo.Common;
using Microsoft.AspNetCore.Mvc;


namespace LittleTripMemo.Controllers;

[ApiController]
public abstract class _BaseController : ControllerBase
{
    protected readonly UserContext _user;
    protected bool IsLoggedIn => _user.login_user_id != Guid.Empty;

    protected _BaseController(UserContext userContext)
    {
        _user = userContext; // これだけで完了！
    }

    // レスポンス共通化
    protected OkObjectResult OkWithBase(object result)
    {
        return Ok(new
        {
            is_logged_in = IsLoggedIn,
            plan = _user.plan_type,
            data = result
        });
    }
}
