using LittleTripMemo.Services;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly AccountService _accountService;

    public AccountController(AccountService accountService)
    {
        _accountService = accountService;
    }

    /// <summary>
    /// Firebase認証後のログイン／新規登録処理
    /// </summary>
    [HttpPost("firebase-login")]
    public async Task<IActionResult> FirebaseLogin(
        [FromBody] AccountService.FirebaseLoginRequest request)
    {
        // 業務ロジック（登録判定、トークン発行）はすべてサービスに委譲
        var result = await _accountService.LoginOrRegisterAsync(request);

        if (!result.is_success)
        {
            // エラー時はメッセージを返却
            return BadRequest(new { result.message });
        }

        // 成功時はサービスが生成したトークンを返却
        return Ok(new { result.token });
    }
}

