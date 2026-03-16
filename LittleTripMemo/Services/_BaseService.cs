
using LittleTripMemo.Common;

namespace LittleTripMemo.Services;

public abstract class _BaseService
{
    // 継承先のサービスから自由に参照可能
    protected readonly UserContext _user;

    protected _BaseService(UserContext userContext)
    {
        _user = userContext;
    }

    // 単体データ用の共通フラグセット処理
    protected void SetAppFlags<T>(T entity) where T : IAppRecord
    {
        if (entity != null)
        {
            // 自分が所有者か判定
            entity.is_owner = (entity.user_id == _user.UserId);
        }
    }

    // リストデータ用の共通フラグセット処理
    protected void SetAppFlags<T>(IEnumerable<T> entities) where T : IAppRecord
    {
        if (entities == null) return;

        foreach (var entity in entities)
        {
            // 自分が所有者か判定
            entity.is_owner = (entity.user_id == _user.UserId);
        }
    }
}

