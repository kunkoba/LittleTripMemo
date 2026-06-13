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
        string? keyword,
        int sort_type = 1 // 1:新着, 2:更新, 3~6:リアクション別
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

        // 統合された検索メソッドを呼び出す
        var result = await _detailPubRepo.SearchByLocationAsync(
            req.lat_min, req.lat_max, req.lng_min, req.lng_max,
            req.keyword, req.sort_type, _user.UserId
        );

        // 所有者フラグなどをセット
        SetAppFlags(result);

        return new Response(result);
    }

    private async Task ValidateAsync(SearchByLocationPubReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}