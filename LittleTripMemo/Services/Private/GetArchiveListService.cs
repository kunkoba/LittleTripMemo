using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class GetArchiveListService : _BaseService
{
    private readonly ArchiveRepository _archiveRepo;
    private readonly ArchivePubRepository _archivePubRepo;

    public class GetArchiveListReq { }
    public record Response(IEnumerable<DtoArchive> archiveList);

    public GetArchiveListService(
        UserContext userContext,
        ArchiveRepository archiveRepo,
        ArchivePubRepository archivePubRepo)
        : base(userContext)
    {
        _archiveRepo = archiveRepo;
        _archivePubRepo = archivePubRepo;
    }

    public async Task<Response> ExecuteAsync()
    {
        await ValidateAsync();
        var archives = await _archiveRepo.GetAllAsync();
        var archivesPub = await _archivePubRepo.GetAllAsync();
        SetAppFlags(archives);
        SetAppFlags(archivesPub);

        // 共通DTOへ変換
        var list1 = archives.Select(x => new DtoArchive
        {
            archive_id = x.archive_id,
            user_id = x.user_id,
            title = x.title,
            memo = x.memo,
            link_url = x.link_url,
            currency_unit = x.currency_unit,
            closed_flg = x.closed_flg,
            del_flg = x.del_flg,
            create_tim = x.create_tim,
            update_tim = x.update_tim,
            is_public = x.is_public,
            is_owner = x.is_owner,
            cnt = x.cnt,
        });

        var list2 = archivesPub.Select(x => new DtoArchive
        {
            archive_id = x.archive_id,
            user_id = x.user_id,
            title = x.title,
            memo = x.memo,
            link_url = x.link_url,
            currency_unit = x.currency_unit,
            closed_flg = x.closed_flg,
            del_flg = x.del_flg,
            create_tim = x.create_tim,
            update_tim = x.update_tim,
            is_public = x.is_public,
            is_owner = x.is_owner,
            cnt = x.cnt,
        });

        // 結合
        var merged = list1.Concat(list2).ToList();
        return new Response(merged);
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }
}