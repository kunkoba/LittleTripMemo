using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class SearchByLocationService : _BaseService
{
    private readonly DetailRepository _detailRepo;

    public record SearchByLocationReq(
        decimal lat_min,
        decimal lat_max,
        decimal lng_min,
        decimal lng_max,
        int limit = 50
    );
    public record Response(IEnumerable<TMemoDetail> details);

    public SearchByLocationService(
        UserContext userContext,
        DetailRepository detailRepo)
        : base(userContext)
    {
        _detailRepo = detailRepo;
    }

    public async Task<Response> ExecuteAsync(SearchByLocationReq req)
    {
        await ValidateAsync(req);
        var details = await _detailRepo.GetByLocationAsync(
            req.lat_min, req.lat_max,
            req.lng_min, req.lng_max,
            req.limit);
        return new Response(details);
    }

    private async Task ValidateAsync(SearchByLocationReq req)
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}