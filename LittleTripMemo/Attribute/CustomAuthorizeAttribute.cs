// CustomAuthorizeAttribute.cs（認可チェックのみにする）
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using LittleTripMemo.Common;

public class CustomAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var userContext = context.HttpContext.RequestServices.GetRequiredService<UserContext>();

        // Middlewareでセットされた UserId がなければ未認証とみなす
        if (userContext.UserId == Guid.Empty)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Token is missing or invalid" });
        }
    }

}


