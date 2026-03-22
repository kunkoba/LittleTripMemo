using LittleTripMemo.Common;
using LittleTripMemo.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

/// <summary>
/// アプリケーション全体のリクエストを受け付けるAPIコントローラー。
/// </summary>
[ApiController]
[CustomAuthorize]
public class AppController : _BaseController
{
    private readonly GetUnMergeDetailsService _getUnMergeDetailsService;
    private readonly GetArchiveDetailsService _getArchiveDetailsService;
    private readonly GetArchiveListService _getArchiveListService;
    private readonly UpsertDetailService _upsertDetailService;
    private readonly MergeDetailsService _mergeDetailsService;
    private readonly DeleteArchiveService _deleteArchiveService;
    private readonly UpdateArchiveService _updateArchiveService;
    private readonly PublishArchiveService _publishArchiveService;
    private readonly SearchByLocationService _searchByLocationService;
    private readonly GetArchiveDetailsPubService _getArchiveDetailsPubService;
    private readonly UnpublishArchiveService _unpublishArchiveService;
    private readonly UpsertReactionService _upsertReactionService;
    private readonly SearchByLocationPubService _searchByLocationPubService;

    // コンストラクタに追加
    public AppController(
        UserContext userContext,
        IHttpContextAccessor httpContextAccessor,
        GetUnMergeDetailsService getUnMergeDetailsService,
        GetArchiveDetailsService getArchiveDetailsService,
        GetArchiveListService getArchiveListService,
        UpsertDetailService upsertDetailService,
        MergeDetailsService mergeDetailsService,
        DeleteArchiveService deleteArchiveService,
        UpdateArchiveService updateArchiveService,
        PublishArchiveService publishArchiveService,
        SearchByLocationService searchByLocationService,
        GetArchiveDetailsPubService getArchiveDetailsPubService,
        UnpublishArchiveService unpublishArchiveService,
        UpsertReactionService upsertReactionService, 
        SearchByLocationPubService searchByLocationPubService)
        : base(userContext, httpContextAccessor)
    {
        _getUnMergeDetailsService = getUnMergeDetailsService;
        _getArchiveDetailsService = getArchiveDetailsService;
        _getArchiveListService = getArchiveListService;
        _upsertDetailService = upsertDetailService;
        _mergeDetailsService = mergeDetailsService;
        _deleteArchiveService = deleteArchiveService;
        _updateArchiveService = updateArchiveService;
        _publishArchiveService = publishArchiveService;
        _searchByLocationService = searchByLocationService;
        _getArchiveDetailsPubService = getArchiveDetailsPubService;
        _unpublishArchiveService = unpublishArchiveService;
        _upsertReactionService = upsertReactionService;
        _searchByLocationPubService = searchByLocationPubService;
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

    /// <summary>
    /// まとめ親の更新
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/UpdateArchive")]
    public async Task<IActionResult> UpdateArchive([FromBody] UpdateArchiveService.UpdateArchiveReq req)
    {
        var result = await _updateArchiveService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 非公開データを公開する
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/PublishArchive")]
    public async Task<IActionResult> PublishArchive([FromBody] PublishArchiveService.PublishArchiveReq req)
    {
        var result = await _publishArchiveService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 公開済みデータを非公開にする
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/UnpublishArchive")]
    public async Task<IActionResult> UnpublishArchive([FromBody] UnpublishArchiveService.UnpublishArchiveReq req)
    {
        var result = await _unpublishArchiveService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 地点検索（非公開データ）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/SearchByLocation")]
    public async Task<IActionResult> SearchByLocation([FromBody] SearchByLocationService.SearchByLocationReq req)
    {
        var result = await _searchByLocationService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 地点検索（公開データ）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/SearchByLocationPub")]
    public async Task<IActionResult> SearchByLocationPub([FromBody] SearchByLocationPubService.SearchByLocationPubReq req)
    {
        var result = await _searchByLocationPubService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// まとめ明細一覧取得（公開データ）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [AllowAnonymous]
    [HttpPost("api/GetArchiveDetailsPub")]
    public async Task<IActionResult> GetArchiveDetailsPub([FromBody] GetArchiveDetailsPubService.GetArchiveDetailsPubReq req)
    {
        var result = await _getArchiveDetailsPubService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// リアクションの登録・更新。
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/UpsertReaction")]
    public async Task<IActionResult> UpsertReaction([FromBody] UpsertReactionService.UpsertReactionReq req)
    {
        var result = await _upsertReactionService.ExecuteAsync(req);
        return OkWithBase(result);
    }
}