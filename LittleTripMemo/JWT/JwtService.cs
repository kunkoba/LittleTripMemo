using LittleTripMemo.Common;
using LittleTripMemo.Configs;
using LittleTripMemo.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LittleTripMemo.JWT;

public class JwtService
{
    // appsettings.json から読み込む JWT 設定
    private readonly JwtSettings _settings;

    public JwtService(IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }

    /// <summary>
    /// ユーザ情報から JWTトークン を生成する
    /// </summary>
    public string CreateToken(MyAppUser user)
    {
        var claims = new List<Claim>
        {
            // ASP.NET Identity 標準クレーム
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email ?? ""),

            new Claim(nameof(UserContext.TableId), user.TableId.ToString()),

            // 権限（free / standard / premium / admin）
            new Claim(nameof(UserContext.Plan), user.Plan)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_settings.SecretKey));

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(_settings.ExpireDays),
            signingCredentials:
                new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
