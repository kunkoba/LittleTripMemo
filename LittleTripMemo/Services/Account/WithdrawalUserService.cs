using LittleTripMemo.Common;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Repository.Sys;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Account;

/// <summary>
/// ユーザー自身の操作による退会処理（論理削除）を担当するサービス
/// </summary>
public class WithdrawalUserService : _BaseService
{
    private readonly AppUserRepository _appUserRepo;

    // リクエストモデル（不正リクエスト防止のため ILoginUserRequest を実装）
    public record WithdrawalReq(
        [Required] Guid login_user_id
    ) : ILoginUserRequest;

    public record Response(bool is_success);

    public WithdrawalUserService(UserContext userContext, AppUserRepository appUserRepo)
        : base(userContext)
    {
        _appUserRepo = appUserRepo;
    }

    /// <summary>
    /// 退会処理を実行する
    /// </summary>
    public async Task<Response> ExecuteAsync(WithdrawalReq req)
    {
        // 1. 存在確認（すでに削除済みでないか、実在するかをベースサービスでチェック）
        await EnsureLoginUserAsync(_appUserRepo);

        // 2. 実行：自身の del_flg を true に更新
        // ※ リポジトリ側で update_tim も同時に更新されるため、バッチでの物理削除の起点となります
        int affected = await _appUserRepo.UpdateDeleteStatusAsync(_user.login_user_id, true);

        return new Response(affected > 0);
    }

}