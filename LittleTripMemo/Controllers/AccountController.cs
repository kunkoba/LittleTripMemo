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
        IHttpContextAccessor httpContextAccessor,
        RegistrationUserService accountService,
        GetUserProfileService getUserProfileService,
        UpdateUserProfileService updateUserProfileService)
        : base(userContext, httpContextAccessor) // 基底クラスのコンストラクタを呼び出す
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

        // 共通レスポンス形式で返却
        return OkWithBase(new
        {
            token = result.token,
            is_owner = false,
            is_public = false,
        });
    }

    [CustomAuthorize]
    [HttpPost("GetProfile")]
    public async Task<IActionResult> GetOwnerProfile()
    {
        // GetUserProfileService を DI して使用
        var result = await _getUserProfileService.ExecuteAsync(_user.UserId);

        // JS側の _fetchData で ownerProfile キーで受け取れるように匿名型でラップ
        return OkWithBase(new { ownerProfile = result });
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