using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

public class UpdateArchiveService : _BaseService
{
    private readonly ArchiveRepository _archiveRepo;

    public record UpdateArchiveReq(
        [Required] Guid login_user_id,
        int archive_id,
        string title,
        string memo,
        string? link_url,
        string currency_unit
    ) : ILoginUserRequest;

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
        int affected = await _archiveRepo.UpdateByKeyAsync(new TMemoArchive
        {
            archive_id = req.archive_id,
            title = req.title,
            memo = req.memo,
            link_url = req.link_url,
            currency_unit = req.currency_unit
        });
        return new Response(req.archive_id);
    }

    private async Task ValidateAsync(UpdateArchiveReq req)
    {
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        BusinessException.ThrowIf(string.IsNullOrEmpty(req.title), "タイトルは必須です");
        await Task.CompletedTask;
    }
}