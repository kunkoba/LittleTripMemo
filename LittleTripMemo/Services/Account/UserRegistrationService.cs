//using LittleTripMemo.Configs;
//using LittleTripMemo.DataAccess.Account;
//using LittleTripMemo.Models;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.Extensions.Options;

//namespace LittleTripMemo.Services;

//public class UserRegistrationService
//{
//    private readonly UserManager<MyAppUser> _userManager;
//    private readonly UserRepository _userRepo;
//    private readonly MyAppSettings _settings;

//    // --- 専用DTO ---
//    public record Request(string email);
//    public record Response(bool is_success, string? message, Guid? user_id);

//    public UserRegistrationService(
//        UserManager<MyAppUser> userManager,
//        UserRepository userRepo,
//        IOptions<MyAppSettings> settings)
//    {
//        _userManager = userManager;
//        _userRepo = userRepo;
//        _settings = settings.Value;
//    }

//    /// <summary>
//    /// ユーザー登録ユースケースの実行。
//    /// 最適な保存先テーブルを判定し、Identityユーザーを作成する。
//    /// </summary>
//    public async Task<Response> ExecuteAsync(Request req)
//    {
//        try
//        {
//            // 1. 各テーブルの空き状況をリポジトリ経由で確認し、TableIdを決定
//            int assignedTableId = await SelectTableIdAsync();

//            // 2. ユーザーモデルの生成
//            var user = new MyAppUser
//            {
//                UserName = req.email,
//                Email = req.email,
//                EmailConfirmed = true,
//                TableId = assignedTableId
//            };

//            // 3. UserManagerによる登録実行
//            var result = await _userManager.CreateAsync(user);

//            if (!result.Succeeded)
//            {
//                var error = string.Join(", ", result.Errors.Select(e => e.Description));
//                return new Response(false, error, null);
//            }

//            return new Response(true, "登録に成功しました", user.Id);
//        }
//        catch (Exception ex)
//        {
//            // 予期せぬエラーは上位のMiddlewareに任せるか、ここでラップして返す
//            return new Response(false, $"登録中にエラーが発生しました: {ex.Message}", null);
//        }
//    }

//    /// <summary>
//    /// 各詳細テーブルのレコード数を集計し、最小のTableIdを返す。
//    /// </summary>
//    private async Task<int> SelectTableIdAsync()
//    {
//        var tableCounts = new List<(int Id, long Count)>();

//        for (int i = 1; i <= _settings.MaxTableNum; i++)
//        {
//            // 直接SQLを書かず、UserRepositoryに依頼
//            var count = await _userRepo.GetTableCountAsync(i);
//            tableCounts.Add((i, count));
//        }

//        // 件数が一番少ないものを選出。同じなら番号が小さい方を優先。
//        var bestMatch = tableCounts
//            .OrderBy(x => x.Count)
//            .ThenBy(x => x.Id)
//            .First();

//        return bestMatch.Id;
//    }
//}

