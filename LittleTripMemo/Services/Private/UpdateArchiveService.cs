using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class UpdateArchiveService : _BaseService
{
    private readonly ArchiveRepository _archiveRepo;

    public record UpdateArchiveReq(
        int archive_id,
        string title,
        string memo,
        string link_url
    );
    public record Response(int archiveId);

    public UpdateArchiveService(
        UserContext userContext,
        ArchiveRepository archiveRepo)
        : base(userContext)
    {
        _archiveRepo = archiveRepo;
    }

    public async Task<Response> ExecuteAsync(UpdateArchiveReq req)
    {
        await ValidateAsync(req);
        await _archiveRepo.UpdateByKeyAsync(new TMemoArchive
        {
            archive_id = req.archive_id,
            title = req.title,
            memo = req.memo,
            link_url = req.link_url
        });
        return new Response(req.archive_id);
    }

    private async Task ValidateAsync(UpdateArchiveReq req)
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        BusinessException.ThrowIf(string.IsNullOrEmpty(req.title), "タイトルは必須です");
        await Task.CompletedTask;
    }
}