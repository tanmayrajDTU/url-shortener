using StackExchange.Redis;

namespace UrlShortener.Middleware;

/// <summary>
/// Redis-backed sliding window rate limiter.
/// Uses a sorted set per key: members are request timestamps (ms).
/// On each request we atomically:
///   1. Remove entries older than the window
///   2. Count remaining entries
///   3. If under limit, add current timestamp and allow
///   4. Otherwise reject with 429
/// This is accurate across multiple API instances — unlike in-process limiters.
/// </summary>
public class RateLimiterMiddleware(RequestDelegate next, IConnectionMultiplexer redis, ILogger<RateLimiterMiddleware> logger)
{
    private record RateLimitRule(string Prefix, int WindowSecs, int MaxRequests);

    private static readonly List<RateLimitRule> Rules =
    [
        new("/api/urls",  60, 10),  // create/manage: 10 rpm per identity
        new("/",          60, 60),  // redirects: 60 rpm per IP
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "/";

        // Analytics is DB-heavy — tighter limit regardless of path rule
        bool isAnalytics = path.Contains("/analytics", StringComparison.OrdinalIgnoreCase);
        var rule = GetRule(path);
        int windowSecs  = isAnalytics ? 60  : rule.WindowSecs;
        int maxRequests = isAnalytics ? 30  : rule.MaxRequests;

        // Composite key: IP + owner token so NAT/VPN users don't share a bucket
        var ip    = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var token = context.Request.Headers["X-Owner-Token"].FirstOrDefault() ?? "anon";
        var bucket = path.Split('/', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "root";
        var key   = $"rl:{ip}:{token}:{bucket}";

        var (allowed, remaining, retryAfter) = await SlidingWindowAsync(key, windowSecs, maxRequests);

        context.Response.Headers["X-RateLimit-Limit"]     = maxRequests.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, remaining).ToString();
        context.Response.Headers["X-RateLimit-Reset"]     = retryAfter.ToString();

        if (!allowed)
        {
            logger.LogWarning("Rate limit exceeded: key={Key}", key);
            context.Response.StatusCode  = StatusCodes.Status429TooManyRequests;
            context.Response.Headers["Retry-After"] = retryAfter.ToString();
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                $"{{\"error\":\"Too many requests. Retry after {retryAfter}s.\",\"retryAfterSeconds\":{retryAfter}}}");
            return;
        }

        await next(context);
    }

    private async Task<(bool Allowed, int Remaining, int RetryAfter)> SlidingWindowAsync(
        string key, int windowSecs, int maxRequests)
    {
        try
        {
            var db       = redis.GetDatabase();
            var now      = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var windowMs = windowSecs * 1000L;

            // Lua runs atomically on Redis — safe across horizontally scaled instances
            const string lua = @"
local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit    = tonumber(ARGV[3])
local expire   = tonumber(ARGV[4])

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now .. '-' .. math.random(1,999999))
    redis.call('EXPIRE', key, expire)
    return {1, limit - count - 1}
else
    return {0, 0}
end";

            var result = (RedisValue[]) await db.ScriptEvaluateAsync(
                lua,
                keys:   [new RedisKey(key)],
                values: [(RedisValue)now, (RedisValue)windowMs,
                         (RedisValue)maxRequests, (RedisValue)(windowSecs + 1)]
            );

            bool allowed   = (int)result[0] == 1;
            int  remaining = (int)result[1];
            return (allowed, remaining, allowed ? 0 : windowSecs);
        }
        catch (Exception ex)
        {
            // Fail open: if Redis is down, don't take the API down with it
            logger.LogError(ex, "Rate limiter Redis error — failing open. Key={Key}", key);
            return (true, -1, 0);
        }
    }

    private static RateLimitRule GetRule(string path)
    {
        foreach (var rule in Rules)
            if (path.StartsWith(rule.Prefix, StringComparison.OrdinalIgnoreCase))
                return rule;
        return new RateLimitRule("/", 60, 60);
    }
}

public static class RateLimiterExtensions
{
    public static IApplicationBuilder UseRedisRateLimiter(this IApplicationBuilder app)
        => app.UseMiddleware<RateLimiterMiddleware>();
}
