
using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Services;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

/// <summary>
/// ユーザーの秘密まとめと公開まとめを両方取得し、それぞれの公開状態を判定して返すサービス
/// </summary>
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

/// <summary>
/// まとめ一覧取得処理を実行する
/// </summary>
public async Task<Response> ExecuteAsync()
    {
        // 1. バリデーション
        await ValidateAsync();

        // 2. 秘密・公開両方のデータを取得
        var archives = await archiveRepo.GetAllAsync();
        var archivesPub = await archivePubRepo.GetAllAsync();

        SetAppFlags(archives);
        SetAppFlags(archivesPub);

        // 公開側の状態をIDをキーにして文字列化（ToString）して保持
        var pubStatusMap = archivesPub.ToDictionary(
            x => x.archive_id,
            x => (x.del_flg ? PublicStatus.Delete : (x.closed_flg ? PublicStatus.Close : PublicStatus.Open)).ToString()
        );

        // 3. 秘密側リストの整形（公開側の生存状態を付与）
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
            is_public = false,
            is_owner = x.is_owner,
            detail_count = x.detail_count,
            // 公開側テーブルの状態を文字列で設定
            has_public_status = pubStatusMap.GetValueOrDefault(x.archive_id, PublicStatus.Nothing.ToString())
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
            is_public = true,
            is_owner = x.is_owner,
            detail_count = x.detail_count,
            has_public_status = (x.del_flg ? PublicStatus.Delete : (x.closed_flg ? PublicStatus.Close : PublicStatus.Open)).ToString()
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
