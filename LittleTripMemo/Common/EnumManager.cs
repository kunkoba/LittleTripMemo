namespace LittleTripMemo.Common;

// 料金プラン・権限
public enum PlanType
{
    Admin,       // 管理者
    Free,       // 無料プラン
    Standard,   // 標準プラン
    Premium,    // プレミアムプラン
}

// メール（個別通知）種別
public enum UserNotificationKind : short
{
    Info = 1,     // 通常（フィードバックありがとう、など）
    Caution = 8,  // 注意（強制クローズ：t_memo_archive_pub.closed_flg = true）
    Warning = 9,  // 警告（強制公開停止：データが秘密側へ戻された）
}