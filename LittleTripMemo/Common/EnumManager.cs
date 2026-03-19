namespace LittleTripMemo.Common;

// 料金プラン・権限
public enum PlanType
{
    Free,       // 無料プラン
    Standard,   // 標準プラン
    Premium,    // プレミアムプラン
    Admin       // 管理者
}

// リアクション種別
public enum ReactionType
{
    Funny = 1, // 笑える
    Helpful = 2, // 参考になる
    Surprise = 3, // びっくり
    Empathy = 4, // 共感する
}
