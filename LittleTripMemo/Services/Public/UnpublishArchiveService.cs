using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;
using System.ComponentModel.DataAnnotations;

public class UnpublishArchiveService : _BaseService
{
    private readonly ITransactionProvider _provider;
    private readonly ArchivePubRepository _archivePubRepo;
    private readonly DetailPubRepository _detailPubRepo;
    private readonly ReactionPubRepository _reactionPubRepo;
    private readonly SysReportRepository _reportRepo;
    private readonly ArchiveRepository _archiveRepo;
    private readonly DetailRepository _detailRepo;

    public record UnpublishArchiveReq(
        [Required] Guid login_user_id,
        int archive_id
    ) : ILoginUserRequest;

    public record Response(int archiveId);

    public UnpublishArchiveService(
        UserContext userContext,
        ITransactionProvider provider,
        ArchivePubRepository archivePubRepo,
        DetailPubRepository detailPubRepo,
        ReactionPubRepository reactionPubRepo, 
        SysReportRepository reportRepo,       
        DetailRepository detailRepo,
        ArchiveRepository archiveRepo)
        : base(userContext)
    {
        _provider = provider;
        _archivePubRepo = archivePubRepo;
        _detailPubRepo = detailPubRepo;
        _reactionPubRepo = reactionPubRepo; 
        _reportRepo = reportRepo;           
        _archiveRepo = archiveRepo;
        _detailRepo = detailRepo;
    }

    public async Task<Response> ExecuteAsync(UnpublishArchiveReq req)
    {
        await ValidateAsync(req);

        // トランザクション開始
        using var tran = _provider.BeginTransaction();
        try
        {
            // 0. 所有権の確認（念のため、公開親からデータを取得してチェック）
            // ※既存の各Repositoryメソッドが内部で _user.UserId をチェックしているため安全ですが、
            //   リアクションと通報は全ユーザー分を消すため、ここで親の存在を確定させます。
            var archive = await _archivePubRepo.GetByKeyAsync(req.archive_id);
            BusinessException.ThrowIf(archive == null || archive.user_id != _user.user_id, "対象のアーカイブが見つからないか、権限がありません。");

            // ① 公開明細を物理削除（自分の分）
            await _detailPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
            // ② 公開アーカイブを物理削除（自分の分）
            await _archivePubRepo.DeletePhysicalByKeyAsync(req.archive_id);

            // ③ ★追加：リアクションを全削除（その記事に対する全ユーザーの反応を消す）
            await _reactionPubRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);
            // ④ ★追加：通報データを全削除（その記事に対する全通報を消す）
            await _reportRepo.DeletePhysicalByArchiveIdAsync(req.archive_id);

            // ⑤ 秘密アーカイブの論理削除を戻す
            await _archiveRepo.RestoreByKeyAsync(req.archive_id);
            // ⑥ 明細の論理削除を戻す
            await _detailRepo.RestoreByKeyAsync(req.archive_id);

            tran.Commit();
            return new Response(req.archive_id);
        }
        catch
        {
            throw;
        }
    }

    private async Task ValidateAsync(UnpublishArchiveReq req)
    {
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(_user.user_id == Guid.Empty, "ユーザーIDが無効です");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}