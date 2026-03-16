
using LittleTripMemo.Common;

namespace LittleTripMemo.Models;

#region "非公開関連"

public class TMemoArchive : IAppRecord
{
    public int archive_id { get; set; } = 0;
    public Guid user_id { get; set; }
    public string title { get; set; } = string.Empty;
    public string memo { get; set; } = string.Empty;
    public string link_url { get; set; } = string.Empty;
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
    public bool is_public { get; set; } = false;
    public bool is_owner { get; set; } = true;
}

public class TMemoDetail : IAppRecord
{
    public int seq { get; set; }
    public int archive_id { get; set; } = 0;
    public Guid user_id { get; set; }
    public decimal latitude { get; set; }
    public decimal longitude { get; set; }
    public string title { get; set; } = string.Empty;
    public string body { get; set; } = string.Empty;
    public string memo_date { get; set; } = string.Empty;
    public string memo_time { get; set; } = string.Empty;
    public string face_emoji { get; set; }
    public string weather_emoji { get; set; }
    public string? link_url { get; set; } = string.Empty;
    public int memo_price { get; set; } = 0;
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
    public bool is_public { get; set; } = false;
    public bool is_owner { get; set; } = true;
}

#endregion

#region "公開関連"

public class TMemoArchivePub : IAppRecord
{
    public int archive_id { get; set; } = 0;
    public Guid user_id { get; set; }
    public string title { get; set; } = string.Empty;
    public string memo { get; set; } = string.Empty;
    public string? link_url { get; set; } = string.Empty;
    public bool closed_flg { get; set; } = false;
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
    public bool is_public { get; set; } = true;
    public bool is_owner { get; set; } = false;
}

public class TMemoDetailPub : IAppRecord
{
    public int archive_id { get; set; } = 0;
    public int seq { get; set; }
    public Guid user_id { get; set; }
    public decimal latitude { get; set; }
    public decimal longitude { get; set; }
    public string? title { get; set; } = string.Empty;
    public string? body { get; set; } = string.Empty;
    public string memo_date { get; set; } = string.Empty;
    public string memo_time { get; set; } = string.Empty;
    public string face_emoji { get; set; }
    public string weather_emoji { get; set; }
    public int count_good { get; set; } = 0;
    public int count_bad { get; set; } = 0;
    public string? link_url { get; set; } = string.Empty;
    public int memo_price { get; set; } = 0;
    public bool closed_flg { get; set; } = false;
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
    public bool is_public { get; set; } = true;
    public bool is_owner { get; set; } = false;
}

public class TReactionPublish
{
    public int archive_id { get; set; } = 0;
    public int seq { get; set; }
    public Guid user_id { get; set; }
    public byte good { get; set; } = 0;
    public byte bad { get; set; } = 0;
}

#endregion

#region "システム関連"

public class TAppFeedback
{
    public int no { get; set; }
    public byte rating { get; set; }
    public int send_category_id { get; set; }
    public string body { get; set; } = string.Empty;
    public int archive_id { get; set; } = 0;
    public int seq { get; set; }
    public Guid sender_user_id { get; set; }
    public bool del_flg { get; set; } = false;
    public DateTime create_tim { get; set; }
    public DateTime update_tim { get; set; }
}

public class TAppNews
{
    public int no { get; set; }
    public int news_category_id { get; set; }
    public string title { get; set; } = string.Empty;
    public string body { get; set; } = string.Empty;
    public DateTime expiry_tim { get; set; }
    public bool del_flg { get; set; } = false;
}

#endregion

