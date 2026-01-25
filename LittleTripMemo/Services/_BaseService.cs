
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
}

