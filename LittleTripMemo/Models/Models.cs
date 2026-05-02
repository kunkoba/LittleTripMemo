
using LittleTripMemo.Common;

namespace LittleTripMemo.Models;

public class TMemoArchive : IAppRecord
{
    public int archive_id { get; set; } = 0;
    public Guid user_id { get; set; }
    public string title { get; set; } = "仮のタイトル";
    public string memo { get; set; } = "仮の本文";
    public string link_url { get; set; } = string.Empty;
    public string currency_unit { get; set; } = "JPY";
    public bool closed_flg { get; set; } = false;
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
    public bool is_public { get; set; } = false;
    public bool is_owner { get; set; } = true;
    public int cnt { get; set; } = 0;
}

public class TMemoArchivePub : IAppRecord
{
    public int archive_id { get; set; } = 0;
    public Guid user_id { get; set; }
    public string title { get; set; } = string.Empty;
    public string memo { get; set; } = string.Empty;
    public string link_url { get; set; } = string.Empty;
    public string currency_unit { get; set; } = "JPY";
    public bool closed_flg { get; set; } = false;
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
    public bool is_public { get; set; } = true;
    public bool is_owner { get; set; } = false;
    public int cnt { get; set; } = 0;
}

public class TMemoDetail : IAppRecord
{
    public long seq { get; set; }
    public int archive_id { get; set; } = 0;
    public Guid user_id { get; set; }
    public decimal latitude { get; set; }
    public decimal longitude { get; set; }
    public string title { get; set; } = string.Empty;
    public string body { get; set; } = string.Empty;
    public string memo_date { get; set; } = string.Empty;
    public string memo_time { get; set; } = string.Empty;
    public string face_emoji { get; set; } = string.Empty;
    public string weather_code { get; set; } = string.Empty;
    public string? link_url { get; set; } = string.Empty;
    public int memo_price { get; set; } = 0;
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
    public bool is_public { get; set; } = false;
    public bool is_owner { get; set; } = true;
    public string a_title { get; set; } = string.Empty;
}

public class TMemoDetailPub : IAppRecord
{
    public int archive_id { get; set; } = 0;
    public long seq { get; set; }
    public Guid user_id { get; set; }
    public decimal latitude { get; set; }
    public decimal longitude { get; set; }
    public string? title { get; set; } = string.Empty;
    public string? body { get; set; } = string.Empty;
    public string memo_date { get; set; } = string.Empty;
    public string memo_time { get; set; } = string.Empty;
    public string face_emoji { get; set; } = string.Empty;
    public string weather_code { get; set; } = string.Empty;
    public string? link_url { get; set; } = string.Empty;
    public int memo_price { get; set; } = 0;
    public bool closed_flg { get; set; } = false;
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
    public bool is_public { get; set; } = true;
    public bool is_owner { get; set; } = false;
    public int count_funny { get; set; } = 0;
    public int count_helpful { get; set; } = 0;
    public int count_surprise { get; set; } = 0;
    public int count_empathy { get; set; } = 0;
    public string a_title { get; set; } = string.Empty;
}

public class TReactionPub
{
    public int archive_id { get; set; } = 0;
    public long seq { get; set; }
    public Guid user_id { get; set; }
    public int reaction_type { get; set; } = 0;
}

#region "システム関連"

    // フィードバック
    public class TSysFeedback
    {
        public Guid user_id { get; set; } // アプリ側はGuid
        public string? body { get; set; }
        public int score { get; set; }
        public DateTime update_tim { get; set; }
    }

    // お知らせ
    public class TSysNotification
    {
        public long seq { get; set; }
        public string title { get; set; } = string.Empty;
        public string body { get; set; } = string.Empty;
        public short kind { get; set; }
        public DateTime disp_from { get; set; }
        public DateTime disp_to { get; set; }
        public DateTime update_tim { get; set; }
    }

    // 通報
    public class TSysReport
    {
        public Guid reporter_user_id { get; set; }
        public Guid target_user_id { get; set; }
        public long archive_id { get; set; }
        public string? body { get; set; }
        public DateTime report_tim { get; set; }
    }

#endregion

#region "DTO"

    /// <summary>
    /// まとめ親リスト（private＋public）
    /// </summary>
    public class DtoArchive
    {
        public long archive_id { get; set; } = 0;
        public Guid user_id { get; set; }
        public string title { get; set; } = string.Empty;
        public string memo { get; set; } = string.Empty;
        public string link_url { get; set; } = string.Empty;
        public string currency_unit { get; set; } = "JPY";
        public bool closed_flg { get; set; } = false;
        public bool del_flg { get; set; } = false;
        public DateTime create_tim { get; set; }
        public DateTime update_tim { get; set; }
        public bool is_public { get; set; } = true;
        public bool is_owner { get; set; } = false;
        public int cnt { get; set; } = 0;
    }

    /// <summary>
    /// フィードバック集計結果
    /// </summary>
    public class DtoFeedbackSummary
    {
        public IEnumerable<TSysFeedback> LatestFeedbacks { get; set; } = Enumerable.Empty<TSysFeedback>();
        public double AverageScore { get; set; }
    }

    /// <summary>
    /// 通報情報集計結果
    /// </summary>
    public class DtoReportSummary
    {
        public Guid target_user_id { get; set; }
        public long archive_id { get; set; }
        public long report_count { get; set; }
    }

#endregion
