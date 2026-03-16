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
        [Required(ErrorMessage = "金額は必須です")] int memo_price
    );

    public record Response(int seq);

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
        // 1. 検証
        await ValidateAsync(req);

        // 2. マッピング
        var entity = MapToEntity(req);

        // 3. 実行
        using var tran = _provider.BeginTransaction();
        try
        {
            int seq;

            if (req.seq == 0)
            {
                // 新規登録：採番されたseqを返す
                seq = await _detailRepo.InsertAsync(entity);
            }
            else
            {
                // 更新：リクエストのseqをそのまま返す
                await _detailRepo.UpdateByKeyAsync(entity);
                seq = req.seq;
            }

            tran.Commit();
            return new Response(seq);
        }
        catch
        {
            throw;
        }
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
            weather_emoji = req.weather_emoji,
            link_url = req.link_url,
            memo_price = req.memo_price,
            del_flg = false
        };
    }
}