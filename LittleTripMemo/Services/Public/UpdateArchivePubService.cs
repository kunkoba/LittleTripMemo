using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class UpdateArchivePubService : _BaseService
{
    private readonly ArchivePubRepository _archivePubRepo;

    public record UpdateArchivePubReq(
        int archive_id,
        string title,
        string memo,
        string link_url
    );
    public record Response(int archiveId);

    public UpdateArchivePubService(
        UserContext userContext,
        ArchivePubRepository archivePubRepo)
        : base(userContext)
    {
        _archivePubRepo = archivePubRepo;
    }

    public async Task<Response> ExecuteAsync(UpdateArchivePubReq req)
    {
        await ValidateAsync(req);
        await _archivePubRepo.UpdateByKeyAsync(new TMemoArchivePub
        {
            archive_id = req.archive_id,
            title = req.title,
            memo = req.memo,
            link_url = req.link_url
        });
        return new Response(req.archive_id);
    }

    private async Task ValidateAsync(UpdateArchivePubReq req)
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        BusinessException.ThrowIf(string.IsNullOrEmpty(req.title), "タイトルは必須です");
        await Task.CompletedTask;
    }
}