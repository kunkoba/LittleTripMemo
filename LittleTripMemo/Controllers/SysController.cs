using LittleTripMemo.Common;
using LittleTripMemo.Services.Sys;
using Microsoft.AspNetCore.Mvc;

namespace LittleTripMemo.Controllers;

[ApiController]
[Route("api/[controller]")]
[CustomAuthorize]
public class SysController : _BaseController
{
    private readonly GetSystemInfoService _getSystemInfoService;
    private readonly UpsertFeedbackService _upsertFeedbackService;
    private readonly GetMyFeedbackService _getMyFeedbackService;
    private readonly UpsertReportService _upsertReportService;
    private readonly GetMyReportService _getMyReportService;
    private readonly DeleteMyReportService _deleteMyReportService;
    private readonly GetMyUserNotificationsService _getMyUserNotificationsService;

    public SysController(
        UserContext userContext,
        GetSystemInfoService getSystemInfoService,
        UpsertFeedbackService upsertFeedbackService,
        GetMyFeedbackService getMyFeedbackService,
        UpsertReportService upsertReportService,
        GetMyReportService getMyReportService,
        DeleteMyReportService deleteMyReportService,
        GetMyUserNotificationsService getMyUserNotificationsService
    ) : base(userContext)
    {
        _getSystemInfoService = getSystemInfoService;
        _upsertFeedbackService = upsertFeedbackService;
        _getMyFeedbackService = getMyFeedbackService;
        _upsertReportService = upsertReportService;
        _getMyReportService = getMyReportService;
        _deleteMyReportService = deleteMyReportService;
        _getMyUserNotificationsService = getMyUserNotificationsService;
    }

    [HttpPost("GetSystemInfo")]
    public async Task<IActionResult> GetSystemInfo()
        => OkWithBase(await _getSystemInfoService.ExecuteAsync());

    [HttpPost("UpsertFeedback")]
    public async Task<IActionResult> UpsertFeedback([FromBody] UpsertFeedbackService.UpsertFeedbackReq req)
        => OkWithBase(await _upsertFeedbackService.ExecuteAsync(req));

    [HttpPost("GetMyFeedback")]
    public async Task<IActionResult> GetMyFeedback()
        => OkWithBase(await _getMyFeedbackService.ExecuteAsync());

    [HttpPost("UpsertReport")]
    public async Task<IActionResult> UpsertReport([FromBody] UpsertReportService.UpsertReportReq req)
        => OkWithBase(await _upsertReportService.ExecuteAsync(req));

    [HttpPost("GetMyReport")]
    public async Task<IActionResult> GetMyReport([FromBody] GetMyReportService.GetMyReportReq req)
        => OkWithBase(await _getMyReportService.ExecuteAsync(req));

    [HttpPost("DeleteMyReport")]
    public async Task<IActionResult> DeleteMyReport([FromBody] DeleteMyReportService.DeleteMyReportReq req)
        => OkWithBase(await _deleteMyReportService.ExecuteAsync(req));

    [HttpPost("GetMyUserNotifications")]
    public async Task<IActionResult> GetMyUserNotifications()
        => OkWithBase(await _getMyUserNotificationsService.ExecuteAsync());
}