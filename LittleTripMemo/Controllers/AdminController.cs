using LittleTripMemo.Common;
using LittleTripMemo.Services.Admin;
using LittleTripMemo.Services.Sys;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

[ApiController]
[Route("api/[controller]")]
[CustomAuthorize]
public class AdminController : _BaseController
{
    private readonly GetAdminAllInfoService _getAdminAllInfoService;
    private readonly GetReportDetailsService _getReportDetailsService;
    private readonly AdminCloseArchivePubService _adminCloseArchivePubService;
    private readonly AdminUnpublishArchiveService _adminUnpublishArchiveService;
    private readonly SendUserNotificationService _sendUserNotificationService;
    private readonly UpsertNotificationService _upsertNotificationService;
    private readonly GetAllFeedbackService _getAllFeedbackService;

    public AdminController(
        UserContext userContext,
        GetAdminAllInfoService getAdminAllInfoService,
        GetReportDetailsService getReportDetailsService,
        AdminCloseArchivePubService adminCloseArchivePubService,
        AdminUnpublishArchiveService adminUnpublishArchiveService,
        SendUserNotificationService sendUserNotificationService,
        UpsertNotificationService upsertNotificationService,
        GetAllFeedbackService getAllFeedbackService
    ) : base(userContext)
    {
        _getAdminAllInfoService = getAdminAllInfoService;
        _getReportDetailsService = getReportDetailsService;
        _adminCloseArchivePubService = adminCloseArchivePubService;
        _adminUnpublishArchiveService = adminUnpublishArchiveService;
        _sendUserNotificationService = sendUserNotificationService;
        _upsertNotificationService = upsertNotificationService;
        _getAllFeedbackService = getAllFeedbackService;
    }

    [HttpPost("GetAdminAllInfo")]
    public async Task<IActionResult> GetAdminAllInfo([FromBody] GetAdminAllInfoService.GetAdminAllInfoReq req)
        => OkWithBase(await _getAdminAllInfoService.ExecuteAsync(req));

    [HttpPost("GetReportDetails")]
    public async Task<IActionResult> GetReportDetails([FromBody] GetReportDetailsService.GetReportDetailsReq req)
        => OkWithBase(await _getReportDetailsService.ExecuteAsync(req));

    [HttpPost("AdminCloseArchive")]
    public async Task<IActionResult> AdminCloseArchive([FromBody] AdminCloseArchivePubService.AdminCloseArchivePubReq req)
        => OkWithBase(await _adminCloseArchivePubService.ExecuteAsync(req));

    [HttpPost("AdminUnpublishArchive")]
    public async Task<IActionResult> AdminUnpublishArchive([FromBody] AdminUnpublishArchiveService.AdminUnpublishArchiveReq req)
        => OkWithBase(await _adminUnpublishArchiveService.ExecuteAsync(req));

    [HttpPost("SendUserNotification")]
    public async Task<IActionResult> SendUserNotification([FromBody] SendUserNotificationService.SendUserNotificationReq req)
        => OkWithBase(await _sendUserNotificationService.ExecuteAsync(req));

    [HttpPost("UpsertNotification")]
    public async Task<IActionResult> UpsertNotification([FromBody] UpsertNotificationService.UpsertNotificationReq req)
        => OkWithBase(await _upsertNotificationService.ExecuteAsync(req));

    [HttpPost("GetAllFeedback")]
    public async Task<IActionResult> GetAllFeedback([FromBody] GetAllFeedbackService.GetAllFeedbackReq req)
        => OkWithBase(await _getAllFeedbackService.ExecuteAsync(req));
}