using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

public class PublishArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;

    public record PublishArchiveReq(int archive_id);
    public record Response(int archiveId);

    public PublishArchiveService(
        UserContext userContext,
        ITransactionProvider provider,
        ArchiveRepository archiveRepo,
        DetailRepository detailRepo,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo)
        : base(userContext)
    {
        _provider = provider;
        _archiveRepo = archiveRepo;
        _detailRepo = detailRepo;
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
    }

    public async Task<Response> ExecuteAsync(PublishArchiveReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            // ① 秘密アーカイブ取得
            var archive = await _archiveRepo.GetByKeyAsync(req.archive_id);
            BusinessException.ThrowIf(archive == null, "アーカイブが見つかりません");

            // ② 既存の公開データがあれば物理削除
            var existingPub = await _archivePubRepo.GetByKeyAsync(req.archive_id);
            if (existingPub != null)
            {
                await _archivePubRepo.DeletePhysicalByKeyAsync(req.archive_id);
                await _detailPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
            }

            // ③ 公開アーカイブへコピー
            var pubArchive = new TMemoArchivePub
            {
                archive_id = archive.archive_id,
                user_id = archive.user_id,
                title = archive.title,
                memo = archive.memo,
                link_url = archive.link_url,
            };
            await _archivePubRepo.InsertAsync(pubArchive);

            // ④ 秘密明細取得
            var details = await _detailRepo.GetByArchiveIdAsync(req.archive_id);

            // ⑤ 公開明細へコピー
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
                    weather_emoji = detail.weather_emoji,
                    link_url = detail.link_url,
                    memo_price = detail.memo_price,
                    closed_flg = false,     // 初期値はfalse
                };
                await _detailPubRepo.InsertAsync(pubDetail);
            }

            // ⑥ 秘密アーカイブを論理削除
            await _archiveRepo.DeleteByKeyAsync(req.archive_id);

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
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}