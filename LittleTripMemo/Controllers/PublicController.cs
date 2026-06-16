using LittleTripMemo.Common;
using LittleTripMemo.Services;
using LittleTripMemo.Services.Public;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

[ApiController]
[Route("api/[controller]")]
[CustomAuthorize]
public class PublicController : _BaseController
{
    private readonly GetArchiveDetailsPubService _getArchiveDetailsPubService;
    private readonly SearchByLocationPubService _searchByLocationPubService;
    private readonly UnpublishArchiveService _unpublishArchiveService;
    private readonly OpenArchiveService _openArchiveService;
    private readonly CloseArchiveService _closeArchiveService;
    private readonly UpdateArchivePubService _updateArchivePubService;
    private readonly UpdateDetailPubService _updateDetailPubService;
    private readonly BulkSyncReactionService _bulkSyncReactionService;

    public PublicController(
        UserContext userContext,
        GetArchiveDetailsPubService getArchiveDetailsPubService,
        SearchByLocationPubService searchByLocationPubService,
        UnpublishArchiveService unpublishArchiveService,
        OpenArchiveService openArchiveService,
        CloseArchiveService closeArchiveService,
        UpdateArchivePubService updateArchivePubService,
        UpdateDetailPubService updateDetailPubService,
        BulkSyncReactionService bulkSyncReactionService
    ) : base(userContext)
    {
        _getArchiveDetailsPubService = getArchiveDetailsPubService;
        _searchByLocationPubService = searchByLocationPubService;
        _unpublishArchiveService = unpublishArchiveService;
        _openArchiveService = openArchiveService;
        _closeArchiveService = closeArchiveService;
        _updateArchivePubService = updateArchivePubService;
        _updateDetailPubService = updateDetailPubService;
        _bulkSyncReactionService = bulkSyncReactionService;
    }

    [AllowAnonymous]
    [HttpGet("GetArchiveDetailsPub/{encodedId}")]
    public async Task<IActionResult> GetArchiveDetailsPub(string encodedId)
    {
        int archiveId = ServiceUtilities.DecodeId(encodedId);
        if (archiveId <= 0) return NotFound();
        return OkWithBase(await _getArchiveDetailsPubService.ExecuteAsync(new(archiveId)));
    }

    [HttpPost("SearchByLocationPub")]
    public async Task<IActionResult> SearchByLocationPub([FromBody] SearchByLocationPubService.SearchByLocationPubReq req)
        => OkWithBase(await _searchByLocationPubService.ExecuteAsync(req));

    [HttpPost("UnpublishArchive")]
    public async Task<IActionResult> UnpublishArchive([FromBody] UnpublishArchiveService.UnpublishArchiveReq req)
        => OkWithBase(await _unpublishArchiveService.ExecuteAsync(req));

    [HttpPost("OpenArchive")]
    public async Task<IActionResult> OpenArchive([FromBody] OpenArchiveService.OpenArchiveReq req)
        => OkWithBase(await _openArchiveService.ExecuteAsync(req));

    [HttpPost("CloseArchive")]
    public async Task<IActionResult> CloseArchive([FromBody] CloseArchiveService.CloseArchiveReq req)
        => OkWithBase(await _closeArchiveService.ExecuteAsync(req));

    [HttpPost("UpdateArchivePub")]
    public async Task<IActionResult> UpdateArchivePub([FromBody] UpdateArchivePubService.UpdateArchivePubReq req)
        => OkWithBase(await _updateArchivePubService.ExecuteAsync(req));

    [HttpPost("UpdateDetailPub")]
    public async Task<IActionResult> UpdateDetailPub([FromBody] UpdateDetailPubService.UpdateDetailPubReq req)
        => OkWithBase(await _updateDetailPubService.ExecuteAsync(req));

    [HttpPost("BulkSyncReactions")]
    public async Task<IActionResult> BulkSyncReactions([FromBody] BulkSyncReactionService.BulkSyncReactionReq req)
        => OkWithBase(await _bulkSyncReactionService.ExecuteAsync(req));

}