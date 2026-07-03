using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Services;
using System.ComponentModel.DataAnnotations;

/// <summary>
/// 指定された公開まとめの「限定公開」を解除（全体公開に戻す）するサービス
/// </summary>
public class CloseLimitedArchiveService(UserContext user, ArchivePubRepository repo) : _BaseService(user)
{
    public record CloseLimitedArchiveReq(
        [Required] Guid login_user_id,
        [Required] int archive_id
    ) : ILoginUserRequest;

    public record Response(int archiveId);

    public async Task<Response> ExecuteAsync(CloseLimitedArchiveReq req)
    {
        await ValidateAsync(req);
        await repo.UpdateLimitedOpenByKeyAsync(req.archive_id, false);
        return new Response(req.archive_id);
    }

    private async Task ValidateAsync(CloseLimitedArchiveReq req)
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(req.archive_id <= 0, "無効なアーカイブIDです");
        await Task.CompletedTask;
    }

}