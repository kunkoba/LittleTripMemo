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

    public string TestSetting { get; set; } = String.Empty;   // テスト用
    public int MaxTableNum { get; set; } = 0;   // テーブル分散の最大数

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
    public int ExpireMinutes { get; set; } = 60;

}

