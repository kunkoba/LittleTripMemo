using LittleTripMemo.Common;
using LittleTripMemo.Services;
using LittleTripMemo.Services.Sys;
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
    private readonly MergeDetailsService _mergeDetailsService;
    private readonly AddDetailsService _addDetailsService;
    private readonly DeleteArchiveService _deleteArchiveService;
    private readonly UpdateArchiveService _updateArchiveService;
    private readonly PublishArchiveService _publishArchiveService;
    private readonly GetArchiveDetailsPubService _getArchiveDetailsPubService;
    private readonly UnpublishArchiveService _unpublishArchiveService;
    private readonly OpenArchiveService _openArchiveService;
    private readonly CloseArchiveService _closeArchiveService;
    private readonly UpdateArchivePubService _updateArchivePubService;
    private readonly UpdateDetailPubService _updateDetailPubService;
    private readonly SearchByLocationPubService _searchByLocationPubService;
    private readonly BulkSyncReactionService _bulkSyncReactionService;
    private readonly BulkSyncDetailsService _bulkSyncDetailsService;
    private readonly GetUserProfileService _getUserProfileService;
    private readonly DeleteStrayDetailsService _deleteStrayDetailsService;
    private readonly DetachDetailsService _detachDetailsService;

    // コンストラクタに追加
    public AppController(
        UserContext userContext,
        GetUnMergeDetailsService getUnMergeDetailsService,
        GetArchiveDetailsService getArchiveDetailsService,
        GetArchiveListService getArchiveListService,
        MergeDetailsService mergeDetailsService,
        AddDetailsService addDetailsService,
        DeleteArchiveService deleteArchiveService,
        UpdateArchiveService updateArchiveService,
        PublishArchiveService publishArchiveService,
        GetArchiveDetailsPubService getArchiveDetailsPubService,
        UnpublishArchiveService unpublishArchiveService,
        OpenArchiveService openArchiveService,
        CloseArchiveService closeArchiveService,
        UpdateArchivePubService updateArchivePubService,
        UpdateDetailPubService updateDetailPubService,
        SearchByLocationPubService searchByLocationPubService,
        BulkSyncReactionService ulkSyncReactionService,
        BulkSyncDetailsService bulkSyncDetailsService,
        GetUserProfileService getUserProfileService,
        DeleteStrayDetailsService deleteStrayDetailsService,
        DetachDetailsService detachDetailsService
    ) : base(userContext)
    {
        _getUnMergeDetailsService = getUnMergeDetailsService;
        _getArchiveDetailsService = getArchiveDetailsService;
        _getArchiveListService = getArchiveListService;
        _mergeDetailsService = mergeDetailsService;
        _addDetailsService = addDetailsService;
        _deleteArchiveService = deleteArchiveService;
        _updateArchiveService = updateArchiveService;
        _publishArchiveService = publishArchiveService;
        _getArchiveDetailsPubService = getArchiveDetailsPubService;
        _unpublishArchiveService = unpublishArchiveService;
        _openArchiveService = openArchiveService;
        _closeArchiveService = closeArchiveService;
        _updateArchivePubService = updateArchivePubService;
        _updateDetailPubService = updateDetailPubService;
        _searchByLocationPubService = searchByLocationPubService;
        _bulkSyncDetailsService = bulkSyncDetailsService;
        _bulkSyncReactionService = ulkSyncReactionService;
        _getUserProfileService = getUserProfileService;
        _deleteStrayDetailsService = deleteStrayDetailsService;
        _detachDetailsService = detachDetailsService;
    }

    #region "Private"

        ///// <summary>
        ///// 明細の登録・更新。
        ///// seq=0 で INSERT、seq>0 で UPDATE。
        ///// バリデーションはサービス内の Request record の定義に基づき自動実行されます。
        ///// </summary>
        //[HttpPost("api/UpsertDetail")]
        //public async Task<IActionResult> UpsertDetail([FromBody] UpsertDetailService.UpsertDetailReq req)
        //{
        //    var result = await _upsertDetailService.ExecuteAsync(req);
        //    return OkWithBase(result);
        //}

        /// <summary>
        /// 明細をまとめる
        /// </summary>
        [HttpPost("api/MergeDetails")]
        public async Task<IActionResult> MergeDetails([FromBody] MergeDetailsService.MergeDetailsReq req)
        {
            var result = await _mergeDetailsService.ExecuteAsync(req);
            return OkWithBase(result);
        }

        /// <summary>
        /// 指定したまとめ親に追加する
        /// </summary>
        [HttpPost("api/AddDetails")]
        public async Task<IActionResult> AddDetails([FromBody] AddDetailsService.AddDetailsReq req)
        {
            var result = await _addDetailsService.ExecuteAsync(req);
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
            var result = await _getArchiveListService.ExecuteAsync();
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
        /// 秘密データを公開する
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
        /// 未まとめ明細の削除
        /// </summary>
        [HttpPost("api/DeleteStrayDetails")]
        public async Task<IActionResult> DeleteStrayDetails([FromBody] DeleteStrayDetailsService.DeleteStrayDetailsReq req)
        {
            var result = await _deleteStrayDetailsService.ExecuteAsync(req);
            return OkWithBase(result);
        }

        /// <summary>
        /// アーカイブからの明細解除（未まとめに戻す）
        /// </summary>
        [HttpPost("api/DetachDetails")]
        public async Task<IActionResult> DetachDetails([FromBody] DetachDetailsService.DetachDetailsReq req)
        {
            var result = await _detachDetailsService.ExecuteAsync(req);
            return OkWithBase(result);
        }

    #endregion

    #region "Public"

        /// <summary>
        /// 公開済みデータを秘密データにする
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
        /// URL例: /api/GetArchiveDetailsPub/123
        /// </summary>
        [AllowAnonymous]
        [HttpGet("api/GetArchiveDetailsPub/{encodedId}")] // GETに変更し、パスにIDを含める
        public async Task<IActionResult> GetArchiveDetailsPub(string encodedId)
        {
            int archiveId = ServiceUtilities.DecodeId(encodedId);

            // 不正なID（デコード失敗）なら 404 か 400
            if (archiveId <= 0) return NotFound();

            // 引数からReqオブジェクトを生成
            var req = new GetArchiveDetailsPubService.GetArchiveDetailsPubReq(archiveId);
            var result = await _getArchiveDetailsPubService.ExecuteAsync(req);

            return OkWithBase(result);
        }

        ///// <summary>
        ///// リアクションの登録・更新。
        ///// </summary>
        ///// <param name="req"></param>
        ///// <returns></returns>
        //[HttpPost("api/UpsertReaction")]
        //public async Task<IActionResult> UpsertReaction([FromBody] UpsertReactionService.UpsertReactionReq req)
        //{
        //    var result = await _upsertReactionService.ExecuteAsync(req);
        //    return OkWithBase(result);
        //}

        /// <summary>
        /// 公開（非公開→公開）
        /// </summary>
        /// <param name="req"></param>
        /// <returns></returns>
        [HttpPost("api/OpenArchive")]
        public async Task<IActionResult> OpenArchive([FromBody] OpenArchiveService.OpenArchiveReq req)
        {
            var result = await _openArchiveService.ExecuteAsync(req);
            return OkWithBase(result);
        }

        /// <summary>
        /// 公開（公開→非公開）
        /// </summary>
        /// <param name="req"></param>
        /// <returns></returns>
        [HttpPost("api/CloseArchive")]
        public async Task<IActionResult> CloseArchive([FromBody] CloseArchiveService.CloseArchiveReq req)
        {
            var result = await _closeArchiveService.ExecuteAsync(req);
            return OkWithBase(result);
        }

        /// <summary>
        /// まとめ親の更新
        /// </summary>
        /// <param name="req"></param>
        /// <returns></returns>
        [HttpPost("api/UpdateArchivePub")]
        public async Task<IActionResult> UpdateArchivePub([FromBody] UpdateArchivePubService.UpdateArchivePubReq req)
        {
            var result = await _updateArchivePubService.ExecuteAsync(req);
            return OkWithBase(result);
        }

        /// <summary>
        /// 明細の登録・更新。
        /// </summary>
        [HttpPost("api/UpdateDetailPub")]
        public async Task<IActionResult> UpdateDetailPub([FromBody] UpdateDetailPubService.UpdateDetailPubReq req)
        {
            var result = await _updateDetailPubService.ExecuteAsync(req);
            return OkWithBase(result);
        }

        /// <summary>
        /// 明細一括登録更新処理
        /// </summary>
        /// <param name="items"></param>
        /// <returns></returns>
        [HttpPost("api/BulkSyncDetails")]
        public async Task<IActionResult> BulkSyncDetails([FromBody] BulkSyncDetailsService.BulkSyncReq req)
        {
            var result = await _bulkSyncDetailsService.ExecuteAsync(req);
            return OkWithBase(result);
    }

        /// <summary>
        /// リアクション登録一括処理
        /// </summary>
        /// <param name="req"></param>
        /// <returns></returns>
        [HttpPost("api/BulkSyncReactions")]
        public async Task<IActionResult> BulkSyncReactions([FromBody] BulkSyncReactionService.BulkSyncReactionReq req)
        {
            var result = await _bulkSyncReactionService.ExecuteAsync(req);
            return OkWithBase(result);
        }

        /// <summary>
        /// 指定されたユーザーの公開プロフィールを取得する
        /// </summary>
        [HttpPost("api/GetUserProfile")]
        public async Task<IActionResult> GetUserProfile([FromBody] GetUserProfileService.GetUserProfileReq req)
        {
                // 既存のサービスをそのまま利用
                var result = await _getUserProfileService.ExecuteAsync(req.target_user_id);
                return OkWithBase(result);
            }

    #endregion

}