using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class SearchByLocationPubService : _BaseService
{
    private readonly DetailPubRepository _detailPubRepo;

    public record SearchByLocationPubReq(
        decimal lat_min, decimal lat_max,
        decimal lng_min, decimal lng_max,
        int sortField,     // 1:作成順, 2:更新順, 3:リアクション順
        int? reactionType,  // 1:funny, 2:love, 3:surprise, 4:sad (sortField=3の時使用)
        string? keyword,
        int limit = 20
    );
    public record Response(IEnumerable<TMemoDetailPub> details);

    public SearchByLocationPubService(
        UserContext userContext,
        DetailPubRepository detailPubRepo)
        : base(userContext)
    {
        _detailPubRepo = detailPubRepo;
    }

    public async Task<Response> ExecuteAsync(SearchByLocationPubReq req)
    {
        await ValidateAsync(req);

        var result = await _detailPubRepo.SearchByLocationAsync(
            req.lat_min, req.lat_max, req.lng_min, req.lng_max,
            req.keyword,
            req.sortField,
            req.reactionType,
            _user.login_user_id,
            req.limit
        );

        // 所有者フラグなどをセット
        SetAppFlags(result);

        return new Response(result);
    }

    private async Task ValidateAsync(SearchByLocationPubReq req)
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}