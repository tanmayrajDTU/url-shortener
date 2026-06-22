namespace UrlShortener.Models;

public class ShortenedUrl
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OriginalUrl { get; set; } = string.Empty;
    public string ShortCode { get; set; } = string.Empty;
    public string? CustomAlias { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? CreatedByIp { get; set; }
    public string OwnerToken { get; set; } = string.Empty; // opaque client token, scopes dashboard access
    public ICollection<ClickEvent> ClickEvents { get; set; } = new List<ClickEvent>();
}

public class ClickEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ShortenedUrlId { get; set; }
    public ShortenedUrl ShortenedUrl { get; set; } = null!;
    public DateTime ClickedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referer { get; set; }
    public string? Country { get; set; }
    public string? Browser { get; set; }
    public string? Os { get; set; }
    public bool IsMobile { get; set; }
}
