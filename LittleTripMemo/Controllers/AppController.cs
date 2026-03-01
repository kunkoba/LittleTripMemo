using LittleTripMemo.Services;
using LittleTripMemo.Common;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

/// <summary>
/// アプリケーション全体のリクエストを受け付けるAPIコントローラー。
/// </summary>
[ApiController]
[CustomAuthorize]
public class AppController : _BaseController
{
    private readonly UpsertDetailService _upsertDetailService;

    public AppController(
        UserContext userContext,
        IHttpContextAccessor httpContextAccessor,
        UpsertDetailService upsertDetailService)
        : base(userContext, httpContextAccessor)
    {
        _upsertDetailService = upsertDetailService;
    }

    /// <summary>
    /// 明細の登録・更新。
    /// seq=0 で INSERT、seq>0 で UPDATE。
    /// バリデーションはサービス内の Request record の定義に基づき自動実行されます。
    /// </summary>
    [HttpPost("api/UpsertDetail")]
    public async Task<IActionResult> UpsertDetail([FromBody] UpsertDetailService.Request req)
    {
        var result = await _upsertDetailService.ExecuteAsync(req);
        return Ok(result);
    }
}