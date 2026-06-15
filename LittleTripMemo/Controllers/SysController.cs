using LittleTripMemo.Common;
using LittleTripMemo.Controllers;
using LittleTripMemo.Services.Admin;
using LittleTripMemo.Services.Sys;
using Microsoft.AspNetCore.Mvc;
//using static GetAllFeedbackService;

[ApiController]
[CustomAuthorize]
public class SysController : _BaseController
{
    private readonly UpsertFeedbackService _upsertFeedbackService;
    private readonly UpsertReportService _upsertReportService;
    private readonly GetSystemInfoService _getSystemInfoService;
    private readonly GetReportDetailsService _getReportDetailsService;
    private readonly GetMyFeedbackService _getMyFeedbackService;
    private readonly GetMyReportService _getMyReportService;
    private readonly DeleteMyReportService _deleteMyReportService;
    private readonly SendUserNotificationService _sendUserNotificationService;
    private readonly GetMyUserNotificationsService _getMyUserNotificationsService;
    private readonly AdminCloseArchivePubService _adminCloseArchivePubService;
    private readonly AdminUnpublishArchiveService _adminUnpublishArchiveService;
    private readonly GetAdminAllInfoService _getAdminAllInfoService;
    private readonly UpsertNotificationService _upsertNotificationService;
    private readonly GetAllFeedbackService _getAllFeedbackService;

    public SysController(
        UserContext user,
        UpsertFeedbackService upsertFeedbackService,
        UpsertReportService upsertReportService,
        GetSystemInfoService getSystemInfoService,
        GetReportDetailsService getReportDetailsService,
        GetMyFeedbackService getMyFeedbackService,
        GetMyReportService getMyReportService,
        DeleteMyReportService deleteMyReportService,
        SendUserNotificationService sendUserNotificationService,
        GetMyUserNotificationsService getMyUserNotificationsService,
        AdminCloseArchivePubService adminCloseArchivePubService,
        AdminUnpublishArchiveService adminUnpublishArchiveService,
        GetAdminAllInfoService getAdminAllInfoService,
        UpsertNotificationService upsertNotificationService,
        GetAllFeedbackService getAllFeedbackService
    ) : base(user)
    {
        _upsertFeedbackService = upsertFeedbackService;
        _upsertReportService = upsertReportService;
        _getSystemInfoService = getSystemInfoService;
        _getReportDetailsService = getReportDetailsService;
        _getMyFeedbackService = getMyFeedbackService;
        _getMyReportService = getMyReportService;
        _deleteMyReportService = deleteMyReportService;
        _sendUserNotificationService = sendUserNotificationService;
        _getMyUserNotificationsService = getMyUserNotificationsService;
        _adminCloseArchivePubService　= adminCloseArchivePubService;
        _adminUnpublishArchiveService = adminUnpublishArchiveService;
        _upsertNotificationService = upsertNotificationService;
        _getAdminAllInfoService = getAdminAllInfoService;
        _getAllFeedbackService = getAllFeedbackService;
    }

#region "System"

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

    /// <summary>
    /// 通報削除
    /// </summary>
    [HttpPost("api/Sys/DeleteMyReport")]
    public async Task<IActionResult> DeleteMyReport([FromBody] DeleteMyReportService.DeleteMyReportReq req)
    {
        var result = await _deleteMyReportService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 自分宛ての個人通知を取得（ユーザー用）
    /// </summary>
    [HttpPost("api/Sys/GetMyUserNotifications")]
    public async Task<IActionResult> GetMyUserNotifications()
    {
        var result = await _getMyUserNotificationsService.ExecuteAsync();
        return OkWithBase(result);
    }

#endregion

#region "Admin"

    /// <summary>
    /// 【管理者権限】まとめ親を強制クローズ
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/Sys/AdminCloseArchive")]
    public async Task<IActionResult> AdminCloseArchive([FromBody] AdminCloseArchivePubService.AdminCloseArchivePubReq req)
    {
        var result = await _adminCloseArchivePubService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 【管理者権限】まとめ親を強制削除
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/Sys/AdminUnpublishArchive")]
    public async Task<IActionResult> AdminUnpublishArchive([FromBody] AdminUnpublishArchiveService.AdminUnpublishArchiveReq req)
    {
        var result = await _adminUnpublishArchiveService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 【管理者権限】ユーザに個別送信
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost("api/Sys/SendUserNotification")]
    public async Task<IActionResult> SendUserNotification([FromBody] SendUserNotificationService.SendUserNotificationReq req)
    {
        var result = await _sendUserNotificationService.ExecuteAsync(req);
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
    /// 【管理者権限】フィードバック一覧を取得
    /// </summary>
    [HttpPost("api/Sys/GetAllFeedback")]
    public async Task<IActionResult> GetAllFeedback([FromBody] GetAllFeedbackService.GetAllFeedbackReq req)
    {
        var result = await _getAllFeedbackService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 【管理者権限】通知情報登録更新
    /// </summary>
    [HttpPost("api/Sys/UpsertNotification")]
    public async Task<IActionResult> UpsertNotification([FromBody] UpsertNotificationService.UpsertNotificationReq req)
    {
        var result = await _upsertNotificationService.ExecuteAsync(req);
        return OkWithBase(result);
    }

    /// <summary>
    /// 【管理者権限】管理画面に必要な情報を一括取得する
    /// </summary>
    [HttpPost("api/Sys/GetAdminAllInfo")]
    public async Task<IActionResult> GetAdminAllInfo([FromBody] GetAdminAllInfoService.GetAdminAllInfoReq req)
    {
        var result = await _getAdminAllInfoService.ExecuteAsync(req);
        return OkWithBase(result);
    }

#endregion

}