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
        [Required(ErrorMessage = "天気IDは必須です")] string weather_emoji,
        string? link_url,
        [Required(ErrorMessage = "金額は必須です")] int memo_price,
        [Required] bool is_public // 振替判定用
    );

    public record BulkSyncReq(
        [Required(ErrorMessage = "同期データリストは必須です")] IEnumerable<BulkSyncItem> items
    );

    public record Response(int updatedCount);

    public BulkSyncDetailsService(
        UserContext userContext,
        ITransactionProvider provider,
        DetailRepository detailRepo,
        DetailPubRepository detailPubRepo)
        : base(userContext)
    {
        _provider = provider;
        _detailRepo = detailRepo;
        _detailPubRepo = detailPubRepo;
    }

    public async Task<Response> ExecuteAsync(BulkSyncReq req)
    {
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            int count = 0;
            foreach (var item in req.items)
            {
                if (item.is_public)
                {
                    var entity = MapToPubEntity(item);
                    if (item.seq == 0) await _detailPubRepo.InsertAsync(entity);
                    else await _detailPubRepo.UpdateByKeyAsync(entity);
                }
                else
                {
                    var entity = MapToPrivateEntity(item);
                    if (item.seq == 0) await _detailRepo.InsertAsync(entity);
                    else await _detailRepo.UpdateByKeyAsync(entity);
                }
                count++;
            }

            tran.Commit();
            return new Response(count);
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
        weather_emoji = item.weather_emoji,
        link_url = item.link_url,
        memo_price = item.memo_price,
        del_flg = false
    };

    private TMemoDetailPub MapToPubEntity(BulkSyncItem item) => new()
    {
        archive_id = item.archive_id,
        seq = item.seq,
        user_id = _user.UserId,
        latitude = item.latitude,
        longitude = item.longitude,
        title = item.title,
        body = item.body,
        memo_date = item.memo_date,
        memo_time = item.memo_time,
        face_emoji = item.face_emoji,
        weather_emoji = item.weather_emoji,
        link_url = item.link_url,
        memo_price = item.memo_price,
        closed_flg = false,
        del_flg = false
    };
}