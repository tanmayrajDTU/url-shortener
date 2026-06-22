using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using UrlShortener.Data;
using UrlShortener.DTOs;
using UrlShortener.Models;

namespace UrlShortener.Services;

public interface IUrlService
{
    Task<UrlResponse?> CreateShortUrlAsync(CreateUrlRequest request, string baseUrl, string? ipAddress, string ownerToken);
    Task<ShortenedUrl?> ResolveShortCodeAsync(string shortCode);
    Task<UrlResponse?> GetUrlByCodeAsync(string shortCode, string baseUrl, string ownerToken);
    Task<AnalyticsResponse?> GetAnalyticsAsync(string shortCode, string ownerToken);
    Task RecordClickAsync(Guid urlId, HttpRequest request);
    Task<IEnumerable<UrlResponse>> GetAllUrlsAsync(string baseUrl, string ownerToken);
    Task<bool> DeleteUrlAsync(string shortCode, string ownerToken);
}

public class UrlService(AppDbContext db, IDistributedCache cache) : IUrlService
{
    private static readonly string Alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static readonly Random Rng = Random.Shared;

    public async Task<UrlResponse?> CreateShortUrlAsync(CreateUrlRequest request, string baseUrl, string? ipAddress, string ownerToken)
    {
        if (!Uri.TryCreate(request.OriginalUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return null;

        string shortCode = request.CustomAlias?.Trim() ?? await GenerateUniqueCodeAsync();

        if (await db.ShortenedUrls.AnyAsync(u => u.ShortCode == shortCode))
            throw new InvalidOperationException($"Short code '{shortCode}' is already taken.");

        var url = new ShortenedUrl
        {
            OriginalUrl = request.OriginalUrl,
            ShortCode = shortCode,
            CustomAlias = request.CustomAlias,
            ExpiresAt = request.ExpiresAt?.ToUniversalTime(),
            CreatedByIp = ipAddress,
            OwnerToken = ownerToken
        };

        db.ShortenedUrls.Add(url);
        await db.SaveChangesAsync();

        // Cache immediately
        await CacheUrlAsync(url);

        return MapToResponse(url, baseUrl, 0);
    }

    public async Task<ShortenedUrl?> ResolveShortCodeAsync(string shortCode)
    {
        // 1. Try Redis cache first
        var cacheKey = $"url:{shortCode}";
        var cached = await cache.GetStringAsync(cacheKey);
        if (cached is not null)
        {
            var url = JsonSerializer.Deserialize<ShortenedUrl>(cached);
            if (url is null) return null;
            if (url.ExpiresAt.HasValue && url.ExpiresAt < DateTime.UtcNow) return null;
            return url;
        }

        // 2. Cache miss – query DB
        var dbUrl = await db.ShortenedUrls.FirstOrDefaultAsync(u => u.ShortCode == shortCode && u.IsActive);
        if (dbUrl is null) return null;
        if (dbUrl.ExpiresAt.HasValue && dbUrl.ExpiresAt < DateTime.UtcNow) return null;

        await CacheUrlAsync(dbUrl);
        return dbUrl;
    }

    public async Task<UrlResponse?> GetUrlByCodeAsync(string shortCode, string baseUrl, string ownerToken)
    {
        var url = await db.ShortenedUrls
            .Include(u => u.ClickEvents)
            .FirstOrDefaultAsync(u => u.ShortCode == shortCode && u.OwnerToken == ownerToken);
        if (url is null) return null;
        return MapToResponse(url, baseUrl, url.ClickEvents.Count);
    }

    public async Task<AnalyticsResponse?> GetAnalyticsAsync(string shortCode, string ownerToken)
    {
        var url = await db.ShortenedUrls
            .Include(u => u.ClickEvents)
            .FirstOrDefaultAsync(u => u.ShortCode == shortCode && u.OwnerToken == ownerToken);
        if (url is null) return null;

        var clicks = url.ClickEvents.ToList();

        var byDay = clicks
            .GroupBy(c => c.ClickedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new DailyClickDto(g.Key.ToString("yyyy-MM-dd"), g.Count()))
            .ToList();

        var byBrowser = clicks
            .GroupBy(c => c.Browser ?? "Unknown")
            .Select(g => new BrowserStatDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var byOs = clicks
            .GroupBy(c => c.Os ?? "Unknown")
            .Select(g => new OsStatDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var topReferers = clicks
            .Where(c => !string.IsNullOrEmpty(c.Referer))
            .GroupBy(c => c.Referer!)
            .Select(g => new RefererStatDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();

        return new AnalyticsResponse(
            url.Id,
            url.ShortCode,
            url.OriginalUrl,
            clicks.Count,
            byDay,
            byBrowser,
            byOs,
            topReferers,
            clicks.Count(c => c.IsMobile),
            clicks.Count(c => !c.IsMobile)
        );
    }

    public async Task RecordClickAsync(Guid urlId, HttpRequest request)
    {
        var ua = request.Headers.UserAgent.ToString();
        UAParser.ClientInfo? parsed = null;
        try { parsed = UAParser.Parser.GetDefault().Parse(ua); } catch { }

        var click = new ClickEvent
        {
            ShortenedUrlId = urlId,
            IpAddress = request.HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = ua.Length > 512 ? ua[..512] : ua,
            Referer = request.Headers.Referer.ToString(),
            Browser = parsed?.UA.Family ?? "Unknown",
            Os = parsed?.OS.Family ?? "Unknown",
            IsMobile = ua.Contains("Mobile", StringComparison.OrdinalIgnoreCase)
        };

        db.ClickEvents.Add(click);
        await db.SaveChangesAsync();
    }

    public async Task<IEnumerable<UrlResponse>> GetAllUrlsAsync(string baseUrl, string ownerToken)
    {
        var urls = await db.ShortenedUrls
            .Include(u => u.ClickEvents)
            .Where(u => u.OwnerToken == ownerToken)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return urls.Select(u => MapToResponse(u, baseUrl, u.ClickEvents.Count));
    }

    public async Task<bool> DeleteUrlAsync(string shortCode, string ownerToken)
    {
        var url = await db.ShortenedUrls
            .FirstOrDefaultAsync(u => u.ShortCode == shortCode && u.OwnerToken == ownerToken);
        if (url is null) return false;

        db.ShortenedUrls.Remove(url);
        await db.SaveChangesAsync();
        await cache.RemoveAsync($"url:{shortCode}");
        return true;
    }

    // --- Helpers ---

    private async Task<string> GenerateUniqueCodeAsync()
    {
        string code;
        do
        {
            code = new string(Enumerable.Range(0, 7).Select(_ => Alphabet[Rng.Next(Alphabet.Length)]).ToArray());
        } while (await db.ShortenedUrls.AnyAsync(u => u.ShortCode == code));
        return code;
    }

    private async Task CacheUrlAsync(ShortenedUrl url)
    {
        var options = new DistributedCacheEntryOptions();
        if (url.ExpiresAt.HasValue)
            options.SetAbsoluteExpiration(url.ExpiresAt.Value);
        else
            options.SetSlidingExpiration(TimeSpan.FromHours(24));

        await cache.SetStringAsync(
            $"url:{url.ShortCode}",
            JsonSerializer.Serialize(url),
            options
        );
    }

    private static UrlResponse MapToResponse(ShortenedUrl url, string baseUrl, int clicks) =>
        new(url.Id, url.OriginalUrl, url.ShortCode,
            $"{baseUrl}/{url.ShortCode}", url.CreatedAt, url.ExpiresAt, url.IsActive, clicks);
}
