using LittleTripMemo.DataAccess;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Common;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

/// <summary>
/// 明細登録（Historyの新規作成）ユースケース。
/// 全項目必須。リクエストからエンティティへマッピングしてリポジトリへ渡す。
/// </summary>
public class HistoryRegistrationService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly HistoryRepository _historyRepo;

    // --- 専用DTO：全項目必須のアノテーション ---
    public record HistoryRegistrationRequest(
        [Required(ErrorMessage = "旅の記録IDは必須です")] int archive_id,
        [Required(ErrorMessage = "緯度は必須です")] decimal latitude,
        [Required(ErrorMessage = "経度は必須です")] decimal longitude,
        [Required(ErrorMessage = "タイトルは必須です")][StringLength(100)] string title,
        [Required(ErrorMessage = "本文は必須です")] string body,
        [Required(ErrorMessage = "日付は必須です")] string memo_date,
        [Required(ErrorMessage = "時間は必須です")] string memo_time,
        [Required(ErrorMessage = "表情IDは必須です")] string face_emoji,
        [Required(ErrorMessage = "天気IDは必須です")] string weather_emoji,
        [Required(ErrorMessage = "URLは必須です")][Url] string link_url,
        [Required(ErrorMessage = "金額は必須です")][Range(0, int.MaxValue)] int memo_price
    );

    public record Response(int seq);

    public HistoryRegistrationService(UserContext userContext, ITransactionProvider provider, HistoryRepository repository)
        : base(userContext)
    {
        _provider = provider;
        _historyRepo = repository;
    }

    /// <summary>
    /// 実行（1.検証 → 2.マッピング → 3.実行 の順に整理）
    /// </summary>
    public async Task<Response> ExecuteAsync(HistoryRegistrationRequest req)
    {
        // 1. 検証
        await ValidateAsync(req);

        // 2. マッピング
        var entity = MapToEntity(req);

        // 3. 実行
        using var tran = _provider.BeginTransaction();
        try
        {
            var newSeq = await _historyRepo.InsertAsync(entity);

            tran.Commit();
            return new Response(newSeq);
        }
        catch
        {
            throw;
        }
    }

    /// <summary>
    /// 1. 検証（業務チェック用）
    /// </summary>
    private async Task ValidateAsync(HistoryRegistrationRequest req)
    {
        // ユーザIDのチェック（基本）
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です（ログイン異常？）");

        await Task.CompletedTask;
    }

    /// <summary>
    /// 2. マッピング（Entityへの詰め替え）
    /// </summary>
    private TMemoDetail MapToEntity(HistoryRegistrationRequest req)
    {
        return new TMemoDetail
        {
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

