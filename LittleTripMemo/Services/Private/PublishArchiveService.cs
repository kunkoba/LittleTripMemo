using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Repository.App;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

public class PublishArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ReactionPubRepository _reactionPubRepo;

    public record PublishArchiveReq(
        [Required] Guid login_user_id,
        int archive_id
    ) : ILoginUserRequest;

    public record Response(int archiveId);

    public PublishArchiveService(
        UserContext userContext,
        ITransactionProvider provider,
        ArchiveRepository archiveRepo,
        DetailRepository detailRepo,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo,
        ReactionPubRepository reactionPubRepo)
        : base(userContext)
    {
        _provider = provider;
        _archiveRepo = archiveRepo;
        _detailRepo = detailRepo;
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
        _reactionPubRepo = reactionPubRepo;
    }

    public async Task<Response> ExecuteAsync(PublishArchiveReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            var archive = await _archiveRepo.GetByKeyAsync(req.archive_id);
            BusinessException.ThrowIf(archive == null, "アーカイブが見つかりません");

            // 公開アーカイブを UPSERT (復活)
            var pubArchive = new TMemoArchivePub
            {
                archive_id = archive.archive_id,
                user_id = archive.user_id,
                title = archive.title,
                memo = archive.memo,
                link_url = archive.link_url,
                currency_unit = archive.currency_unit,
            };
            await _archivePubRepo.RestoreArchiveAsync(pubArchive);

            var details = await _detailRepo.GetByArchiveIdAsync(req.archive_id);

            // 公開明細を UPSERT (復活)
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
                await _detailPubRepo.RestoreDetailAsync(pubDetail);
            }

            // 過去のリアクションがあれば、論理削除状態から復活させる
            await _reactionPubRepo.RestoreLogicalByArchiveIdAsync(req.archive_id);

            // 秘密アーカイブ・明細を論理削除
            await _archiveRepo.DeleteLogicalByKeyAsync(req.archive_id);
            await _detailRepo.DeleteByArchiveIdAsync(req.archive_id);

            // 公開側の件数を反映させる
            await _archivePubRepo.UpdateDetailCountAsync(req.archive_id);

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
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}