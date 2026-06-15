using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

public class OpenArchiveService : _BaseService
{
    private readonly ArchivePubRepository _archivePubRepo;

    public record OpenArchiveReq(
        [Required] Guid login_user_id,
        int archive_id
    ) : ILoginUserRequest;

    public record Response(int archiveId);

    public OpenArchiveService(
        UserContext userContext,
        ArchivePubRepository archivePubRepo)
        : base(userContext)
    {
        _archivePubRepo = archivePubRepo;
    }

    public async Task<Response> ExecuteAsync(OpenArchiveReq req)
    {
        await ValidateAsync(req);
        await _archivePubRepo.OpenByKeyAsync(req.archive_id);
        return new Response(req.archive_id);
    }

    private async Task ValidateAsync(OpenArchiveReq req)
    {
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}