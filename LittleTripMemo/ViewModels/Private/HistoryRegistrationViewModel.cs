//using System.ComponentModel.DataAnnotations; // バリデーション属性に必要

//namespace LittleTripMemo.ViewModels.Private;

///// <summary>
///// 明細登録リクエスト。
///// 属性を付与することで、コントローラーに届く前に自動で形式チェックが行われます。
///// </summary>
//public class HistoryCreateRequest
//{
//    [Required(ErrorMessage = "アーカイブIDは必須です。")]
//    [Range(0, int.MaxValue, ErrorMessage = "有効なアーカイブIDを指定してください。")]
//    public int ArchiveId { get; init; }

//    [Required(ErrorMessage = "緯度は必須です。")]
//    [Range(-90, 90, ErrorMessage = "緯度は-90から90の間で入力してください。")]
//    public decimal Latitude { get; init; }

//    [Required(ErrorMessage = "経度は必須です。")]
//    [Range(-180, 180, ErrorMessage = "経度は-180から180の間で入力してください。")]
//    public decimal Longitude { get; init; }

//    [Required(ErrorMessage = "タイトルを入力してください。")]
//    [StringLength(100, ErrorMessage = "タイトルは100文字以内で入力してください。")]
//    public string Title { get; init; } = string.Empty;

//    [StringLength(2000, ErrorMessage = "本文は2000文字以内で入力してください。")]
//    public string Body { get; init; } = string.Empty;

//    [Required(ErrorMessage = "日付を選択してください。")]
//    [RegularExpression(@"^\d{4}/\d{2}/\d{2}$", ErrorMessage = "日付は yyyy/MM/dd 形式で入力してください。")]
//    public string MemoDate { get; init; } = string.Empty;

//    [Required(ErrorMessage = "時刻を選択してください。")]
//    [RegularExpression(@"^([01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "時刻は HH:mm 形式で入力してください。")]
//    public string MemoTime { get; init; } = string.Empty;

//    public int FaceId { get; init; }
//    public int WeatherId { get; init; }

//    [Url(ErrorMessage = "有効なURLを入力してください。")]
//    public string? LinkUrl { get; init; }

//    [Range(0, 1000000, ErrorMessage = "金額は0円から100万円の間で入力してください。")]
//    public int MemoPrice { get; init; }
//}

