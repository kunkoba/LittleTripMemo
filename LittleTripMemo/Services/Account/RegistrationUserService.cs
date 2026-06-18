using LittleTripMemo.Configs;
using LittleTripMemo.JWT;
using LittleTripMemo.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using LittleTripMemo.Common;
using LittleTripMemo.Repository.Sys;

namespace LittleTripMemo.Services.Account;

public class RegistrationUserService
{
    private readonly UserManager<MyAppUser> _userManager;
    private readonly AppUserRepository _appUserRepo;
    private readonly TableStatisticsRepository _statsRepo;
    private readonly JwtService _jwtService;
    private readonly MyAppSettings _settings;

    public record FirebaseLoginRequest(string Email);
    public record Response(
        bool is_success, 
        string message, 
        string? token = null, 
        Guid? userId = null, 
        string? plan = null
        );

    public RegistrationUserService(
        UserManager<MyAppUser> userManager,
        AppUserRepository appUserRepo,
        TableStatisticsRepository statsRepo,
        IOptions<MyAppSettings> settings,
        JwtService jwtService
        )
    {
        _userManager = userManager;
        _appUserRepo = appUserRepo;
        _statsRepo = statsRepo;
        _settings = settings.Value;
        _jwtService = jwtService;
    }

    public async Task<Response> LoginOrRegisterAsync(FirebaseLoginRequest request)
    {
        // 1. まず Identity(AspNetUsers) を検索
        var authUser = await _userManager.FindByEmailAsync(request.Email);

        if (authUser == null)
        {
            // 未登録なら新規作成（認証 ＋ アプリ用データの両方）
            var regResult = await RegisterInternalAsync(request.Email);
            if (!regResult.is_success) return regResult;
            authUser = await _userManager.FindByEmailAsync(request.Email);
        }

        // 2. アプリ用テーブル (t_app_user) から詳細データを取得
        var appUser = await _appUserRepo.GetByUserIdAsync(authUser!.Id);

        // もし認証はあるのにアプリデータがない場合はここで補完（またはエラー）
        if (appUser == null) return new Response(false, "ユーザー業務データが不足しています。");

        // 3. トークン生成（Identity情報とアプリ情報の両方を使ってJWTを作る）
        var token = _jwtService.CreateToken(authUser, appUser);

        return new Response(true, "成功", token, appUser.user_id, appUser.plan_type);
    }

    private async Task<Response> RegisterInternalAsync(string email)
    {
        // ① 認証ユーザーの作成 (AspNetUsers)
        var identityUser = new MyAppUser { Email = email, UserName = email };
        var result = await _userManager.CreateAsync(identityUser);
        if (!result.Succeeded) return new Response(false, "認証登録に失敗しました。");

        // ② アプリ用データの作成 (t_app_user)
        var table_id = await SelectTableIdAsync();
        var appUser = new TAppUser
        {
            user_id = identityUser.Id,
            table_id = table_id,
            plan_type = PlanType.Free.ToString(),
            nick_name = email.Split('@')[0],
            icon = "❔"
        };
        await _appUserRepo.InsertAsync(appUser);

        return new Response(true, "成功");
    }

    /// <summary>
    /// テーブルIDの選択ロジック
    /// </summary>
    /// <returns></returns>
    private async Task<int> SelectTableIdAsync()
    {
        // 1. 管理テーブルから最新の集計済みレコード数を取得（超高速）
        var stats = await _statsRepo.GetAllStatsAsync();

        if (!stats.Any())
        {
            // まだバッチが一度も動いていない場合の安全策
            return 1;
        }

        // 2. record_count が最も少ないものを選択。同じなら ID が若い方を優先。
        // (dynamicで受けているので、プロパティ名で並び替え)
        var target = stats
            .OrderBy(x => (long)x.record_count)
            .ThenBy(x => (int)x.table_id)
            .First();

        return (int)target.table_id;
    }

}