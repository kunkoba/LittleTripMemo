// Services/AccountService.cs

using LittleTripMemo.Configs;
using LittleTripMemo.DataAccess;
using LittleTripMemo.JWT;
using LittleTripMemo.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace LittleTripMemo.Services;

public class AccountService
{
    private readonly UserManager<MyAppUser> _userManager;
    private readonly AccountRepository _accountRepository;
    private readonly ILogger<AccountService> _logger;
    private readonly MyAppSettings _settings;
    private readonly JwtService _jwtService; // ★追加

    // リクエスト
    public record FirebaseLoginRequest(string Email);

    // レスポンス（tokenを追加）
    public record Response(bool is_success, string message, string? token = null);

    public AccountService(
        UserManager<MyAppUser> userManager,
        AccountRepository userRepo,
        IOptions<MyAppSettings> settings,
        ILogger<AccountService> logger,
        JwtService jwtService) // ★DIで受け取る
    {
        _userManager = userManager;
        _accountRepository = userRepo;
        _settings = settings.Value;
        _logger = logger;
        _jwtService = jwtService; // ★代入
    }

    /// <summary>
    /// ログイン・登録を一括で行い、トークンを返す（ユースケース）
    /// </summary>
    public async Task<Response> LoginOrRegisterAsync(FirebaseLoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
        {
            // 下記の RegisterAsync を実行
            var regResult = await RegisterAsync(request.Email);
            if (!regResult.is_success) return regResult;

            // ユーザ検索
            user = await _userManager.FindByEmailAsync(request.Email);
        }

        if (user == null) return new Response(false, "ユーザー取得失敗");

        // JwtService を使ってトークン生成
        var token = _jwtService.CreateToken(user);
        return new Response(true, "成功", token);
    }

    /// <summary>
    /// 新規ユーザー登録（認証という仕事なのでサービス層で処理）
    /// </summary>
    public async Task<Response> RegisterAsync(string email)
    {
        if (await _userManager.FindByEmailAsync(email) != null)
        {
            return new Response(false, "既に登録済みです。");
        }

        var tableId = await SelectTableIdAsync();

        var user = new MyAppUser
        {
            UserName = email,
            Email = email,
            TableId = tableId
        };

        var result = await _userManager.CreateAsync(user);

        if (!result.Succeeded)
        {
            _logger.LogWarning("User creation failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            return new Response(false, "ユーザー登録に失敗しました。");
        }

        return new Response(true, "成功");
    }

    /// <summary>
    /// テーブルID取得（テーブル分散したテーブルから件数が一番少ないテーブルを取得）
    /// </summary>
    /// <returns></returns>
    private async Task<int> SelectTableIdAsync()
    {
        var tableCounts = new List<(int Id, long Count)>();
        for (int i = 1; i <= _settings.MaxTableNum; i++)
        {
            var count = await _accountRepository.GetTableCountAsync(i);
            tableCounts.Add((i, count));
        }
        // 一番小さいものを取得
        return tableCounts.OrderBy(x => x.Count).ThenBy(x => x.Id).First().Id;
    }
}

