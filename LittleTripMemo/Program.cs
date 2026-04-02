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
builder.Services.AddScoped<AccountRepository>();
builder.Services.AddScoped<ArchiveRepository>();
builder.Services.AddScoped<DetailRepository>();
builder.Services.AddScoped<ArchivePubRepository>();
builder.Services.AddScoped<DetailPubRepository>();
builder.Services.AddScoped<ReactionPubRepository>();

// ---- Service（業務ロジック層） ----

// Controller は必ず Service 経由で処理を行う
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<GetUnMergeDetailsService>();
builder.Services.AddScoped<GetArchiveDetailsService>();
builder.Services.AddScoped<GetArchiveListService>();
builder.Services.AddScoped<UpsertDetailService>();
builder.Services.AddScoped<MergeDetailsService>();
builder.Services.AddScoped<DeleteArchiveService>();
builder.Services.AddScoped<UpdateArchiveService>();
builder.Services.AddScoped<PublishArchiveService>();
builder.Services.AddScoped<SearchByLocationService>();
builder.Services.AddScoped<GetArchiveDetailsPubService>();
builder.Services.AddScoped<UnpublishArchiveService>();
builder.Services.AddScoped<UpsertReactionService>();
builder.Services.AddScoped<OpenArchiveService>();
builder.Services.AddScoped<CloseArchiveService>();
builder.Services.AddScoped<UpdateArchivePubService>();
builder.Services.AddScoped<UpdateDetailPubService>();
builder.Services.AddScoped<SearchByLocationPubService>();


// ======================================================================
// ■ Controller / API 振る舞い設定
// ======================================================================

// Controller 有効化 + JSON の既定ルール設定
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // JSON プロパティ名を camelCase に統一
        //options.JsonSerializerOptions.PropertyNamingPolicy =
        //    JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
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
// ■ API メタデータ（Swagger 用・本体非依存）
// ======================================================================

// Controller / Minimal API の定義を収集し、
// OpenAPI 仕様生成の材料を提供する
builder.Services.AddEndpointsApiExplorer();


// ======================================================================
// ■ Swagger（開発・デバッグ用）
// ======================================================================

// API 仕様確認用。本番では UI を出さない
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1",
        new OpenApiInfo { Title = "LittleTripMemo", Version = "v1" });

    // JWT 認証用ヘッダ定義
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWTトークンを入力"
    });

    // 全APIで JWT を必須にする
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


// ======================================================================
// ■ CORS（フロントエンド連携用・開発向け）
// ======================================================================

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:5501",
                "http://127.0.0.1:5501")
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


// ======================================================================
// ■ ミドルウェアパイプライン（実行順が重要）
// ======================================================================

// 全体例外を JSON レスポンスに変換
app.UseMiddleware<ExceptionHandling>();

// Swagger UI（開発時のみ）
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


// ======================================================================
// ■ SPA エントリーポイント設定
// ======================================================================

//// ルートアクセス時に index.html を返す（SPA の起点）
//app.UseDefaultFiles(new DefaultFilesOptions
//{
//    DefaultFileNames = { "index.html" }
//});
//// 静的ファイル配信
//app.UseStaticFiles();

// HTTPS 強制（ngrok 使用時は問題になる場合あり）
app.UseHttpsRedirection();

// CORS 設定を有効化（フロントエンドからの別オリジン通信を許可）
app.UseCors();

// 認証ミドルウェア
// リクエストに含まれる JWT を検証し、ユーザー情報を HttpContext.User に設定
app.UseAuthentication();

// 認可ミドルウェア
// [Authorize] 属性などを基に、アクセス可否を判定
app.UseAuthorization();

// Controller ルーティング有効化
app.MapControllers();

// 起動
app.Run();

