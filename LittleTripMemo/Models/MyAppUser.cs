using Microsoft.AspNetCore.Identity;

namespace LittleTripMemo.Models;

/// <summary>
/// カスタムユーザーモデル。
/// Identity標準のユーザー情報に、テーブル分散用のIDを追加します。
/// </summary>
public class MyAppUser : IdentityUser<Guid>
{
    /// <summary>
    /// テーブル分散用のID (例: 0〜9)
    /// </summary>
    public int TableId { get; set; }
}

