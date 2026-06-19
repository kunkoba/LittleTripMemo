using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Repository.App;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

/// <summary>
/// 公開済みデータを完全に消去し、秘密側の最新状態で作り直すサービス
/// </summary>
public class RecreatePublicArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ReactionPubRepository _reactionPubRepo;

    public record RecreatePublicArchiveReq(
        [Required] Guid login_user_id,
        int archive_id
    ) : ILoginUserRequest;

    public record Response(int archiveId);

    public RecreatePublicArchiveService(
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

    public async Task<Response> ExecuteAsync(RecreatePublicArchiveReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            // 1. 秘密アーカイブ取得（マスターデータ）
            // ※公開済み（del_flg=true）のものを取得するため、専用の取得かフラグ無視の取得が必要
            var archive = await _archiveRepo.GetByKeyWithDeletedAsync(req.archive_id);
            BusinessException.ThrowIf(archive == null, "元データが見つかりません");

            // 2. 既存の公開データを「物理削除」してリセット
            await _detailPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
            await _archivePubRepo.DeletePhysicalByKeyAsync(req.archive_id);

            // 3. リアクションもリセット（古い構成のデータのため）
            await _reactionPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);

            // 4. 公開アーカイブへ新規コピー（UpsertFromPrivateAsync を使用）
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

            // 5. 秘密明細取得（del_flg=true のものも含めて取得）
            var details = await _detailRepo.GetByArchiveIdWithDeletedAsync(req.archive_id);

            // 6. 公開明細へ新規コピー
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
                };
                await _detailPubRepo.RestoreDetailAsync(pubDetail);
            }

            // 7. 公開側の件数を最新にする
            await _archivePubRepo.UpdateDetailCountAsync(req.archive_id);

            tran.Commit();
            return new Response(archive.archive_id);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(RecreatePublicArchiveReq req)
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }

}