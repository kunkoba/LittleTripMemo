using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;

public class UserValidationFilter : IActionFilter
{
    private readonly UserContext _user;

    public UserValidationFilter(UserContext user) => _user = user;

    public void OnActionExecuting(ActionExecutingContext context)
    {
        // 1. 全リクエストの引数をチェック
        foreach (var arg in context.ActionArguments.Values)
        {
            // 2. もし引数が ILoginUserRequest を実装していたら自動チェック発動
            if (arg is ILoginUserRequest req)
            {
                // サーバー側のJWT情報（_user.UserId）とリクエスト内のIDを比較
                if (_user.user_id != Guid.Empty && _user.user_id != req.login_user_id)
                {
                    //// 管理者でない場合はエラー
                    //if (_user.Plan != PlanType.Admin.ToString())
                    //{
                    //    throw new BusinessException("不正なリクエストです。ログインユーザーが一致しません。");
                    //}
                    throw new BusinessException("不正なリクエストです。ログインユーザーが一致しません。");
                }
            }
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}