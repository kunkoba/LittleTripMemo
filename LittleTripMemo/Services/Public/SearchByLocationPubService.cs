using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class SearchByLocationPubService : _BaseService
{
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ReactionPubRepository _reactionPubRepo;

    public record SearchByLocationPubReq(
        decimal lat_min,
        decimal lat_max,
        decimal lng_min,
        decimal lng_max,
        int sortField,      // 1:作成順, 2:更新順, 3:リアクション順
        int? reactionType,  // sort_fieldが3の場合に使用
        int limit = 50
    );
    public record Response(IEnumerable<TMemoDetailPub> details);

    public SearchByLocationPubService(
        UserContext userContext,
        DetailPubRepository detailPubRepo,
        ReactionPubRepository reactionPubRepo)
        : base(userContext)
    {
        _detailPubRepo = detailPubRepo;
        _reactionPubRepo = reactionPubRepo;
    }

    public async Task<Response> ExecuteAsync(SearchByLocationPubReq req)
    {
        await ValidateAsync(req);
        var details = await _detailPubRepo.GetByLocationAsync(
            req.lat_min, req.lat_max,
            req.lng_min, req.lng_max,
            req.sortField, req.reactionType, req.limit);

        SetAppFlags(details);
        return new Response(details);
    }

    private async Task ValidateAsync(SearchByLocationPubReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}