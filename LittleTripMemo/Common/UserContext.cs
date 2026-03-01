using System.Security.Claims;

namespace LittleTripMemo.Common;

/// <summary>
/// ユーザー情報を保持するコンテキストクラス
/// </summary>
public class UserContext
{
    // ユーザー固有の識別子
    public Guid UserId { get; set; } = Guid.Empty;

    // 動的テーブル作成に使用するID
    public int TableId { get; set; } = 0;

    // 料金プラン（権限）
    public string Plan { get; set; } = PlanType.Free.ToString();

}

