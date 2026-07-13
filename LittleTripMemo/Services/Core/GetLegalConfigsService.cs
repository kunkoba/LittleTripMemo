using LittleTripMemo.Common;
using LittleTripMemo.Repository.Core;

namespace LittleTripMemo.Services.Core;

public class GetLegalConfigsService(CoreConfigRepository coreRepo)
{
    public record LegalCheckItem(string key, DateTime? last_sync_tim);
    public record LegalResultItem(string key, string? value, DateTime update_tim);
    public record GetLegalConfigsReq(IEnumerable<LegalCheckItem> items);
    public record Response(IEnumerable<LegalResultItem> results);
    public async Task<Response> ExecuteAsync(GetLegalConfigsReq req)
    {
        var dbConfigs = await coreRepo.GetConfigsByCategoryAsync("LEGAL");
        var results = dbConfigs.Select(db => {
            string key = db.key;
            DateTime dbTim = db.update_tim;
            var clientItem = req.items.FirstOrDefault(i => i.key == key);
            string? content = (clientItem == null || dbTim > (clientItem.last_sync_tim ?? DateTime.MinValue)) ? (string)db.value : null;
            return new LegalResultItem(key, content, dbTim);
        });
        return new Response(results);
    }

}