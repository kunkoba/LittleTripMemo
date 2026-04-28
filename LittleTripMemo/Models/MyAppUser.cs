using LittleTripMemo.Common;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace LittleTripMemo.Models;

/// <summary>
/// カスタムユーザーモデル。
/// Identity標準のユーザー情報に、テーブル分散用のIDを追加します。
/// </summary>
public class MyAppUser : IdentityUser<Guid>
{
    public int TableId { get; set; }
    public string Plan { get; set; } = PlanType.Free.ToString();
    public string Icon { get; set; } = String.Empty;
    public string NickName { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    public string Link1 { get; set; } = String.Empty;
    public string Link2 { get; set; } = String.Empty;
    public string Link3 { get; set; } = String.Empty;
}

