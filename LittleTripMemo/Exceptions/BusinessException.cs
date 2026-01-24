namespace LittleTripMemo.Exceptions;

/// <summary>
/// 業務上のルール違反（例：日付の逆転など）を通知するための例外。
/// この例外を投げると、共通処理が自動でキャッチして 400 Bad Request を返します。
/// </summary>
// Exceptions/BusinessException.cs

public class BusinessException : Exception
{
    public string? ErrorCode { get; init; }

    public BusinessException(string message, string? errorCode = null)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    /// <summary>
    /// 条件が真の場合に BusinessException をスローする（ガード節）
    /// </summary>
    public static void ThrowIf(bool condition, string message, string? errorCode = null)
    {
        if (condition) throw new BusinessException(message, errorCode);
    }
}


