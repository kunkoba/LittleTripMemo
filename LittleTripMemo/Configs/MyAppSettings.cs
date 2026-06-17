// Models/MyAppSettings.cs
namespace LittleTripMemo.Configs;

/// <summary>
/// アプリケーション固有の設定を一括管理するクラス。
/// appsettings.json の "MyAppSettings" セクションと紐付きます。
/// </summary>
public class MyAppSettings
{
    // Program.cs で使用するセクション名定数
    public const string SectionName = "MyAppSettings";

    public int MaxTableNum { get; set; } = -1;   // テーブル分散の最大数

    // バッチの実行間隔（分）
    public int ReactionCountUpdateIntervalMinutes { get; set; } = -1; // リアクション集計
    public int SystemMaintenanceIntervalMinutes { get; set; } = -1;   // ゴミ掃除など（1440分 = 24時間）

}

/// <summary>
/// JWTを管理するクラス。
/// appsettings.json の "JwtSettings" セクションと紐付きます。
/// </summary>
public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpireDays { get; set; } = 60;

}

