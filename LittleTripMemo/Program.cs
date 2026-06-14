using LittleTripMemo.Common;
using LittleTripMemo.Configs;
using LittleTripMemo.Controllers;
using LittleTripMemo.DataAccess;
using LittleTripMemo.DbContext;
using LittleTripMemo.Exceptions;
using LittleTripMemo.JWT;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using LittleTripMemo.Services;
using LittleTripMemo.Services.Admin;
using LittleTripMemo.Services.Sys;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json;


var builder = WebApplication.CreateBuilder(args);


// ======================================================================
// ■ 基本設定（アプリ起動時に一度だけ決まるもの）
// ======================================================================

// DB接続文字列（appsettings.json から自動取得）
var connectionString =
    builder.Configuration.GetConnectionString("LittleTripMemoConnStr");


// ======================================================================
// ■ ログ・例外などの横断的インフラ設定
// ======================================================================

// Serilog を標準ロガーとして使用する設定
// appsettings.json 側で出力先・レベルを制御する
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();


// ======================================================================
// ■ DIコンテナ登録（アプリの構成部品）
//    ※ ここでは「生成ルール」だけを定義する
// ======================================================================

// ---- インフラ層 ----

// DBトランザクション管理
// 1リクエスト = 1 TransactionProvider
builder.Services.AddScoped<ITransactionProvider>(
    _ => new TransactionProvider(connectionString!)
);

// ---- 共通コンテキスト ----

// ログインユーザー情報などをリクエスト単位で保持
builder.Services.AddScoped<UserContext>();

// HttpContext 参照用（UserContext 等で使用）
builder.Services.AddHttpContextAccessor();


// ---- DB / Identity ----

// EF Core の DbContext（PostgreSQL）
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// ASP.NET Identity（ユーザー管理・認証基盤）
builder.Services.AddIdentity<MyAppUser, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();


// ---- Infrastructure / Cross-cutting ----

builder.Services.AddScoped<JwtService>();

// ---- Repository（DBアクセス層） ----

// Service からのみ使用され、Controller からは直接触らせない
builder.Services.AddScoped<AppUserRepository>();
builder.Services.AddScoped<ArchiveRepository>();
builder.Services.AddScoped<DetailRepository>();
builder.Services.AddScoped<ArchivePubRepository>();
builder.Services.AddScoped<DetailPubRepository>();
builder.Services.AddScoped<ReactionPubRepository>();
// ---- Sys / Infrastructure Repository ----
builder.Services.AddScoped<SysFeedbackRepository>();
builder.Services.AddScoped<SysNotificationRepository>();
builder.Services.AddScoped<SysReportRepository>();
builder.Services.AddScoped<SysUserNotificationRepository>();

// ---- Service（業務ロジック層） ----

// Controller は必ず Service 経由で処理を行う
builder.Services.AddScoped<RegistrationUserService>();
builder.Services.AddScoped<UpdateUserProfileService>();
builder.Services.AddScoped<GetUserProfileService>();
builder.Services.AddScoped<GetUnMergeDetailsService>();
builder.Services.AddScoped<GetArchiveDetailsService>();
builder.Services.AddScoped<GetArchiveListService>();
builder.Services.AddScoped<MergeDetailsService>();
builder.Services.AddScoped<AddDetailsService>();
builder.Services.AddScoped<DeleteArchiveService>();
builder.Services.AddScoped<UpdateArchiveService>();
builder.Services.AddScoped<PublishArchiveService>();
builder.Services.AddScoped<GetArchiveDetailsPubService>();
builder.Services.AddScoped<UnpublishArchiveService>();
builder.Services.AddScoped<OpenArchiveService>();
builder.Services.AddScoped<CloseArchiveService>();
builder.Services.AddScoped<UpdateArchivePubService>();
builder.Services.AddScoped<UpdateDetailPubService>();
builder.Services.AddScoped<SearchByLocationPubService>();
builder.Services.AddScoped<BulkSyncDetailsService>();
builder.Services.AddScoped<BulkSyncReactionService>();
builder.Services.AddScoped<DeleteStrayDetailsService>();
builder.Services.AddScoped<DetachDetailsService>();
// ---- Sys / Infrastructure Service ----
builder.Services.AddScoped<UpsertFeedbackService>();
builder.Services.AddScoped<UpsertReportService>();
builder.Services.AddScoped<GetSystemInfoService>();
builder.Services.AddScoped<GetAllFeedbackService>();
builder.Services.AddScoped<UpsertNotificationService>();
builder.Services.AddScoped<GetReportSummaryService>();
builder.Services.AddScoped<GetAllNotificationsService>();
builder.Services.AddScoped<GetReportDetailsService>();
builder.Services.AddScoped<GetMyFeedbackService>();
builder.Services.AddScoped<GetMyReportService>();
builder.Services.AddScoped<DeleteMyReportService>();
builder.Services.AddScoped<SendUserNotificationService>();
builder.Services.AddScoped<GetMyUserNotificationsService>();
builder.Services.AddScoped<AdminCloseArchivePubService>();
builder.Services.AddScoped<AdminUnpublishArchiveService>();
builder.Services.AddScoped<GetAllUserNotificationsService>();
builder.Services.AddScoped<GetAdminAllInfoService>();


// ======================================================================
// ■ Controller / API 振る舞い設定
// ======================================================================

// Controller 有効化 + JSON の既定ルール設定
builder.Services.AddControllers(options =>
{
    // ★ これを追加：すべてのAPIで UserValidationFilter が自動的に実行される
    options.Filters.Add<UserValidationFilter>();
})
.AddJsonOptions(options =>
{
    // JSON プロパティ名を camelCase に統一
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
})
.ConfigureApiBehaviorOptions(options =>
{
    // モデルバリデーションエラーを共通フォーマットで返す
    options.InvalidModelStateResponseFactory = context =>
    {
        var msg = string.Join(" / ",
            context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage));

        return new BadRequestObjectResult(new ErrorResponse
        {
            Message = msg,
            ErrorCode = "VALIDATION_ERROR"
        });
    };
});


// ======================================================================
// ■ CORS（フロントエンド連携用）
// ======================================================================

builder.Services.AddCors(options =>
{
    //options.AddDefaultPolicy(policy =>
    //{
    //    policy.WithOrigins(
    //            "https://littletripmemomock-31477.web.app",    // firebase hosting でのホスト名
    //            "http://localhost:8080",
    //            "http://127.0.0.1:8080", // これも追加
    //            "http://localhost:5000",
    //            "http://127.0.0.1:5000", // これも念のため
    //            "http://localhost:5500",
    //            "http://127.0.0.1:5500",
    //            "http://localhost:5501",
    //            "http://127.0.0.1:5501")
    //          .AllowAnyHeader()
    //          .AllowAnyMethod();
    //});
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()   // すべてのドメインを許可(ngrok使用時だけの特例）
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


// ======================================================================
// ■ AppSettings（設定値を型安全に扱うためのバインド）
// ======================================================================

builder.Services.Configure<MyAppSettings>(
    builder.Configuration.GetSection(MyAppSettings.SectionName));

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName));


// ======================================================================
// ■ JWT 認証設定（認証方式の中核）
// ======================================================================

// Claim 型の自動変換を無効化
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// JWT 設定読み込み
var jwt = builder.Configuration
    .GetSection(JwtSettings.SectionName)
    .Get<JwtSettings>()!;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwt.SecretKey))
        };

        // ✅ これを追加
        options.Events = new JwtBearerEvents
        {
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync("{\"message\":\"Unauthorized\"}");
            }
        };
    });

// ======================================================================
// 
// ■ アプリ生成
// 
// ======================================================================

var app = builder.Build();


//// HTTPS 強制（ngrok 使用時は問題になる場合あり）
//app.UseHttpsRedirection();

// CORS 設定を有効化（フロントエンドからの別オリジン通信を許可）
app.UseRouting(); // これを明示的に追加
app.UseCors();

// 全体例外を JSON レスポンスに変換
app.UseMiddleware<ExceptionHandling>();




// JWTミドルウェア実行
app.UseMiddleware<JwtMiddleware>();

// 認可ミドルウェア
// [Authorize] 属性などを基に、アクセス可否を判定
app.UseAuthorization();

// Controller ルーティング有効化
app.MapControllers();

// 起動
app.Run();

