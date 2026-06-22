namespace UrlShortener.DTOs;

public record CreateUrlRequest(
    string OriginalUrl,
    string? CustomAlias,
    DateTime? ExpiresAt
);

public record UrlResponse(
    Guid Id,
    string OriginalUrl,
    string ShortCode,
    string ShortUrl,
    DateTime CreatedAt,
    DateTime? ExpiresAt,
    bool IsActive,
    int TotalClicks
);

public record AnalyticsResponse(
    Guid Id,
    string ShortCode,
    string OriginalUrl,
    int TotalClicks,
    IEnumerable<DailyClickDto> ClicksByDay,
    IEnumerable<BrowserStatDto> ClicksByBrowser,
    IEnumerable<OsStatDto> ClicksByOs,
    IEnumerable<RefererStatDto> TopReferers,
    int MobileClicks,
    int DesktopClicks
);

public record DailyClickDto(string Date, int Clicks);
public record BrowserStatDto(string Browser, int Count);
public record OsStatDto(string Os, int Count);
public record RefererStatDto(string Referer, int Count);
