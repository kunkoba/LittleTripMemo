using LittleTripMemo.Common;
using LittleTripMemo.Controllers;
using LittleTripMemo.Services.Sys;
using Microsoft.AspNetCore.Mvc;
using static GetFeedbackService;

[ApiController]
[CustomAuthorize]
public class SysController : _BaseController
{
    private readonly UpsertFeedbackService _upsertFeedbackService;
    private readonly GetFeedbackService _getFeedbackService;
    private readonly UpsertReportService _upsertReportService;
    private readonly GetSystemInfoService _getSystemInfoService;
    private readonly UpsertNotificationService _upsertNotificationService;
    private readonly GetReportSummaryService _getReportSummaryService;
    private readonly GetAllNotificationsService _getAllNotificationsService;
    private readonly GetReportDetailsService _getReportDetailsService;

    public SysController(
        UserContext user,
        IHttpContextAccessor accessor,
        UpsertFeedbackService upsertFeedbackService,
        GetFeedbackService getMyFeedbackService,
        UpsertReportService upsertReportService,
        GetSystemInfoService getSystemInfoService,
        UpsertNotificationService upsertNotificationService,
        GetReportSummaryService getReportSummaryService,
        GetAllNotificationsService getAllNotificationsService,
        GetReportDetailsService getReportDetailsService

    ) : base(user, accessor)
    {
        _upsertFeedbackService = upsertFeedbackService;
        _getFeedbackService = getMyFeedbackService;
        _upsertReportService = upsertReportService;
        _getSystemInfoService = getSystemInfoService;
        _upsertNotificationService = upsertNotificationService;
        _getReportSummaryService = getReportSummaryService;
        _getAllNotificationsService = getAllNotificationsService;
        _getReportDetailsService = getReportDetailsService; 
    }

    /// <summary>
    /// フィードバック登録更新（ユーザ）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/Sys/UpsertFeedback")]
    public async Task<IActionResult> UpsertFeedback([FromBody] UpsertFeedbackService.UpsertFeedbackReq req)
    {
        var result = await _upsertFeedbackService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 通報情報登録更新（ユーザ）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/Sys/UpsertReport")]
    public async Task<IActionResult> UpsertReport([FromBody] UpsertReportService.UpsertReportReq req)
    {
        var result = await _upsertReportService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// システム情報取得（ユーザ）
    /// </summary>
    /// <returns></returns>
    [HttpPost("api/Sys/GetSystemInfo")]
    public async Task<IActionResult> GetSystemInfo()
    {
        var result = await _getSystemInfoService.ExecuteAsync();
        return OkWithBase(result);
    }

    /// <summary>
    /// 通知情報登録更新（管理者）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/Sys/UpsertNotification")]
    public async Task<IActionResult> UpsertNotification([FromBody] UpsertNotificationService.UpsertNotificationReq req)
    {
        var result = await _upsertNotificationService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 通常集計情報取得（管理者）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/Sys/GetReportSummary")]
    public async Task<IActionResult> GetReportSummary([FromBody] GetReportSummaryService.GetReportSummaryReq req)
    {
        var result = await _getReportSummaryService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// フィードバック取得（管理者）
    /// </summary>
    /// <returns></returns>
    [HttpPost("api/Sys/GetAllFeedback")]
    public async Task<IActionResult> GetAllFeedback([FromBody] GetFeedbackService.GetAllFeedbackReq req)
    {
        var result = await _getFeedbackService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    [HttpPost("api/Sys/GetAllNotifications")]
    public async Task<IActionResult> GetAllNotifications([FromBody] GetAllNotificationsService.GetAllNotificationsReq req)
    {
        var result = await _getAllNotificationsService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 通報詳細の取得（管理者用）
    /// </summary>
    [HttpPost("api/Sys/GetReportDetails")]
    public async Task<IActionResult> GetReportDetails([FromBody] GetReportDetailsService.GetReportDetailsReq req)
    {
        var result = await _getReportDetailsService.ExecuteAsync(req);
        return OkWithBase(result);
    }

}