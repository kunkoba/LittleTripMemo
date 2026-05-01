using LittleTripMemo.Common;
using LittleTripMemo.Controllers;
using LittleTripMemo.Services.System;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[CustomAuthorize]
public class SysController : _BaseController
{
    private readonly UpsertFeedbackService _upsertFeedbackService;
    private readonly GetMyFeedbackService _getMyFeedbackService;
    private readonly GetActiveNotificationsService _getActiveNotificationsService;
    private readonly UpsertReportService _upsertReportService;
    private readonly GetSystemInfoService _getSystemInfoService;
    private readonly UpsertNotificationService _upsertNotificationService;
    private readonly GetReportSummaryService _getReportSummaryService;

    public SysController(
        UserContext user,
        IHttpContextAccessor accessor,
        UpsertFeedbackService upsertFeedbackService,
        GetMyFeedbackService getMyFeedbackService,
        GetActiveNotificationsService getActiveNotificationsService,
        UpsertReportService upsertReportService,
        GetSystemInfoService getSystemInfoService,
        UpsertNotificationService upsertNotificationService,
        GetReportSummaryService getReportSummaryService
    ) : base(user, accessor)
    {
        _upsertFeedbackService = upsertFeedbackService;
        _getMyFeedbackService = getMyFeedbackService;
        _getActiveNotificationsService = getActiveNotificationsService;
        _upsertReportService = upsertReportService;
        _getSystemInfoService = getSystemInfoService;
        _upsertNotificationService = upsertNotificationService;
        _getReportSummaryService = getReportSummaryService;
    }

    [HttpPost("api/Sys/UpsertFeedback")]
    public async Task<IActionResult> UpsertFeedback([FromBody] UpsertFeedbackService.UpsertFeedbackReq req)
    {
        var result = await _upsertFeedbackService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    [HttpPost("api/Sys/GetMyFeedback")]
    public async Task<IActionResult> GetMyFeedback()
    {
        var result = await _getMyFeedbackService.ExecuteAsync();
        return OkWithBase(result);
    }

    [HttpPost("api/Sys/GetActiveNotifications")]
    public async Task<IActionResult> GetActiveNotifications()
    {
        var result = await _getActiveNotificationsService.ExecuteAsync();
        return OkWithBase(result);
    }

    [HttpPost("api/Sys/UpsertReport")]
    public async Task<IActionResult> UpsertReport([FromBody] UpsertReportService.UpsertReportReq req)
    {
        var result = await _upsertReportService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    [HttpPost("api/Sys/GetSystemInfo")]
    public async Task<IActionResult> GetSystemInfo()
    {
        var result = await _getSystemInfoService.ExecuteAsync();
        return OkWithBase(result);
    }

    [HttpPost("api/Sys/UpsertNotification")]
    public async Task<IActionResult> UpsertNotification([FromBody] UpsertNotificationService.UpsertNotificationReq req)
    {
        var result = await _upsertNotificationService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    [HttpPost("api/Sys/GetReportSummary")]
    public async Task<IActionResult> GetReportSummary([FromBody] GetReportSummaryService.GetReportSummaryReq req)
    {
        var result = await _getReportSummaryService.ExecuteAsync(req);
        return OkWithBase(result);
    }
}