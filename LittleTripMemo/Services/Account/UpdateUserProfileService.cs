// Services/UpdateUserService.cs

using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using Microsoft.AspNetCore.Identity;

namespace LittleTripMemo.Services;

public class UpdateUserProfileService : _BaseService
{
    private readonly AppUserRepository _appUserRepo;

    public record UpdateUserReq(
        string icon,
        string nick_name,
        string description,
        string link_1,
        string link_2,
        string link_3
    );

    public record Response();

    public UpdateUserProfileService(
        UserContext userContext,
        AppUserRepository appUserRepo)
        : base(userContext)
    {
        _appUserRepo = appUserRepo;
    }

    public async Task<Response> ExecuteAsync(UpdateUserReq req)
    {
        await ValidateAsync(req);

        // IdentityUser(認証)ではなく、AppUser(業務プロフ)を更新
        var app_user = new TAppUser
        {
            user_id = _user.user_id,
            icon = req.icon,
            nick_name = req.nick_name,
            description = req.description,
            link_1 = req.link_1,
            link_2 = req.link_2,
            link_3 = req.link_3
        };

        await _appUserRepo.UpdateProfileAsync(app_user);

        return new Response();
    }

    private async Task ValidateAsync(UpdateUserReq req)
    {
        BusinessException.ThrowIf(_user.user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");

        BusinessException.ThrowIf(string.IsNullOrWhiteSpace(req.nick_name), "ニックネームは必須です");
        BusinessException.ThrowIf(req.nick_name.Length > 50, "ニックネームが長すぎます");
        BusinessException.ThrowIf(req.description?.Length > 500, "説明文が長すぎます");

        await Task.CompletedTask;
    }
}