using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

/// <summary>
/// まとめ削除（解除）ユースケース
/// 1. 対象の明細の archive_id を 0 に戻す
/// 2. アーカイブ本体を削除（論理削除）する
/// </summary>
public class DeleteArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;

    public record DeleteArchiveReq(
        [Required(ErrorMessage = "アーカイブIDは必須です")] int archive_id
    );

    public record Response(bool is_success, string message);

    public DeleteArchiveService(
        UserContext userContext,
        ITransactionProvider provider,
        ArchiveRepository archiveRepo,
        DetailRepository detailRepo)
        : base(userContext)
    {
        _provider = provider;
        _archiveRepo = archiveRepo;
        _detailRepo = detailRepo;
    }

    public async Task<Response> ExecuteAsync(DeleteArchiveReq req)
    {
        // 1. 検証
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            // 2. 所有権チェック（他人のデータを消させない）
            var archive = await _archiveRepo.GetByKeyAsync(req.archive_id);
            BusinessException.ThrowIf(archive == null || archive.user_id != _user.UserId, "対象のデータが見つからないか、権限がありません。");

            // 3. 明細の解放（対象アーカイブIDを持つ明細の archive_id を 0 にする）
            await _detailRepo.ReleaseArchiveIdAsync(req.archive_id);

            // 4. アーカイブ本体の削除（論理削除を想定）
            await _archiveRepo.DeleteByKeyAsync(req.archive_id);

            tran.Commit();
            return new Response(true, "まとめを解除しました。");
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(DeleteArchiveReq req)
    {
        BusinessException.ThrowIf(_user.TableId == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id <= 0, "無効なアーカイブIDです");
        await Task.CompletedTask;
    }
}