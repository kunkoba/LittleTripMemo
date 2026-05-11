// CustomAuthorizeAttribute.cs（認可チェックのみにする）
using LittleTripMemo.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

public class CustomAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // [AllowAnonymous] が付いているメソッドなら、チェックをスキップする
        if (context.ActionDescriptor.EndpointMetadata.Any(em => em is AllowAnonymousAttribute))
        {
            return;
        }

        var userContext = context.HttpContext.RequestServices.GetRequiredService<UserContext>();

        // Middlewareでセットされた UserId がなければ未認証とみなす
        if (userContext.UserId == Guid.Empty)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Token is missing or invalid" });
        }
    }

}


