using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public abstract class _BaseService
{
    protected readonly UserContext _user;

    protected _BaseService(UserContext userContext) => _user = userContext;

    /// <summary>
    /// 操作者（ログインユーザー）の存在を保証する。
    /// 存在しない場合は「AUTH_REQUIRED」エラーを投げ、クライアントにログインを促す。
    /// </summary>
    protected async Task<TAppUser> EnsureLoginUserAsync(AppUserRepository appUserRepo)
    {
        if (_user.user_id == Guid.Empty)
        {
            throw new BusinessException("ログインが必要です。", "AUTH_REQUIRED");
        }

        var loginUser = await appUserRepo.GetByUserIdAsync(_user.user_id);
        if (loginUser == null)
        {
            // トークンは正しいが、アプリ側のユーザーテーブルにいない異常事態
            throw new BusinessException("ユーザー登録情報が見つかりません。再ログインしてください。", "AUTH_REQUIRED");
        }

        return loginUser;
    }

    // 所有者判定フラグのセット（プロパティ名を snake_case に変更）
    protected void SetAppFlags<T>(T? entity) where T : class, IAppRecord
    {
        if (entity != null)
        {
            entity.is_owner = (entity.user_id == _user.user_id);
        }
    }

    protected void SetAppFlags<T>(IEnumerable<T>? entities) where T : class, IAppRecord
    {
        if (entities == null) return;
        foreach (var entity in entities) SetAppFlags(entity);
    }

}