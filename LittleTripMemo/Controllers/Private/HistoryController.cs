using LittleTripMemo.Services;
using LittleTripMemo.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

/// <summary>
/// 旅の明細（履歴）に関する操作を提供するAPIコントローラー。
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistoryController : _BaseController
{
    private readonly HistoryRegistrationService _insertService;

    public HistoryController(
        UserContext userContext,
        IHttpContextAccessor httpContextAccessor,  // ← 追加
        HistoryRegistrationService insertService)
        : base(userContext, httpContextAccessor)  // ← 追加
    {
        _insertService = insertService;
    }

    /// <summary>
    /// 明細を新規登録します。
    /// 全項目必須のバリデーションは、サービス内の Request record の定義に基づき自動実行されます。
    /// </summary>
    [HttpPost("insert")]
    public async Task<IActionResult> Insert([FromBody] HistoryRegistrationService.HistoryRegistrationRequest req)
    {
        // サービス実行（バリデーション、マッピング、トランザクション、DB登録を一括処理）
        var result = await _insertService.ExecuteAsync(req);

        // 成功時は採番された SEQ を含むレスポンスを返却
        return Ok(result);
    }
}

