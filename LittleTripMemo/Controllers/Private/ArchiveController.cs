using LittleTripMemo.Services;
using LittleTripMemo.Common;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

/// <summary>
/// 旅の記録（アーカイブ）に関する操作を提供するAPIコントローラー。
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ArchiveController : _BaseController
{
    private readonly ArchiveUpdateService _updateService;

    public ArchiveController(
        UserContext userContext,
        IHttpContextAccessor httpContextAccessor,  // ← 追加
        ArchiveUpdateService updateService)
        : base(userContext, httpContextAccessor)  // ← 追加
    {
        _updateService = updateService;
    }

    /// <summary>
    /// 旅の記録を更新します。
    /// 引数の Request に付与されたアノテーションにより、実行前にバリデーションが自動で行われます。
    /// </summary>
    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] ArchiveUpdateService.ArchiveUpdateRequest req)
    {
        // サービス実行
        var result = await _updateService.ExecuteAsync(req);

        if (!result.is_success)
        {
            return BadRequest(new { message = result.message });
        }

        return Ok(result);
    }
}

