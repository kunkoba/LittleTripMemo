using LittleTripMemo.Common;
using LittleTripMemo.Repository.App;

namespace LittleTripMemo.Services.Public;

public class AddClickQueueService : _BaseService
{
    private readonly ClickQueueRepository _repo;

    public record AddClickReq(
        int target_type,
        Guid target_user_id,
        int? archive_id,
        long? seq,
        string item_name
    );

    public AddClickQueueService(UserContext u, ClickQueueRepository r) : base(u) => _repo = r;

    public async Task ExecuteAsync(AddClickReq req)
    {
        // viewer_user_id は Context から取得（未ログインなら Empty = NULL扱い）
        Guid? viewerId = _user.login_user_id == Guid.Empty ? null : _user.login_user_id;

        await _repo.InsertQueueAsync(
            req.target_type,
            req.target_user_id,
            req.archive_id,
            req.seq,
            req.item_name,
            viewerId
        );
    }
}