using LittleTripMemo.Configs;
using LittleTripMemo.JWT;
using LittleTripMemo.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using LittleTripMemo.Common;
using LittleTripMemo.Repository.Sys;
using LittleTripMemo.Exceptions;

namespace LittleTripMemo.Services.Account;

/// <summary>
/// 外部認証情報に基づき、アプリユーザーのログインまたは新規登録を行うサービス
/// </summary>
public class RegistrationUserService : _BaseService
{
    private readonly UserManager<MyAppUser> _userManager;
    private readonly AppUserRepository _appUserRepo;
    private readonly TableStatisticsRepository _statsRepo;
    private readonly JwtService _jwtService;

public record FirebaseLoginRequest(string Email);
    public record Response(
        bool is_success, 
        string message, 
        string? token = null, 
        Guid? userId = null, 
        string? plan = null
    );

    public RegistrationUserService(
        UserContext user,
        UserManager<MyAppUser> userManager,
        AppUserRepository appUserRepo,
        TableStatisticsRepository statsRepo,
        JwtService jwtService
    ) : base(user)
    {
        _userManager = userManager;
        _appUserRepo = appUserRepo;
        _statsRepo = statsRepo;
        _jwtService = jwtService;
    }

    public async Task<Response> ExecuteAsync(FirebaseLoginRequest request)
    {
        // 1. バリデーション
        await ValidateAsync(request);

        // 2. 認証情報の確認
        var authUser = await _userManager.FindByEmailAsync(request.Email);
        if (authUser == null)
        {
            var regResult = await RegisterInternalAsync(request.Email);
            if (!regResult.is_success) return regResult;
            authUser = await _userManager.FindByEmailAsync(request.Email);
        }

        // 3. アプリユーザー情報の取得
        var appUser = await _appUserRepo.GetByUserIdAsync(authUser!.Id);
        if (appUser == null) throw new BusinessException("ユーザー業務データが不足しています。");

        // 4. JWTトークンの生成
        var token = _jwtService.CreateToken(authUser, appUser);

        return new Response(true, "成功", token, appUser.user_id, appUser.plan_type);
    }

    private async Task ValidateAsync(FirebaseLoginRequest req)
    {
        BusinessException.ThrowIf(string.IsNullOrEmpty(req.Email), "メールアドレスは必須です");
        await Task.CompletedTask;
    }

    /// <summary>
    /// メルアドを元に、Identityユーザーとアプリユーザーを新規登録する内部処理
    /// </summary>
    /// <param name="email"></param>
    /// <returns></returns>
    private async Task<Response> RegisterInternalAsync(string email)
    {
        var identityUser = new MyAppUser { Email = email, UserName = email };
        var result = await _userManager.CreateAsync(identityUser);
        if (!result.Succeeded) return new Response(false, "認証登録に失敗しました。");

        var table_id = await SelectTableIdAsync();
        var appUser = new TAppUser
        {
            user_id = identityUser.Id,
            table_id = table_id,
            plan_type = PlanType.Free.ToString(),
            nick_name = $"旅人_{identityUser.Id.ToString()[..8]}",
            icon = "👤"
        };
        await _appUserRepo.InsertAsync(appUser);

        return new Response(true, "成功");
    }

    /// <summary>
    /// テーブルIDを選択する。最もレコード数が少ないテーブルを優先的に選ぶ。
    /// </summary>
    /// <returns></returns>
    private async Task<int> SelectTableIdAsync()
    {
        var stats = await _statsRepo.GetAllStatsAsync();
        if (!stats.Any()) return 1;

        var target = stats
            .OrderBy(x => (long)x.record_count)
            .ThenBy(x => (int)x.table_id)
            .First();

        return (int)target.table_id;
    }

}