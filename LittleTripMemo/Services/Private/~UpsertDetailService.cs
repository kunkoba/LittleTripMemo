using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

/// <summary>
/// 明細の登録・更新ユースケース。
/// seq=0 で INSERT、seq>0 で UPDATE。
/// </summary>
public class UpsertDetailService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly DetailRepository _detailRepo;

    // --- 専用DTO：全項目必須のアノテーション ---
    public record UpsertDetailReq(
        [Required] Guid login_user_id,
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
        [Required(ErrorMessage = "金額は必須です")] int memo_price
    ) : ILoginUserRequest;

    public record Response(int updated_count);

    public UpsertDetailService(
        UserContext userContext,
        ITransactionProvider provider,
        DetailRepository detailRepo)
        : base(userContext)
    {
        _provider = provider;
        _detailRepo = detailRepo;
    }

    /// <summary>
    /// 実行（1.検証 → 2.マッピング → 3.実行 の順に整理）
    /// </summary>
    public async Task<Response> ExecuteAsync(UpsertDetailReq req)
    {
        await ValidateAsync(req);
        var entity = MapToEntity(req);
        int affected = 0;
        int seq = req.seq;

        if (req.seq == 0)
        {
            seq = await _detailRepo.InsertAsync(entity);
            affected = (seq > 0) ? 1 : 0;
        }
        else
        {
            affected = await _detailRepo.UpdateByKeyAsync(entity);
        }
        return new Response(affected);
    }

    /// <summary>
    /// 1. 検証（業務チェック用）
    /// </summary>
    private async Task ValidateAsync(UpsertDetailReq req)
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        await Task.CompletedTask;
    }

    /// <summary>
    /// 2. マッピング（Entityへの詰め替え）
    /// </summary>
    private TMemoDetail MapToEntity(UpsertDetailReq req)
    {
        return new TMemoDetail
        {
            seq = req.seq,
            archive_id = req.archive_id,
            latitude = req.latitude,
            longitude = req.longitude,
            title = req.title,
            body = req.body,
            memo_date = req.memo_date,
            memo_time = req.memo_time,
            face_emoji = req.face_emoji,
            weather_code = req.weather_code,
            link_url = req.link_url,
            memo_price = req.memo_price,
            del_flg = false
        };
    }
}