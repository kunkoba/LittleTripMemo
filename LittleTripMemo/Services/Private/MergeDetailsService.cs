using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Repository.App;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services.Private;

/// <summary>
/// 複数の未まとめ明細を統合し、新しいアーカイブ（まとめ）を作成するサービス
/// </summary>
public class MergeDetailsService(
    UserContext userContext,
    ITransactionProvider transactionProvider,
    ArchiveRepository archiveRepository,
    DetailRepository detailRepository
) : _BaseService(userContext)
{
    /// <summary>
    /// まとめ作成リクエストモデル
    /// </summary>
    /// <param name="login_user_id">操作ユーザーID</param>
    /// <param name="seqs">統合対象とする明細のシーケンス番号リスト</param>
    /// <param name="title">まとめのタイトル（未指定の場合はサーバー側で自動生成）</param>
    public record MergeDetailsReq(
        [Required] Guid login_user_id,
        [Required(ErrorMessage = "対象の明細が選択されていません")] int[] seqs,
        string? title
    ) : ILoginUserRequest;

    public record Response(int archive_id, int updated_count);

    /// <summary>
    /// 明細の統合処理を実行する
    /// </summary>
    public async Task<Response> ExecuteAsync(MergeDetailsReq req)
    {
        // 1. バリデーション
        await ValidateAsync(req);

        // 2. タイトルの決定（未入力なら現在日時を含めた名称を自動生成）
        var archiveTitle = string.IsNullOrWhiteSpace(req.title)
            ? $"旅のまとめのタイトル_{DateTime.Now:_HHmm}"
            : req.title;

        // 3. 実行（アーカイブ作成と明細更新を同一トランザクションで実行）
        using var transaction = transactionProvider.BeginTransaction();
        try
        {
            // ① アーカイブ（親）を新規登録
            var archiveId = await archiveRepository.InsertAsync(new TMemoArchive
            {
                title = archiveTitle,
                memo = "旅の思い出についての情報を書き込みましょう。",
                link_url = string.Empty
            });

            // ② 指定された明細（子）に作成したアーカイブIDをセットして紐付ける
            var updatedCount = await detailRepository.UpdateArchiveIdBySeqsAsync(archiveId, req.seqs);

            // ③ アーカイブ側の明細件数カウントを最新状態に更新
            await archiveRepository.UpdateDetailCountAsync(archiveId);

            transaction.Commit();

            return new Response(archiveId, updatedCount);
        }
        catch
        {
            // ロールバックは provider の Dispose で自動実行される
            throw;
        }
    }

    /// <summary>
    /// 業務バリデーション
    /// </summary>
    private async Task ValidateAsync(MergeDetailsReq req)
    {
        BusinessException.ThrowIf(_user.login_user_id == Guid.Empty, "ログインが必要です");
        BusinessException.ThrowIf(_user.table_id == 0, "テーブルIDが無効です");
        BusinessException.ThrowIf(req.seqs == null || req.seqs.Length == 0, "統合する明細が選択されていません");

        await Task.CompletedTask;
    }

}