using LittleTripMemo.Common;
using LittleTripMemo.Services.Account;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : _BaseController
{
    private readonly RegistrationUserService _accountService;
    private readonly UpdateUserProfileService _updateUserProfileService;
    private readonly EnsureLoginUserService _ensureLoginUserService;
    private readonly GetUserProfileService _getUserProfileService;
    private readonly WithdrawalUserService _withdrawalUserService;

    public AccountController(
        UserContext userContext,
        RegistrationUserService accountService,
        UpdateUserProfileService updateUserProfileService,
        EnsureLoginUserService ensureLoginUserService,
        GetUserProfileService getUserProfileService,
        WithdrawalUserService withdrawalUserService
    ) : base(userContext)
    {
        _accountService = accountService;
        _updateUserProfileService = updateUserProfileService;
        _ensureLoginUserService = ensureLoginUserService;
        _getUserProfileService = getUserProfileService;
        _withdrawalUserService = withdrawalUserService;
    }

    /// <summary>
    /// Firebase認証後のログイン／新規登録処理
    /// </summary>
    [HttpPost("LoginFirebase")]
    public async Task<IActionResult> FirebaseLogin([FromBody] RegistrationUserService.FirebaseLoginRequest req)
    {
        var result = await _accountService.LoginOrRegisterAsync(req);

        if (!result.is_success) return BadRequest(new { result.message });

        _user.login_user_id = result.userId ?? Guid.Empty;
        _user.plan_type = result.plan ?? PlanType.Free.ToString();

        return OkWithBase(new { token = result.token, is_owner = false, is_public = false });
    }

    /// <summary>
    /// ユーザー情報更新
    /// </summary>
    [HttpPost("UpdateProfile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileService.UpdateUserReq req)
    {
        var result = await _updateUserProfileService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// ユーザ存在チェック
    /// </summary>
    [HttpPost("EnsureLoginUser")]
    public async Task<IActionResult> EnsureLoginUser([FromBody] EnsureLoginUserService.EnsureLoginUserReq req)
    {
        var result = await _ensureLoginUserService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 指定されたユーザーの公開プロフィールを取得
    /// </summary>
    [HttpPost("GetUserProfile")]
    public async Task<IActionResult> GetUserProfile([FromBody] GetUserProfileService.GetUserProfileReq req)
    {
        var result = await _getUserProfileService.ExecuteAsync(req.target_user_id);
        return OkWithBase(result);
    }

    /// <summary>
    /// ユーザー退会処理
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("Withdrawal")]
    [CustomAuthorize] // ログイン状態であること
    public async Task<IActionResult> Withdrawal([FromBody] WithdrawalUserService.WithdrawalReq req)
    {
        var result = await _withdrawalUserService.ExecuteAsync(req);
        return OkWithBase(result);
    }

}