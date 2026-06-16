using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services.Account;

public class GetUserProfileService : _BaseService
{
    private readonly AppUserRepository _appUserRepo;

    public record GetUserProfileReq(Guid target_user_id);

    public record Response(
        Guid user_id,
        string? icon,
        string? nick_name,
        string? description,
        string? link_1, string? link_2, string? link_3,
        bool is_owner
    );

    public GetUserProfileService(UserContext userContext, AppUserRepository appUserRepository)
        : base(userContext) => _appUserRepo = appUserRepository;

    /// <param name="target_user_id">プロフィールを見たい相手のID</param>
    public async Task<Response> ExecuteAsync(Guid target_user_id)
    {
        await ValidateAsync(target_user_id);

        // 1. ターゲットユーザー（対象者）の情報をDBから取得
        var targetUser = await _appUserRepo.GetByUserIdAsync(target_user_id);
        BusinessException.ThrowIf(targetUser == null, "ユーザーが存在しません", "USER_NOT_FOUND");

        // 2. 所有者判定: 対象者が自分（_user.user_id）自身かどうかを判定
        bool is_owner = (targetUser.user_id == _user.login_user_id);

        return new Response(
            targetUser.user_id,
            targetUser.icon,
            targetUser.nick_name,
            targetUser.description,
            targetUser.link_1,
            targetUser.link_2,
            targetUser.link_3,
            is_owner
        );
    }

    private async Task ValidateAsync(Guid userId)
    {
        // 他のサービス同様、コンテキストと引数のチェックを徹底
        BusinessException.ThrowIf(userId == Guid.Empty, "対象のユーザーIDが指定されていません");

        await Task.CompletedTask;
    }

}