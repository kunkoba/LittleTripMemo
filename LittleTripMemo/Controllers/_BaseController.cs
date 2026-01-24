using System.Security.Claims;
using LittleTripMemo.Models.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace LittleTripMemo.Controllers;

[ApiController]
public abstract class _BaseController : ControllerBase, IAsyncActionFilter
{
    protected readonly UserContext _user;

    protected _BaseController(UserContext userContext)
    {
        _user = userContext;
    }

    // 非同期アクションフィルタの実装（jwt取得⇒HTTPコンテキストの後に処理）
    [NonAction]
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        // 実行前の処理：User (Claims) から値を抽出
        var user = context.HttpContext.User;
        if (user.Identity?.IsAuthenticated == true)
        {
            var rawUserId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(rawUserId, out var guidUserId))
            {
                _user.UserId = guidUserId;
            }

            var rawTableId = user.FindFirst("TableId")?.Value;
            if (int.TryParse(rawTableId, out var tableId))
            {
                _user.TableId = tableId;
            }
        }

        // 本来のアクション（子クラスのメソッド）を実行
        await next();
    }
}

