using LittleTripMemo.Common;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.Sys;

namespace LittleTripMemo.Services.Account;

public class EnsureLoginUserService : _BaseService
{
    private readonly AppUserRepository _appUserRepo;

    public record EnsureLoginUserReq();
    public record Response(TAppUser user_info);

    public EnsureLoginUserService(UserContext userContext, AppUserRepository appUserRepo)
        : base(userContext) => _appUserRepo = appUserRepo;

    public async Task<Response> ExecuteAsync(EnsureLoginUserReq req)
    {
        // 1. 作法：検証（内部で EnsureLoginUserAsync を呼び、不在なら AUTH_REQUIRED を投げる）
        await ValidateAsync(req);

        // 2. 最終ログイン日時の更新（フロント側での1日1回制御に基づく実行）
        await _appUserRepo.UpdateLastLoginTimeAsync(_user.login_user_id);

        // 3. ユーザー情報を取得して返却（初期化用データとして利用可能）
        var user = await _appUserRepo.GetByUserIdAsync(_user.login_user_id);
        return new Response(user!);
    }

    private async Task ValidateAsync(EnsureLoginUserReq req)
    {
        // 基底クラスの共通メソッドでチェック
        await EnsureLoginUserAsync(_appUserRepo);
    }
}