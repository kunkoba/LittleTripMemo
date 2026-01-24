
namespace LittleTripMemo.Services;

/// <summary>
/// サービス層専用の補助処理をまとめたユーティリティクラス。
/// ・画面（Controller）からは直接使用しない
/// ・リポジトリ（DB層）にも依存しない
/// ・ユースケース（Service）内でのみ使用される
/// </summary>
public static class ServiceUtilities
{
    #region Sanitize(現在は非推奨)

    /// <summary>
    /// 文字列入力に対する基本的なサニタイズ処理を行います。
    /// 主に以下を目的としています。
    /// ・HTMLタグの無害化（表示時の安全性確保）
    /// ・最大文字数の制御（DB制約・業務制約対策）
    ///
    /// ※ バリデーション（必須チェック等）は別途アノテーションや
    ///   Service の Check 処理で行う前提です。
    /// </summary>
    /// <param name="input">画面から渡された入力文字列</param>
    /// <param name="maxChars">許容する最大文字数</param>
    /// <returns>サニタイズ後の文字列</returns>
    //public static string SanitizeInput(string? input, int maxChars)
    //{
    //    if (string.IsNullOrWhiteSpace(input))
    //        return string.Empty;

    //    // HTMLエンコード（タグやスクリプトを無害化）
    //    var sanitized = System.Web.HttpUtility.HtmlEncode(input);

    //    // 指定された最大文字数で切り詰め
    //    if (sanitized.Length > maxChars)
    //        sanitized = sanitized.Substring(0, maxChars);

    //    return sanitized;
    //}

    /// <summary>
    /// 文字列からHTMLタグを除去し、DB保存時に問題となる
    /// 特殊文字を最低限エスケープします。
    ///
    /// 旧システム互換のために残している処理であり、
    /// 表示向けのHTMLエスケープとは目的が異なります。
    /// </summary>
    /// <param name="input">サニタイズ対象の文字列</param>
    /// <returns>サニタイズ後の文字列</returns>
    //public static string SanitizeInput2(string? input)
    //{
    //    if (string.IsNullOrWhiteSpace(input))
    //        return string.Empty;

    //    // HTMLタグを正規表現で除去
    //    var output = System.Text.RegularExpressions.Regex
    //        .Replace(input, "<.*?>", string.Empty);

    //    // シングルクォートの簡易エスケープ（旧実装踏襲）
    //    output = output.Replace("'", "''");

    //    return output;
    //}

    #endregion

    #region Base64 Encode / Decode

    /// <summary>
    /// 文字列をカスタマイズした形式で Base64 エンコードします。
    /// ・UTF-8でバイト配列化
    /// ・Base64変換
    /// ・パディング削除
    /// ・文字列を逆順に並び替え
    ///
    /// 主にIDやトークンの難読化用途を想定しています。
    /// </summary>
    /// <param name="origin">元の文字列</param>
    /// <returns>エンコード済み文字列</returns>
    public static string EncodeBase64(string origin)
    {
        if (string.IsNullOrEmpty(origin))
            return string.Empty;

        var bytes = System.Text.Encoding.UTF8.GetBytes(origin);
        var base64 = Convert.ToBase64String(bytes);

        var chars = base64.TrimEnd('=').ToCharArray();
        Array.Reverse(chars);

        return new string(chars);
    }

    /// <summary>
    /// EncodeBase64 でエンコードされた文字列を元に戻します。
    /// </summary>
    /// <param name="encoded">エンコード済み文字列</param>
    /// <returns>復号後の文字列</returns>
    public static string DecodeBase64(string encoded)
    {
        if (string.IsNullOrEmpty(encoded))
            return string.Empty;

        // 逆順に戻す
        var chars = encoded.ToCharArray();
        Array.Reverse(chars);

        var reversed = new string(chars);

        // Base64の長さを4の倍数に調整
        while (reversed.Length % 4 != 0)
            reversed += "=";

        var bytes = Convert.FromBase64String(reversed);
        return System.Text.Encoding.UTF8.GetString(bytes);
    }

    #endregion
}

