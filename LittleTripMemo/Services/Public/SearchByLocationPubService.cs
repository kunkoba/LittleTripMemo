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
        string? keyword,
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

        IEnumerable<TMemoDetailPub> details;

        if (req.sortField == 3 && req.reactionType.HasValue)
        {
            // リアクション順（RANK）
            details = await _detailPubRepo.GetByLocationRankAsync(
                req.lat_min, req.lat_max, req.lng_min, req.lng_max,
                req.keyword, req.reactionType.Value, _user.UserId, req.limit);
        }
        else
        {
            // 作成順 or 更新順（BASIC）
            details = await _detailPubRepo.GetByLocationBasicAsync(
                req.lat_min, req.lat_max, req.lng_min, req.lng_max,
                req.keyword, req.sortField, _user.UserId, req.limit);
        }

        SetAppFlags(details);
        return new Response(details);
    }

    private async Task ValidateAsync(SearchByLocationPubReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}