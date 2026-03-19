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
    private readonly DeleteArchiveService _deleteArchiveService;
    private readonly GetUnMergeDetailsService _getUnMergeDetailsService;
    private readonly GetArchiveDetailsService _getArchiveDetailsService;
    private readonly GetArchiveListService _getArchiveListService;

    public AppController(
        UserContext userContext,
        IHttpContextAccessor httpContextAccessor,
        UpsertDetailService upsertDetailService,
        MergeDetailsService mergeDetailsService,
        DeleteArchiveService deleteArchiveService,
        GetUnMergeDetailsService getUnMergeDetailsService,
        GetArchiveDetailsService getArchiveDetailsService,
        GetArchiveListService getArchiveListService)
        : base(userContext, httpContextAccessor)
    {
        _upsertDetailService = upsertDetailService;
        _mergeDetailsService = mergeDetailsService;
        _deleteArchiveService = deleteArchiveService;
        _getUnMergeDetailsService = getUnMergeDetailsService;
        _getArchiveDetailsService = getArchiveDetailsService;
        _getArchiveListService = getArchiveListService;
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
        return OkWithBase(result);
    }

    /// <summary>
    /// 日々のデータをまとめる。
    /// </summary>
    [HttpPost("api/MergeDetails")]
    public async Task<IActionResult> MergeDetails([FromBody] MergeDetailsService.MergeDetailsReq req)
    {
        var result = await _mergeDetailsService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 未まとめ明細一覧取得
    /// </summary>
    [HttpPost("api/GetUnMergeDetails")]
    public async Task<IActionResult> GetUnMergeDetails([FromBody] GetUnMergeDetailsService.GetUnMergeDetailsReq req)
    {
        var result = await _getUnMergeDetailsService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// まとめ明細一覧取得
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/GetArchiveDetails")]
    public async Task<IActionResult> GetArchiveDetails([FromBody] GetArchiveDetailsService.GetArchiveDetailsReq req)
    {
        var result = await _getArchiveDetailsService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// まとめ親一覧取得
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/GetArchiveList")]
    public async Task<IActionResult> GetArchiveList([FromBody] GetArchiveListService.GetArchiveListReq req)
    {
        var result = await _getArchiveListService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// まとめ削除（解除）
    /// </summary>
    [HttpPost("api/DeleteArchive")]
    public async Task<IActionResult> DeleteArchive([FromBody] DeleteArchiveService.DeleteArchiveReq req)
    {
        var result = await _deleteArchiveService.ExecuteAsync(req);
        return OkWithBase(result);
    }
}