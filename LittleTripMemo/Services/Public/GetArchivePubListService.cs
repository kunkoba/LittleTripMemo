using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class GetArchivePubListService : _BaseService
{
    private readonly ArchivePubRepository _archivePubRepo;

    public class GetArchivePubListReq { }
    public record Response(IEnumerable<TMemoArchivePub> archivePubList);

    public GetArchivePubListService(
        UserContext userContext,
        ArchivePubRepository archivePubRepo)
        : base(userContext)
    {
        _archivePubRepo = archivePubRepo;
    }

    public async Task<Response> ExecuteAsync()
    {
        await ValidateAsync();
        var archives = await _archivePubRepo.GetAllAsync();

        return new Response(archives);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}