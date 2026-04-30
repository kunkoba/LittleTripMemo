using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

public class GetArchiveDetailsService : _BaseService
{
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;
    private readonly GetUserProfileService _getUserProfileService;

    public record GetArchiveDetailsReq(
        [Required(ErrorMessage = "アーカイブIDは必須です")] int archive_id
    );
    //public record Response(TMemoArchive archive, IEnumerable<TMemoDetail> details);
    public record Response(
        TMemoArchive archive, 
        IEnumerable<TMemoDetail> details, 
        GetUserProfileService.Response userProfile
    );

    public GetArchiveDetailsService(
        UserContext userContext,
        ArchiveRepository archiveRepo,
        DetailRepository detailRepo,
        GetUserProfileService getUserProfileService)
        : base(userContext)
    {
        _archiveRepo = archiveRepo;
        _detailRepo = detailRepo;
        _getUserProfileService = getUserProfileService;
    }

    public async Task<Response> ExecuteAsync(GetArchiveDetailsReq req)
    {
        await ValidateAsync();
        var archive = await _archiveRepo.GetByKeyAsync(req.archive_id);
        SetAppFlags(archive);
        var details = await _detailRepo.GetByArchiveIdAsync(req.archive_id);
        SetAppFlags(details);
        var profile = await _getUserProfileService.ExecuteAsync(archive.user_id);

        return new Response(archive, details, profile);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}