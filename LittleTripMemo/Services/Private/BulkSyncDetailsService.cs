using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

public class BulkSyncDetailsService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly DetailRepository _detailRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ArchiveRepository _archiveRepo;
    private readonly ArchivePubRepository _archivePubRepo;

    // --- 既存の UpdateDetailPubReq 等と完全に同一の形式に is_public を追加 ---
    public record BulkSyncItem(
        [Required(ErrorMessage = "seqは必須です")][Range(0, int.MaxValue)] int seq,
        [Required(ErrorMessage = "旅の記録IDは必須です")] int archive_id,
        [Required(ErrorMessage = "緯度は必須です")] decimal latitude,
        [Required(ErrorMessage = "経度は必須です")] decimal longitude,
        [Required(ErrorMessage = "タイトルは必須です")][StringLength(100)] string title,
        [Required(ErrorMessage = "本文は必須です")] string body,
        [Required(ErrorMessage = "日付は必須です")] string memo_date,
        [Required(ErrorMessage = "時間は必須です")] string memo_time,
        [Required(ErrorMessage = "表情IDは必須です")] string face_emoji,
        [Required(ErrorMessage = "天気IDは必須です")] string weather_code,
        string? link_url,
        [Required(ErrorMessage = "金額は必須です")] int memo_price,
        [Required] bool is_public,
        [Required] bool is_close = false
    );

    public record BulkSyncReq(
        [Required] Guid login_user_id,
        [Required(ErrorMessage = "同期データリストは必須です")] IEnumerable<BulkSyncItem> items
    ) : ILoginUserRequest;

    public record Response(int updatedCount);

    public BulkSyncDetailsService(
        UserContext userContext,
        ITransactionProvider provider,
        DetailRepository detailRepo,
        DetailPubRepository detailPubRepo,
        ArchiveRepository archiveRepository,
        ArchivePubRepository archivePubRepository
    ) : base(userContext)
    {
        _provider = provider;
        _detailRepo = detailRepo;
        _detailPubRepo = detailPubRepo;
        _archiveRepo = archiveRepository;
        _archivePubRepo = archivePubRepository;
    }

    public async Task<Response> ExecuteAsync(BulkSyncReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            int totalUpdated = 0;
            foreach (var item in req.items)
            {
                int affected = 0;
                if (item.is_public)
                {
                    var entity = MapToPubEntity(item);
                    if (item.seq == 0) affected = await _detailPubRepo.InsertAsync(entity);
                    // 更新時は archive_id と del_flg の一致を条件にする
                    else affected = await _detailPubRepo.UpdateByKeyAsync(entity);
                }
                else
                {
                    var entity = MapToPrivateEntity(item);
                    if (item.seq == 0) affected = await _detailRepo.InsertAsync(entity);
                    // 更新時は archive_id と del_flg の一致を条件にする
                    else affected = await _detailRepo.UpdateByKeyAsync(entity);
                }
                totalUpdated += affected; // 実際にDBで更新できた件数のみを加算
            }

            // 1. 非公開データとして同期されたアーカイブIDを抽出（is_public = false）
            var privateAffectedIds = req.items
                .Where(x => !x.is_public && x.archive_id > 0)
                .Select(x => x.archive_id)
                .Distinct();

            foreach (var archiveId in privateAffectedIds)
            {
                // 秘密テーブル(t_memo_archive)のカウントを更新
                await _archiveRepo.UpdateDetailCountAsync(archiveId);
            }

            // 2. 公開データとして同期されたアーカイブIDを抽出（is_public = true）
            var publicAffectedIds = req.items
                .Where(x => x.is_public && x.archive_id > 0)
                .Select(x => x.archive_id)
                .Distinct();

            foreach (var archiveId in publicAffectedIds)
            {
                // 公開テーブル(t_memo_archive_pub)のカウントを更新
                await _archivePubRepo.UpdateDetailCountAsync(archiveId);
            }

            tran.Commit();
            // 10件送って、DBの状態不一致で1件も更新されなければ 0 が返る
            return new Response(totalUpdated);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(BulkSyncReq req)
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.items == null || !req.items.Any(), "同期するデータがありません");
        await Task.CompletedTask;
    }

    private TMemoDetail MapToPrivateEntity(BulkSyncItem item) => new()
    {
        seq = item.seq,
        archive_id = item.archive_id,
        user_id = _user.UserId,
        latitude = item.latitude,
        longitude = item.longitude,
        title = item.title,
        body = item.body,
        memo_date = item.memo_date,
        memo_time = item.memo_time,
        face_emoji = item.face_emoji,
        weather_code = item.weather_code,
        link_url = item.link_url,
        memo_price = item.memo_price,
        del_flg = false
    };

    private TMemoDetailPub MapToPubEntity(BulkSyncItem item) => new()
    {
        seq = item.seq,
        archive_id = item.archive_id,
        user_id = _user.UserId,
        latitude = item.latitude,
        longitude = item.longitude,
        title = item.title,
        body = item.body,
        memo_date = item.memo_date,
        memo_time = item.memo_time,
        face_emoji = item.face_emoji,
        weather_code = item.weather_code,
        link_url = item.link_url,
        memo_price = item.memo_price,
        //closed_flg = false,
        del_flg = false
    };
}