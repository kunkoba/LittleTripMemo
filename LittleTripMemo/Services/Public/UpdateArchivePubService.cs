using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.App;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Public;

public class UpdateArchivePubService : _BaseService
{
    private readonly ArchivePubRepository _archivePubRepo;

    public record UpdateArchivePubReq(
        [Required] Guid login_user_id,
        int archive_id,
        string title,
        string memo,
        string? link_url,
        string currency_unit
    ) : ILoginUserRequest;

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
            link_url = req.link_url,
            currency_unit = req.currency_unit
        });
        return new Response(req.archive_id);
    }

    private async Task ValidateAsync(UpdateArchivePubReq req)
    {
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        BusinessException.ThrowIf(string.IsNullOrEmpty(req.title), "タイトルは必須です");
        await Task.CompletedTask;
    }
}