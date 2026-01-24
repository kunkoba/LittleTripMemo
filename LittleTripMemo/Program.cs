using LittleTripMemo.Configs;
using LittleTripMemo.Data;
using LittleTripMemo.DataAccess;
using LittleTripMemo.Exceptions;
using LittleTripMemo.Models;
using LittleTripMemo.Models.Common;
using LittleTripMemo.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// =====================
// DB 接続設定
// =====================
var connectionString = builder.Configuration.GetConnectionString("RouteMemoConnStr");

// =====================
// Serilogの設定
// =====================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration) // appsettings.jsonから設定を読み込む
    .CreateLogger();

builder.Host.UseSerilog(); // デフォルトのロガーをSerilogに置き換え

// =====================
// インフラ共通
// =====================
builder.Services.AddScoped<ITransactionProvider>(
    _ => new TransactionProvider(connectionString!)
);

builder.Services.AddScoped<UserContext>();
builder.Services.AddHttpContextAccessor();

// =====================
// EF Core + Identity
// =====================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddIdentity<MyAppUser, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// =====================
// Controller / JSON
// =====================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            JsonNamingPolicy.CamelCase;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
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

builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();
// Program.cs

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "LittleTripMemo", Version = "v1" });

    // 1. SwaggerにJWT認証の定義を追加
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWTトークンを入力してください。例: 'abcdef12345'"
    });

    // 2. 全てのAPIでJWT認証を有効にする設定
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

// =====================
// Repository
// =====================
builder.Services.AddScoped<AccountRepository>();
builder.Services.AddScoped<ArchiveRepository>();
builder.Services.AddScoped<HistoryRepository>();

// =====================
// Service
// =====================
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<ArchiveUpdateService>();
builder.Services.AddScoped<HistoryRegistrationService>();
builder.Services.AddScoped<JwtService>();

// =====================
// CORS
// =====================
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5500", "http://127.0.0.1:5500")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// =====================
// AppSettings
// =====================
builder.Services.Configure<MyAppSettings>(
    builder.Configuration.GetSection(MyAppSettings.SectionName));

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName));

// =====================
// JWT 認証（唯一・正）
// =====================
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
    });

// =====================
// Build
// =====================
var app = builder.Build();

// =====================
// Middleware
// =====================
app.UseMiddleware<ExceptionHandling>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

