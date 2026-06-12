using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

public class CloseArchiveService : _BaseService
{
    private readonly ArchivePubRepository _archivePubRepo;

    public record CloseArchiveReq(
        [Required] Guid login_user_id,
        int archive_id
    ) : ILoginUserRequest; 

    public record Response(int archiveId);

    public CloseArchiveService(
        UserContext userContext,
        ArchivePubRepository archivePubRepo)
        : base(userContext)
    {
        _archivePubRepo = archivePubRepo;
    }

    public async Task<Response> ExecuteAsync(CloseArchiveReq req)
    {
        await ValidateAsync(req);
        await _archivePubRepo.CloseByKeyAsync(req.archive_id);
        return new Response(req.archive_id);
    }

    private async Task ValidateAsync(CloseArchiveReq req)
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}