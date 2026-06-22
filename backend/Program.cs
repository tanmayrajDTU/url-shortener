using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using UrlShortener.Data;
using UrlShortener.Middleware;
using UrlShortener.Services;

var builder = WebApplication.CreateBuilder(args);

// ── PostgreSQL ────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Redis ─────────────────────────────────────────────────────────────────────
var redisConn = builder.Configuration.GetConnectionString("Redis");

if (!string.IsNullOrEmpty(redisConn))
{
    Console.WriteLine($"Redis: {redisConn}");
    // IConnectionMultiplexer — used by rate limiter (needs raw Redis commands / Lua)
    var options = ConfigurationOptions.Parse(redisConn);
    options.AbortOnConnectFail = false;
    options.ConnectRetry = 3;

    builder.Services.AddSingleton<IConnectionMultiplexer>(
        ConnectionMultiplexer.Connect(options));

    // IDistributedCache — used by UrlService for URL caching
    builder.Services.AddStackExchangeRedisCache(o => o.Configuration = redisConn);
}
else
{
    // Local dev fallback: no Redis needed
    // Rate limiter will log a warning and fail open; cache uses in-memory
    builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    {
        // Returns a disconnected multiplexer — rate limiter catches the exception and fails open
        return ConnectionMultiplexer.Connect("localhost:6379,abortConnect=false");
    });
    builder.Services.AddDistributedMemoryCache();
}

// ── App services ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IUrlService, UrlService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "URL Shortener API", Version = "v1",
        Description = "Distributed URL shortener with Redis caching and rate limiting." });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                      ?? ["http://localhost:5173", "http://localhost:3000"];
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().WithExposedHeaders(
            "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After");
    });
});

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// Auto-migrate on startup (safe for Railway — idempotent)
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"Migration failed: {ex}");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow
    });
});

app.MapControllers();
app.UseCors();
app.UseHttpsRedirection();

// Rate limiter sits before controllers — applies to every request
app.UseRedisRateLimiter();

app.MapControllers();
app.Run();
