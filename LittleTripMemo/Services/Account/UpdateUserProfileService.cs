using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.Sys;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Account;

/// <summary>
/// ログインユーザー自身のプロフィール情報を更新するサービス
/// </summary>
public class UpdateUserProfileService : _BaseService
{
    private readonly AppUserRepository _appUserRepo;

public record UpdateUserReq(
    [Required] Guid login_user_id,
    [Required] string icon,
    [Required] string nick_name,
    string description,
    string? user_category,
    string link_1, string link_2, string link_3
) : ILoginUserRequest;

    public record Response();

    public UpdateUserProfileService(UserContext userContext, AppUserRepository appUserRepo) : base(userContext)
    {
        _appUserRepo = appUserRepo;
    }

    public async Task<Response> ExecuteAsync(UpdateUserReq req)
    {
        // 1. バリデーション
        await ValidateAsync(req);

        // 2. プロフィール更新
        var app_user = new TAppUser
        {
            user_id = _user.login_user_id,
            icon = req.icon,
            nick_name = req.nick_name,
            description = req.description,
            user_category = req.user_category,
            link_1 = req.link_1,
            link_2 = req.link_2,
            link_3 = req.link_3
        };

        await _appUserRepo.UpdateProfileAsync(app_user);

        return new Response();
    }

    private async Task ValidateAsync(UpdateUserReq req)
    {
        // 基底クラスでログイン確認
        await EnsureLoginUserAsync(_appUserRepo);

        // 入力値のバリデーション
        BusinessException.ThrowIf(req.nick_name.Length > 50, "ニックネームが長すぎます");
        BusinessException.ThrowIf(req.description?.Length > 500, "説明文が長すぎます");

        await Task.CompletedTask;
    }

}
