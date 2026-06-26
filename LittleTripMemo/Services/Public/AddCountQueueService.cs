using LittleTripMemo.Common;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.App;

namespace LittleTripMemo.Services.Public;

public class AddCountQueueService : _BaseService
{
    private readonly CountQueueRepository _repo;

    public record AddCountReq(
        CountTargetType target_type, 
        Guid target_user_id,
        int? archive_id,
        long? seq,
        string item_name
    );
    public record Response(bool is_success);

    public AddCountQueueService(UserContext u, CountQueueRepository r) : base(u) => _repo = r;

    public async Task<Response> ExecuteAsync(AddCountReq req)
    {
        // viewer_user_id は Context から取得（未ログインなら Empty = NULL扱い）
        Guid? viewerId = _user.login_user_id == Guid.Empty ? null : _user.login_user_id;

        // リポジトリへ渡すエンティティを組み立て
        var entity = new TCountQueue
        {
            target_type = req.target_type,
            target_user_id = req.target_user_id,
            archive_id = req.archive_id,
            seq = req.seq,
            item_name = req.item_name,
            viewer_user_id = viewerId
        };

        await _repo.InsertQueueAsync(entity);
        return new Response(true);
    }

}