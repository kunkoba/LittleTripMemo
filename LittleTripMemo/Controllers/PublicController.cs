using LittleTripMemo.Common;
using LittleTripMemo.JWT;
using LittleTripMemo.Services;
using LittleTripMemo.Services.Public;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

/// <summary>
/// 全ユーザー（未ログイン含む）が利用可能な、公開データの参照・操作を行うコントローラー
/// </summary>
[ApiController]
[Route("api/[controller]")]
[CustomAuthorize]
public class PublicController(
    UserContext userContext,
    JwtService jwtService,
    GetArchiveDetailsPubService getArchiveDetailsPubService,
    SearchByLocationPubService searchByLocationPubService,
    UnpublishArchiveService unpublishArchiveService,
    OpenArchiveService openArchiveService,
    CloseArchiveService closeArchiveService,
    UpdateArchivePubService updateArchivePubService,
    UpdateDetailPubService updateDetailPubService,
    BulkSyncReactionService bulkSyncReactionService,
    AddCountQueueService addClickQueueService
) : _BaseController(userContext, jwtService)
{
    #region "未ログイン・ゲスト可"

    /// <summary>
    /// 公開されているまとめの詳細情報を取得する（エンコード済みID指定）
    /// </summary>
    [AllowAnonymous]
    [HttpGet("GetArchiveDetailsPub/{encodedId}")]
    public async Task<IActionResult> GetArchiveDetailsPub(string encodedId)
    {
        int archiveId = ServiceUtilities.DecodeId(encodedId);
        if (archiveId <= 0) return NotFound();
        return OkWithBase(await getArchiveDetailsPubService.ExecuteAsync(new(archiveId)));
    }

    /// <summary>
    /// リンクやボタンのクリック統計をキューに追加する
    /// </summary>
    [AllowAnonymous]
    [HttpPost("AddClick")]
    public async Task<IActionResult> AddClick([FromBody] AddCountQueueService.AddCountReq req)
        => OkWithBase(await addClickQueueService.ExecuteAsync(req));

    #endregion

    #region "ログイン前提"

    /// <summary>
    /// 指定された地図範囲内の公開明細を検索する
    /// </summary>
    [HttpPost("SearchByLocationPub")]
    public async Task<IActionResult> SearchByLocationPub([FromBody] SearchByLocationPubService.SearchByLocationPubReq req)
        => OkWithBase(await searchByLocationPubService.ExecuteAsync(req));

    /// <summary>
    /// 自分の公開データを非公開に戻し、秘密側（自分専用）へ移動する
    /// </summary>
    [HttpPost("UnpublishArchive")]
    public async Task<IActionResult> UnpublishArchive([FromBody] UnpublishArchiveService.UnpublishArchiveReq req)
        => OkWithBase(await unpublishArchiveService.ExecuteAsync(req));

    /// <summary>
    /// 公開中のまとめを「公開」状態にする（検索にヒットするようにする）
    /// </summary>
    [HttpPost("OpenArchive")]
    public async Task<IActionResult> OpenArchive([FromBody] OpenArchiveService.OpenArchiveReq req)
        => OkWithBase(await openArchiveService.ExecuteAsync(req)); // ※内部的には同じ公開切替処理

    /// <summary>
    /// 公開中のまとめを「一時クローズ」状態にする（URLを知っている人のみ閲覧可）
    /// </summary>
    [HttpPost("CloseArchive")]
    public async Task<IActionResult> CloseArchive([FromBody] CloseArchiveService.CloseArchiveReq req)
        => OkWithBase(await closeArchiveService.ExecuteAsync(req));

    /// <summary>
    /// 公開されているまとめの親情報を更新する
    /// </summary>
    [HttpPost("UpdateArchivePub")]
    public async Task<IActionResult> UpdateArchivePub([FromBody] UpdateArchivePubService.UpdateArchivePubReq req)
        => OkWithBase(await updateArchivePubService.ExecuteAsync(req));

    /// <summary>
    /// 公開されている特定の明細情報を更新する
    /// </summary>
    [HttpPost("UpdateDetailPub")]
    public async Task<IActionResult> UpdateDetailPub([FromBody] UpdateDetailPubService.UpdateDetailPubReq req)
        => OkWithBase(await updateDetailPubService.ExecuteAsync(req));

    /// <summary>
    /// 複数のリアクション（いいね等）の状態を一括で同期する
    /// </summary>
    [HttpPost("BulkSyncReactions")]
    public async Task<IActionResult> BulkSyncReactions([FromBody] BulkSyncReactionService.BulkSyncReactionReq req)
        => OkWithBase(await bulkSyncReactionService.ExecuteAsync(req));

    #endregion

}