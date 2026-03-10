using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Common;
using System.ComponentModel.DataAnnotations;
using LittleTripMemo.Repository;

namespace LittleTripMemo.Services;

/// <summary>
/// 旅の記録更新ユースケース。
/// テンプレ通り、バリデーション・トランザクション・マッピングを分離。
/// </summary>
public class ArchiveUpdateService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchiveRepository _archiveRepo;

    // --- 専用DTO：全項目必須 ---
    public record ArchiveUpdateRequest(
        [Required(ErrorMessage = "IDは必須です")] int archive_id,
        [Required(ErrorMessage = "タイトルは必須です")][StringLength(100)] string title,
        [Required(ErrorMessage = "メモは必須です")][StringLength(1000)] string memo,
        [Required(ErrorMessage = "URLは必須です")][Url] string link_url
    );

    // レスポンス
    public record Response(bool is_success, string message);

    // コンストラクタ
    public ArchiveUpdateService(UserContext userContext, ITransactionProvider provider, ArchiveRepository archiveRepo)
        : base(userContext)
    {
        _provider = provider;
        _archiveRepo = archiveRepo;
    }

    /// <summary>
    /// 実行。
    /// </summary>
    public async Task<Response> ExecuteAsync(ArchiveUpdateRequest req)
    {
        // 1. Validate（業務チェック）
        // 違反時は BusinessException を throw し、ミドルウェアで400エラーへ
        await ValidateAsync(req);

        // 2. Mapping
        var entity = MapToEntity(req);

        // 3. Execute（DB操作）
        using var tran = _provider.BeginTransaction();
        try
        {
            int affected = await _archiveRepo.UpdateByKeyAsync(entity);
            if (affected == 0) return new Response(false, "対象が見つかりません。");

            tran.Commit();
            return new Response(true, "更新に成功しました。");
        }
        catch
        {
            // リポジトリ内の _logger で詳細が記録され、ミドルウェアで500エラーへ
            throw;
        }
    }

    /// <summary>
    /// 1、検証
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    private async Task ValidateAsync(ArchiveUpdateRequest req)
    {
        // ユーザIDのチェック（基本）
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です（ログイン異常？）");

        await Task.CompletedTask;
    }

    /// <summary>
    /// 2、マッピング
    /// </summary>
    private TMemoArchive MapToEntity(ArchiveUpdateRequest req)
    {
        return new TMemoArchive
        {
            archive_id = req.archive_id,
            title = req.title,
            memo = req.memo,
            link_url = req.link_url
        };
    }
}

