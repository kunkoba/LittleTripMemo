using LittleTripMemo.Common;
using LittleTripMemo.Services.Admin;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

[ApiController]
[Route("api/[controller]")]
[CustomAuthorize]
public class AdminController(
    UserContext userContext,
    GetAdminAllInfoService getAdminAllInfoService,
    GetReportDetailsService getReportDetailsService,
    AdminCloseArchivePubService adminCloseArchivePubService,
    AdminUnpublishArchiveService adminUnpublishArchiveService,
    SendUserNotificationService sendUserNotificationService,
    UpsertNotificationService upsertNotificationService,
    GetAllFeedbackService getAllFeedbackService,
    UpdateUserBanStatusService updateUserBanStatusService,
    GetReportSummaryService getReportSummaryService,       // ★追加
    GetAdminNotificationsService getAdminNotificationsService, // ★追加
    GetSentUserMailListService getSentUserMailListService      // ★追加
) : _BaseController(userContext)
{
    [HttpPost("GetAdminAllInfo")]
    public async Task<IActionResult> GetAdminAllInfo([FromBody] GetAdminAllInfoService.GetAdminAllInfoReq req)
        => OkWithBase(await getAdminAllInfoService.ExecuteAsync(req));

    [HttpPost("GetReportDetails")]
    public async Task<IActionResult> GetReportDetails([FromBody] GetReportDetailsService.GetReportDetailsReq req)
        => OkWithBase(await getReportDetailsService.ExecuteAsync(req));

    [HttpPost("AdminCloseArchive")]
    public async Task<IActionResult> AdminCloseArchive([FromBody] AdminCloseArchivePubService.AdminCloseArchivePubReq req)
        => OkWithBase(await adminCloseArchivePubService.ExecuteAsync(req));

    [HttpPost("AdminUnpublishArchive")]
    public async Task<IActionResult> AdminUnpublishArchive([FromBody] AdminUnpublishArchiveService.AdminUnpublishArchiveReq req)
        => OkWithBase(await adminUnpublishArchiveService.ExecuteAsync(req));

    [HttpPost("SendUserNotification")]
    public async Task<IActionResult> SendUserNotification([FromBody] SendUserNotificationService.SendUserNotificationReq req)
        => OkWithBase(await sendUserNotificationService.ExecuteAsync(req));

    [HttpPost("UpsertNotification")]
    public async Task<IActionResult> UpsertNotification([FromBody] UpsertNotificationService.UpsertNotificationReq req)
        => OkWithBase(await upsertNotificationService.ExecuteAsync(req));

    [HttpPost("GetAllFeedback")]
    public async Task<IActionResult> GetAllFeedback([FromBody] GetAllFeedbackService.GetAllFeedbackReq req)
        => OkWithBase(await getAllFeedbackService.ExecuteAsync(req));

    [HttpPost("UpdateUserBanStatus")]
    public async Task<IActionResult> UpdateUserBanStatus([FromBody] UpdateUserBanStatusService.UpdateUserBanStatusReq req)
        => OkWithBase(await updateUserBanStatusService.ExecuteAsync(req));

    [HttpPost("GetReportSummary")]
    public async Task<IActionResult> GetReportSummary()
        => OkWithBase(await getReportSummaryService.ExecuteAsync());

    [HttpPost("GetAdminNotifications")]
    public async Task<IActionResult> GetAdminNotifications()
        => OkWithBase(await getAdminNotificationsService.ExecuteAsync());

    [HttpPost("GetSentUserMailList")]
    public async Task<IActionResult> GetSentUserMailList()
        => OkWithBase(await getSentUserMailListService.ExecuteAsync());

}