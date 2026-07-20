using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository.App;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

public class GetArchiveListService(
    UserContext userContext,
    ArchiveRepository archiveRepo,
    ArchivePubRepository archivePubRepo
) : _BaseService(userContext)
{
    public record GetArchiveListReq(
        [Required] Guid login_user_id
    ) : ILoginUserRequest;

    public record Response(IEnumerable<DtoArchive> archiveList);

    public async Task<Response> ExecuteAsync()
    {
        await ValidateAsync();

        // 2. 秘密・公開両方のデータを取得（元のロジックを維持）
        var archives = await archiveRepo.GetAllAsync();
        var archivesPub = await archivePubRepo.GetAllAsync();

        SetAppFlags(archives);
        SetAppFlags(archivesPub);

        // 3. 秘密側リストの整形（★has_public_status の判定処理を削除）
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
            is_public = false, // 秘密側
            is_owner = x.is_owner,
            detail_count = x.detail_count,
            has_public_status = string.Empty
        });

        // 4. 公開側リストの整形
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
            is_public = true, // 公開側
            is_owner = x.is_owner,
            detail_count = x.detail_count,
            has_public_status = string.Empty
        });

        // 全件結合して更新日順に返却
        return new Response(list1.Concat(list2).OrderByDescending(x => x.update_tim).ToList());
    }

    private async Task ValidateAsync()
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ログインが必要です");
        await Task.CompletedTask;
    }

}