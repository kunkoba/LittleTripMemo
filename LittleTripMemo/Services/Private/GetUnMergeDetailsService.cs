using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

/// <summary>
/// 未まとめ明細一覧取得ユースケース。
/// archive_id = 0 の明細を全件返す。
/// </summary>
public class GetUnMergeDetailsService : _BaseService
{
    private readonly DetailRepository _detailRepo;

    //public record Request();
    public class GetUnMergeDetailsReq { }

    public record Response(IEnumerable<TMemoDetail> details);

    public GetUnMergeDetailsService(
        UserContext userContext,
        DetailRepository detailRepo)
        : base(userContext)
    {
        _detailRepo = detailRepo;
    }

    /// <summary>
    /// 実行
    /// </summary>
    public async Task<Response> ExecuteAsync(GetUnMergeDetailsReq req)
    {
        // 1. 検証
        await ValidateAsync();

        // 2. 取得
        var details = await _detailRepo.GetUnMergedAsync();
        //SetAppFlags(details);

        return new Response(details);
    }

    /// <summary>
    /// 検証
    /// </summary>
    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}