using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace LittleTripMemo.Models;

/// <summary>
/// カスタムユーザーモデル。
/// Identity標準のユーザー情報に、テーブル分散用のIDを追加します。
/// </summary>
public class MyAppUser : IdentityUser<Guid>
{
    [Column(Order = 1)]
    /// <summary>
    /// テーブル分散用のID (例: 0〜9)
    /// </summary>
    public int TableId { get; set; }

    [Column(Order = 2)]
    /// <summary>
    /// ユーザの料金プラン (例: free, standard, premium, admin)
    /// </summary>
    public string Plan { get; set; } = "free";
}

