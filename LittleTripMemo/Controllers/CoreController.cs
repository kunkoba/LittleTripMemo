using LittleTripMemo.Common;
using LittleTripMemo.Services.Core;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

/// <summary>
/// アプリケーションの基盤設定（メンテナンスモードやバージョン等）を管理するコントローラー
/// </summary>
[ApiController]
[Route("api/[controller]")]
[CustomAuthorize] // 認証必須
public class CoreController(
    UserContext userContext,
    GetCoreConfigService getCoreConfigService,
    UpdateCoreConfigService updateCoreConfigService
) : _BaseController(userContext)
{
    /// <summary>
    /// 現在のシステム設定一覧を取得（管理者のみ）
    /// </summary>
    [HttpPost("GetCoreConfig")]
    public async Task<IActionResult> GetCoreConfig()
        => OkWithBase(await getCoreConfigService.ExecuteAsync());

    /// <summary>
    /// システム設定を更新（管理者のみ）
    /// </summary>
    [HttpPost("UpdateCoreConfig")]
    public async Task<IActionResult> UpdateCoreConfig([FromBody] UpdateCoreConfigService.UpdateCoreConfigReq req)
        => OkWithBase(await updateCoreConfigService.ExecuteAsync(req));

}