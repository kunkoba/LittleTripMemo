// Services/UpdateUserService.cs

using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using Microsoft.AspNetCore.Identity;

namespace LittleTripMemo.Services;

public class UpdateUserProfileService : _BaseService
{
    private readonly UserManager<MyAppUser> _userManager;

    public record UpdateUserReq(
        string icon,
        string nickName,
        string description,
        string link1,
        string link2,
        string link3
    );

    public record Response();

    public UpdateUserProfileService(
        UserContext userContext,
        UserManager<MyAppUser> userManager)
        : base(userContext)
    {
        _userManager = userManager;
    }

    public async Task<Response> ExecuteAsync(UpdateUserReq req)
    {
        await ValidateAsync(req);

        // ログインユーザー取得
        var user = await _userManager.FindByIdAsync(_user.UserId.ToString());
        BusinessException.ThrowIf(user == null, "ユーザーが存在しません");

        // 更新
        user.Icon = req.icon;
        user.NickName = req.nickName;
        user.Description = req.description;
        user.Link1 = req.link1;
        user.Link2 = req.link2;
        user.Link3 = req.link3;

        var result = await _userManager.UpdateAsync(user);

        BusinessException.ThrowIf(
            !result.Succeeded,
            string.Join(",", result.Errors.Select(x => x.Description))
        );

        return new Response();
    }

    private async Task ValidateAsync(UpdateUserReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");

        BusinessException.ThrowIf(string.IsNullOrWhiteSpace(req.nickName), "ニックネームは必須です");
        BusinessException.ThrowIf(req.nickName.Length > 50, "ニックネームが長すぎます");
        BusinessException.ThrowIf(req.description?.Length > 500, "説明文が長すぎます");

        await Task.CompletedTask;
    }
}