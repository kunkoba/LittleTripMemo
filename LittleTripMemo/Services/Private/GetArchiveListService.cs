using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class GetArchiveListService : _BaseService
{
    private readonly ArchiveRepository _archiveRepo;

    public class GetArchiveListReq { }
    public record Response(IEnumerable<TMemoArchive> archiveList);

    public GetArchiveListService(
        UserContext userContext,
        ArchiveRepository archiveRepo)
        : base(userContext)
    {
        _archiveRepo = archiveRepo;
    }

    public async Task<Response> ExecuteAsync(GetArchiveListReq req)
    {
        await ValidateAsync();
        var archives = await _archiveRepo.GetAllAsync();

        return new Response(archives);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}