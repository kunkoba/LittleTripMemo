using LittleTripMemo.Common;
using LittleTripMemo.Controllers;
using LittleTripMemo.Services.Sys;
using Microsoft.AspNetCore.Mvc;
using static GetAllFeedbackService;

[ApiController]
[CustomAuthorize]
public class SysController : _BaseController
{
    private readonly UpsertFeedbackService _upsertFeedbackService;
    private readonly GetAllFeedbackService _getFeedbackService;
    private readonly UpsertReportService _upsertReportService;
    private readonly GetSystemInfoService _getSystemInfoService;
    private readonly UpsertNotificationService _upsertNotificationService;
    private readonly GetReportSummaryService _getReportSummaryService;
    private readonly GetAllNotificationsService _getAllNotificationsService;
    private readonly GetReportDetailsService _getReportDetailsService;
    private readonly GetMyFeedbackService _getMyFeedbackService;
    private readonly GetMyReportService _getMyReportService;
    private readonly DeleteMyReportService _deleteMyReportService;

    public SysController(
        UserContext user,
        IHttpContextAccessor accessor,
        UpsertFeedbackService upsertFeedbackService,
        GetAllFeedbackService getAllFeedbackService,
        UpsertReportService upsertReportService,
        GetSystemInfoService getSystemInfoService,
        UpsertNotificationService upsertNotificationService,
        GetReportSummaryService getReportSummaryService,
        GetAllNotificationsService getAllNotificationsService,
        GetReportDetailsService getReportDetailsService,
        GetMyFeedbackService getMyFeedbackService,
        GetMyReportService getMyReportService,
        DeleteMyReportService deleteMyReportService
    ) : base(user, accessor)
    {
        _upsertFeedbackService = upsertFeedbackService;
        _getFeedbackService = getAllFeedbackService;
        _upsertReportService = upsertReportService;
        _getSystemInfoService = getSystemInfoService;
        _upsertNotificationService = upsertNotificationService;
        _getReportSummaryService = getReportSummaryService;
        _getAllNotificationsService = getAllNotificationsService;
        _getReportDetailsService = getReportDetailsService;
        _getMyFeedbackService = getMyFeedbackService;
        _getMyReportService = getMyReportService;
        _deleteMyReportService = deleteMyReportService;
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
    public async Task<IActionResult> GetAllFeedback([FromBody] GetAllFeedbackService.GetAllFeedbackReq req)
    {
        var result = await _getFeedbackService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 通知取得（管理者）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
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

    /// <summary>
    /// フィードバック取得（ユーザ）
    /// </summary>
    /// <returns></returns>
    [HttpPost("api/Sys/GetMyFeedback")]
    public async Task<IActionResult> GetMyFeedback()
    {
        var result = await _getMyFeedbackService.ExecuteAsync();
        return OkWithBase(result);
    }

    /// <summary>
    /// 通報取得（ユーザ）
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/Sys/GetMyReport")]
    public async Task<IActionResult> GetMyReport([FromBody] GetMyReportService.GetMyReportReq req)
    {
        var result = await _getMyReportService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    [HttpPost("api/Sys/DeleteMyReport")]
    public async Task<IActionResult> DeleteMyReport([FromBody] DeleteMyReportService.DeleteMyReportReq req)
    {
        var result = await _deleteMyReportService.ExecuteAsync(req);
        return OkWithBase(result);
    }

}