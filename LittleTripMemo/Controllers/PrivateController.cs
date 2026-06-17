using LittleTripMemo.Common;
using LittleTripMemo.Services.Private;
using LittleTripMemo.Services.Public;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

[ApiController]
[Route("api/[controller]")]
[CustomAuthorize]
public class PrivateController : _BaseController
{
    private readonly GetUnMergeDetailsService _getUnMergeDetailsService;
    private readonly GetArchiveDetailsService _getArchiveDetailsService;
    private readonly GetArchiveListService _getArchiveListService;
    private readonly MergeDetailsService _mergeDetailsService;
    private readonly AddDetailsService _addDetailsService;
    private readonly UpdateArchiveService _updateArchiveService;
    private readonly DeleteArchiveService _deleteArchiveService;
    private readonly DeleteStrayDetailsService _deleteStrayDetailsService;
    private readonly DetachDetailsService _detachDetailsService;
    private readonly UpdateDetailService _updateDetailService;
    private readonly BulkSyncDetailsService _bulkSyncDetailsService;
    private readonly PublishArchiveService _publishArchiveService;

    public PrivateController(
        UserContext userContext,
        GetUnMergeDetailsService getUnMergeDetailsService,
        GetArchiveDetailsService getArchiveDetailsService,
        GetArchiveListService getArchiveListService,
        MergeDetailsService mergeDetailsService,
        AddDetailsService addDetailsService,
        UpdateArchiveService updateArchiveService,
        DeleteArchiveService deleteArchiveService,
        DeleteStrayDetailsService deleteStrayDetailsService,
        DetachDetailsService detachDetailsService,
        UpdateDetailService updateDetailService,
        BulkSyncDetailsService bulkSyncDetailsService,
        PublishArchiveService publishArchiveService
    ) : base(userContext)
    {
        _getUnMergeDetailsService = getUnMergeDetailsService;
        _getArchiveDetailsService = getArchiveDetailsService;
        _getArchiveListService = getArchiveListService;
        _mergeDetailsService = mergeDetailsService;
        _addDetailsService = addDetailsService;
        _updateArchiveService = updateArchiveService;
        _deleteArchiveService = deleteArchiveService;
        _deleteStrayDetailsService = deleteStrayDetailsService;
        _detachDetailsService = detachDetailsService;
        _updateDetailService = updateDetailService;
        _bulkSyncDetailsService = bulkSyncDetailsService;
        _publishArchiveService = publishArchiveService;
    }

    [HttpPost("GetUnMergeDetails")]
    public async Task<IActionResult> GetUnMergeDetails([FromBody] GetUnMergeDetailsService.GetUnMergeDetailsReq req)
        => OkWithBase(await _getUnMergeDetailsService.ExecuteAsync(req));

    [HttpPost("GetArchiveDetails")]
    public async Task<IActionResult> GetArchiveDetails([FromBody] GetArchiveDetailsService.GetArchiveDetailsReq req)
        => OkWithBase(await _getArchiveDetailsService.ExecuteAsync(req));

    [HttpPost("GetArchiveList")]
    public async Task<IActionResult> GetArchiveList([FromBody] GetArchiveListService.GetArchiveListReq req)
        => OkWithBase(await _getArchiveListService.ExecuteAsync());

    [HttpPost("MergeDetails")]
    public async Task<IActionResult> MergeDetails([FromBody] MergeDetailsService.MergeDetailsReq req)
        => OkWithBase(await _mergeDetailsService.ExecuteAsync(req));

    [HttpPost("AddDetails")]
    public async Task<IActionResult> AddDetails([FromBody] AddDetailsService.AddDetailsReq req)
        => OkWithBase(await _addDetailsService.ExecuteAsync(req));

    [HttpPost("UpdateArchive")]
    public async Task<IActionResult> UpdateArchive([FromBody] UpdateArchiveService.UpdateArchiveReq req)
        => OkWithBase(await _updateArchiveService.ExecuteAsync(req));

    [HttpPost("DeleteArchive")]
    public async Task<IActionResult> DeleteArchive([FromBody] DeleteArchiveService.DeleteArchiveReq req)
        => OkWithBase(await _deleteArchiveService.ExecuteAsync(req));

    [HttpPost("DeleteStrayDetails")]
    public async Task<IActionResult> DeleteStrayDetails([FromBody] DeleteStrayDetailsService.DeleteStrayDetailsReq req)
        => OkWithBase(await _deleteStrayDetailsService.ExecuteAsync(req));

    [HttpPost("DetachDetails")]
    public async Task<IActionResult> DetachDetails([FromBody] DetachDetailsService.DetachDetailsReq req)
        => OkWithBase(await _detachDetailsService.ExecuteAsync(req));

    [HttpPost("PublishArchive")]
    public async Task<IActionResult> PublishArchive([FromBody] PublishArchiveService.PublishArchiveReq req)
        => OkWithBase(await _publishArchiveService.ExecuteAsync(req));

    [HttpPost("UpdateDetail")]
    public async Task<IActionResult> UpdateDetail([FromBody] UpdateDetailService.UpdateDetailReq req)
        => OkWithBase(await _updateDetailService.ExecuteAsync(req));

    [HttpPost("BulkSyncDetails")]
    public async Task<IActionResult> BulkSyncDetails([FromBody] BulkSyncDetailsService.BulkSyncReq req)
        => OkWithBase(await _bulkSyncDetailsService.ExecuteAsync(req));
}