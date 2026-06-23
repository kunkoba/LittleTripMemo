using LittleTripMemo.Common;
using LittleTripMemo.Configs;
using LittleTripMemo.DataAccess;
using LittleTripMemo.DbContext;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Extensions; // 拡張メソッド用
using LittleTripMemo.JWT;
using LittleTripMemo.Models;
using LittleTripMemo.Repository;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using Dapper;

// 1. 起動前設定（Npgsql タイムスタンプ挙動の固定）
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Dapper の型変換ハンドラーを登録（click_stats の解析に必須）
SqlMapper.AddTypeHandler(new JsonbTypeHandler<Dictionary<string, ClickCountData>>());

// 2. ログ設定 (Serilog)
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();
builder.Host.UseSerilog();

// 3. DB / Identity 設定
var connectionString = builder.Configuration.GetConnectionString("LittleTripMemoConnStr")!;
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<ITransactionProvider>(_ => new TransactionProvider(connectionString));

builder.Services.AddIdentity<MyAppUser, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// 4. アプリケーションサービス登録 (Extensions/ServiceExtensions.cs に集約)
builder.Services.AddAppInfrastructure();
builder.Services.AddAppBusinessServices();

// 5. 共通コンテキスト / セキュリティ
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<UserContext>();
builder.Services.AddSingleton<SystemStatus>();
builder.Services.AddScoped<JwtService>();

// 6. 設定値のバインド
builder.Services.Configure<MyAppSettings>(builder.Configuration.GetSection(MyAppSettings.SectionName));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));

// 7. 認証 (JWT Bearer) 設定
var jwt = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey))
        };
    });

// 8. API / CORS / Swagger 設定
builder.Services.AddControllers(options => options.Filters.Add<UserValidationFilter>());
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "LittleTripMemo API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        In = ParameterLocation.Header
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() } });
});

builder.Services.AddCors(options => options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// 9. 定期バッチ実行
builder.Services.AddHostedService<LittleTripMemo.Worker.SystemMaintenanceWorker>();

var app = builder.Build();

// 10. ミドルウェア・パイプライン
app.UseMiddleware<ExceptionHandling>(); // 最外周で例外をキャッチ

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors();

app.UseMiddleware<JwtMiddleware>(); // 認証情報の抽出
app.UseMiddleware<LittleTripMemo.Middleware.SystemManagementMiddleware>(); // メンテナンス・バージョンチェック

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

