namespace LittleTripMemo.Models.Common;

public class UserContext
{
    // ユーザー固有の識別子
    public Guid UserId { get; set; } = Guid.Empty;

    // 動的テーブル作成に使用するID
    public int TableId { get; set; } = 0;

}

