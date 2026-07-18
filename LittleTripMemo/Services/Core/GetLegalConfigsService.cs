using LittleTripMemo.Common;
using LittleTripMemo.Repository.Core;

namespace LittleTripMemo.Services.Core;

/// <summary>
/// 利用規約やプライバシーポリシーなどの法的文書を設定時刻に基づき差分取得するサービス
/// </summary>
public class GetLegalConfigsService : _BaseService
{
    private readonly CoreConfigRepository _coreRepo;
    public record LegalCheckItem(string key, DateTime? last_sync_tim);
    public record LegalResultItem(string key, string? value, DateTime update_tim);
    public record GetLegalConfigsReq(IEnumerable<LegalCheckItem> items);
    public record Response(IEnumerable<LegalResultItem> results);

    public GetLegalConfigsService(UserContext user, CoreConfigRepository coreRepo) : base(user)
    {
        _coreRepo = coreRepo;
    }

    public async Task<Response> ExecuteAsync(GetLegalConfigsReq req)
    {
        // 1. バリデーション
        await ValidateAsync(req);

        // 2. DBからLEGALカテゴリーの設定を取得
        var dbConfigs = await _coreRepo.GetConfigsByCategoryAsync("LEGAL");

        // 3. クライアントの保持時刻と比較し、更新がある場合のみ内容を返却
        var results = dbConfigs.Select(db => {
            string key = db.key;
            DateTime dbTim = db.update_tim;
            var clientItem = req.items.FirstOrDefault(i => i.key == key);
            string? content = (clientItem == null || dbTim > (clientItem.last_sync_tim ?? DateTime.MinValue)) ? (string)db.value : null;
            return new LegalResultItem(key, content, dbTim);
        });

        return new Response(results);
    }

    private async Task ValidateAsync(GetLegalConfigsReq req)
    {
        // 取得処理のため、現状は制約なし
        await Task.CompletedTask;
    }

}