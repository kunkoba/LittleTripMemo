using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

public class GetArchiveDetailsService : _BaseService
{
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;
    private readonly AppUserRepository _appUserRepo; 

    public record GetArchiveDetailsReq(
        [Required(ErrorMessage = "アーカイブIDは必須です")] int archive_id
    );

    public record Response(
        TMemoArchive archive,
        IEnumerable<TMemoDetail> details,
        DtoUserProfile userProfile // 共通DTOを使用
    );

    public GetArchiveDetailsService(
        UserContext userContext,
        ArchiveRepository archiveRepo,
        DetailRepository detailRepo,
        AppUserRepository appUserRepo) 
        : base(userContext)
    {
        _archiveRepo = archiveRepo;
        _detailRepo = detailRepo;
        _appUserRepo = appUserRepo;
    }

    public async Task<Response> ExecuteAsync(GetArchiveDetailsReq req)
    {
        await ValidateAsync();
        var archive = await _archiveRepo.GetByKeyAsync(req.archive_id);
        SetAppFlags(archive);
        var details = await _detailRepo.GetByArchiveIdAsync(req.archive_id);
        SetAppFlags(details);

        var user = await _appUserRepo.GetByUserIdAsync(archive.user_id)
            ?? throw new BusinessException("ユーザーが存在しません");

        var profile = new DtoUserProfile(
            user.user_id,
            user.icon,
            user.nick_name,
            user.description,
            user.link_1, user.link_2, user.link_3,
            is_owner: (user.user_id == _user.login_user_id)
        );

        return new Response(archive, details, profile);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}