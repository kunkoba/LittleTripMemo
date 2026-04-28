// Services/GetUserProfileService.cs
using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using Microsoft.AspNetCore.Identity;

namespace LittleTripMemo.Services;

public class GetUserProfileService : _BaseService
{
    private readonly UserManager<MyAppUser> _userManager;

    public record Response(
        Guid user_id, 
        string? icon, 
        string? nickName,
        string? description, 
        string? link1, string? link2, string? link3,
        bool is_owner
    );

    public GetUserProfileService(UserContext userContext, UserManager<MyAppUser> userManager)
        : base(userContext) => _userManager = userManager;

    public async Task<Response> ExecuteAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        BusinessException.ThrowIf(user == null, "ユーザーが存在しません");

        return new Response(
            user.Id, 
            user.Icon, 
            user.NickName,
            user.Description, 
            user.Link1, user.Link2, user.Link3,
            (user.Id == _user.UserId)
        );
    }
}