
using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Repository.App;
using LittleTripMemo.Services;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

/// <summary>
/// 秘密データを公開側へコピー（公開）するサービス。
/// 公開後も秘密データは削除せず、独立して保持する。
/// </summary>
public class PublishArchiveService(
UserContext userContext,
ITransactionProvider provider,
ArchiveRepository archiveRepo,
DetailRepository detailRepo,
ArchivePubRepository archivePubRepo,
DetailPubRepository detailPubRepo,
ReactionPubRepository reactionPubRepo
) : _BaseService(userContext)
{
    public record PublishArchiveReq(
    [Required] Guid login_user_id,
    [Required] int archive_id,
    bool reset_flg // trueの場合、既存の公開統計等をリセットして新規作成
    ) : ILoginUserRequest;

public record Response(int archiveId);

    /// <summary>
    /// 公開処理を実行する
    /// </summary>
    public async Task<Response> ExecuteAsync(PublishArchiveReq req)
    {
        // 1. バリデーション
        await ValidateAsync(req);

        using var tran = provider.BeginTransaction();
        try
        {
            // 2. 秘密アーカイブ（元データ）の取得
            var archive = await archiveRepo.GetByKeyAsync(req.archive_id);
            BusinessException.ThrowIf(archive == null, "対象のアーカイブが見つかりません。");

            // 3. リセットフラグが真なら、既存の公開情報を物理削除
            if (req.reset_flg)
            {
                await detailPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
                await archivePubRepo.DeletePhysicalByKeyAsync(req.archive_id);
                await reactionPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
            }

            // 4. 公開アーカイブの登録・復活
            var pubArchive = new TMemoArchivePub
            {
                archive_id = archive.archive_id,
                user_id = archive.user_id,
                title = archive.title,
                memo = archive.memo,
                link_url = archive.link_url,
                currency_unit = archive.currency_unit,
            };
            await archivePubRepo.RestoreArchiveAsync(pubArchive);

            // 5. 公開明細の登録・復活
            var details = await detailRepo.GetByArchiveIdAsync(req.archive_id);
            foreach (var detail in details)
            {
                var pubDetail = new TMemoDetailPub
                {
                    archive_id = detail.archive_id,
                    seq = detail.seq,
                    user_id = detail.user_id,
                    latitude = detail.latitude,
                    longitude = detail.longitude,
                    title = detail.title,
                    body = detail.body,
                    memo_date = detail.memo_date,
                    memo_time = detail.memo_time,
                    face_emoji = detail.face_emoji,
                    weather_code = detail.weather_code,
                    link_url = detail.link_url,
                    memo_price = detail.memo_price,
                    feel_type = detail.feel_type
                };
                await detailPubRepo.RestoreDetailAsync(pubDetail);
            }

            // 6. リアクションの論理削除を解除（以前のデータがある場合）
            await reactionPubRepo.RestoreLogicalByArchiveIdAsync(req.archive_id);

            // 7. 公開側の明細件数を同期
            await archivePubRepo.UpdateDetailCountAsync(req.archive_id);

            tran.Commit();
            return new Response(archive.archive_id);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(PublishArchiveReq req)
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(req.archive_id <= 0, "無効なアーカイブIDです");
        await Task.CompletedTask;
    }

}