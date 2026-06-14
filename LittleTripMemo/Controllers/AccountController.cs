// Controllers/AccountController.cs

using LittleTripMemo.Common;
using LittleTripMemo.Services;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : _BaseController // 基底クラスを _BaseController に変更
{
    private readonly RegistrationUserService _accountService;
    private readonly GetUserProfileService _getUserProfileService;
    private readonly UpdateUserProfileService _updateUserProfileService;

    public AccountController(
        UserContext userContext,
        RegistrationUserService accountService,
        GetUserProfileService getUserProfileService,
        UpdateUserProfileService updateUserProfileService)
        : base(userContext) // 基底クラスのコンストラクタを呼び出す
    {
        _accountService = accountService;
        _getUserProfileService = getUserProfileService;
        _updateUserProfileService = updateUserProfileService;
    }

    /// <summary>
    /// Firebase認証後のログイン／新規登録処理
    /// </summary>
    [HttpPost("LoginFirebase")]
    public async Task<IActionResult> FirebaseLogin(
        [FromBody] RegistrationUserService.FirebaseLoginRequest request)
    {
        var result = await _accountService.LoginOrRegisterAsync(request);

        if (!result.is_success)
        {
            return BadRequest(new { result.message });
        }

        // ✅ 重要：OkWithBase が参照している _user オブジェクトにログイン情報を手動でセットする
        _user.user_id = result.userId ?? Guid.Empty;
        _user.plan_type = result.plan ?? PlanType.Free.ToString();

        // 共通レスポンス形式で返却
        return OkWithBase(new
        {
            token = result.token,
            is_owner = false,
            is_public = false,
        });
    }

    /// <summary>
    /// ユーザー情報更新
    /// </summary>
    [HttpPost("UpdateProfile")]
    public async Task<IActionResult> Update(
        [FromBody] UpdateUserProfileService.UpdateUserReq req)
    {
        var result = await _updateUserProfileService.ExecuteAsync(req);
        return OkWithBase(result);
    }
}