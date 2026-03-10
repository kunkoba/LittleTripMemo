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
    private readonly MergeDetailsService _mergeDetailsService;
    private readonly GetUnMergeDetailsService _getUnMergeDetailsService;

    public AppController(
        UserContext userContext,
        IHttpContextAccessor httpContextAccessor,
        UpsertDetailService upsertDetailService,
        MergeDetailsService mergeDetailsService,
        GetUnMergeDetailsService getUnMergeDetailsService)
        : base(userContext, httpContextAccessor)
    {
        _upsertDetailService = upsertDetailService;
        _mergeDetailsService = mergeDetailsService;
        _getUnMergeDetailsService = getUnMergeDetailsService;
    }

    /// <summary>
    /// 明細の登録・更新。
    /// seq=0 で INSERT、seq>0 で UPDATE。
    /// バリデーションはサービス内の Request record の定義に基づき自動実行されます。
    /// </summary>
    [HttpPost("api/UpsertDetail")]
    public async Task<IActionResult> UpsertDetail([FromBody] UpsertDetailService.UpsertDetailReq req)
    {
        var result = await _upsertDetailService.ExecuteAsync(req);
        return Ok(result);
    }

    /// <summary>
    /// 日々のデータをまとめる。
    /// </summary>
    [HttpPost("api/MergeDetails")]
    public async Task<IActionResult> MergeDetails([FromBody] MergeDetailsService.MergeDetailsReq req)
    {
        var result = await _mergeDetailsService.ExecuteAsync(req);
        return Ok(result);
    }

    /// <summary>
    /// 未まとめ明細一覧取得。
    /// </summary>
    [HttpPost("api/GetUnMergeDetails")]
    public async Task<IActionResult> GetUnMergeDetails([FromBody] GetUnMergeDetailsService.GetUnMergeDetailsReq req)
    {
        var result = await _getUnMergeDetailsService.ExecuteAsync(req);
        return Ok(result);
    }
}