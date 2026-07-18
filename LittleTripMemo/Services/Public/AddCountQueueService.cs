using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.App;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Public;

/// <summary>
/// 閲覧数やクリック数を集計キューに登録するサービス
/// </summary>
public class AddCountQueueService : _BaseService
{
    private readonly CountQueueRepository _repo;

public record AddCountReq(
    [Required] Guid login_user_id,
    CountTargetType target_type,
    Guid target_user_id,
    int? archive_id,
    long? seq,
    string item_name
) : ILoginUserRequest;

    public record Response(bool is_success);

    public AddCountQueueService(UserContext u, CountQueueRepository r) : base(u)
    {
        _repo = r;
    }

    public async Task<Response> ExecuteAsync(AddCountReq req)
    {
        // 1. バリデーション
        await ValidateAsync(req);

        // 2. ビューアーIDの決定（未ログイン時はNULL）
        Guid? viewerId = _user.login_user_id == Guid.Empty ? null : _user.login_user_id;

        // 3. キューへ保存
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

    private async Task ValidateAsync(AddCountReq req)
    {
        BusinessException.ThrowIf(string.IsNullOrEmpty(req.item_name), "集計項目名が指定されていません");
        await Task.CompletedTask;
    }

}