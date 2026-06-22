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
var redisHost = builder.Configuration["REDIS_HOST"];
var redisPort = builder.Configuration["REDIS_PORT"];
var redisPassword = builder.Configuration["REDIS_PASSWORD"];

if (!string.IsNullOrEmpty(redisHost))
{
    var options = new ConfigurationOptions
    {
        AbortOnConnectFail = false,
        ConnectRetry = 3,
        Password = redisPassword
    };

    options.EndPoints.Add(
        redisHost,
        int.Parse(redisPort ?? "6379")
    );

    builder.Services.AddSingleton<IConnectionMultiplexer>(
        ConnectionMultiplexer.Connect(options));

    builder.Services.AddStackExchangeRedisCache(o =>
    {
        o.ConfigurationOptions = options;
    });
}
else
{
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
// try
// {
//     using var scope = app.Services.CreateScope();
//     var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

//     Console.WriteLine("Before migration");
//     await db.Database.MigrateAsync();
//     Console.WriteLine("After migration");
// }
// catch (Exception ex)
// {
//     Console.WriteLine(ex);
// }

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors();
//app.UseHttpsRedirection();
app.UseRedisRateLimiter();

app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow
    });
});

app.MapControllers();

app.Run();
