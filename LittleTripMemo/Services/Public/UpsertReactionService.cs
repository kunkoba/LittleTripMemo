using LittleTripMemo.Common;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using System.ComponentModel.DataAnnotations;

namespace LittleTripMemo.Services;

public class UpsertReactionService : _BaseService
{
    private readonly ReactionPubRepository _repo;
    private readonly ITransactionProvider _provider;

    // リクエスト：1レコードで各リアクションをフラグ(bool)で表現
    public record UpsertReactionReq(
        [Required] Guid login_user_id, // ★ 追加
        [Required] int archive_id,
        [Required] int seq,
        bool is_funny,    // type: 1
        bool is_love,     // type: 2
        bool is_surprise, // type: 3
        bool is_sad       // type: 4
    ) : ILoginUserRequest; // ★ インターフェースを実装

    // レスポンス：DBの生データ形式（通常のデータ）をそのまま配列で返す
    public record Response(IEnumerable<TReactionPub> reactions);

    public UpsertReactionService(
        UserContext userContext,
        ITransactionProvider provider,
        ReactionPubRepository repo) : base(userContext)
    {
        _provider = provider;
        _repo = repo;
    }

    public async Task<Response> ExecuteAsync(UpsertReactionReq req)
    {
        // 1. 検証
        await ValidateAsync(req);

        using var tran = _provider.BeginTransaction();
        try
        {
            // 2. 既存の自分のリアクションを一旦クリア（ユーザーID単位の更新）
            await _repo.DeletePhysicalBySeqAsync(req.archive_id, req.seq);

            // 3. ONになっているフラグのみを個別に登録
            if (req.is_funny) await _repo.InsertAsync(req.archive_id, req.seq, 1);
            if (req.is_love) await _repo.InsertAsync(req.archive_id, req.seq, 2);
            if (req.is_surprise) await _repo.InsertAsync(req.archive_id, req.seq, 3);
            if (req.is_sad) await _repo.InsertAsync(req.archive_id, req.seq, 4);

            tran.Commit();

            // 4. 最新のDB状態を取得して返却（通常のデータ形式）
            var currentReactions = await _repo.GetMyReactionsByArchiveIdAsync(req.archive_id);

            return new Response(currentReactions);
        }
        catch
        {
            throw; // 共通例外処理へ
        }
    }

    private async Task ValidateAsync(UpsertReactionReq req)
    {
        BusinessException.ThrowIf(_user.UserId == Guid.Empty, "Unauthorized");
        BusinessException.ThrowIf(req.archive_id == 0, "アーカイブIDが無効です");
        await Task.CompletedTask;
    }
}