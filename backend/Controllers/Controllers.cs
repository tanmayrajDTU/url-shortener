using Microsoft.AspNetCore.Mvc;
using UrlShortener.DTOs;
using UrlShortener.Services;

namespace UrlShortener.Controllers;

[ApiController]
[Route("api/urls")]
public class UrlsController(IUrlService urlService) : ControllerBase
{
    private string BaseUrl => $"{Request.Scheme}://{Request.Host}";

    // Reads X-Owner-Token header; returns 400 if missing or invalid format
    private string? OwnerToken
    {
        get
        {
            var token = Request.Headers["X-Owner-Token"].FirstOrDefault();
            // Must be a non-empty string up to 64 chars (UUID is 36)
            if (string.IsNullOrWhiteSpace(token) || token.Length > 64) return null;
            return token;
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUrlRequest request)
    {
        var token = OwnerToken;
        if (token is null) return BadRequest(new { error = "X-Owner-Token header is required." });

        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await urlService.CreateShortUrlAsync(request, BaseUrl, ip, token);
            if (result is null) return BadRequest(new { error = "Invalid URL provided." });
            return CreatedAtAction(nameof(GetByCode), new { code = result.ShortCode }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var token = OwnerToken;
        if (token is null) return BadRequest(new { error = "X-Owner-Token header is required." });

        var result = await urlService.GetUrlByCodeAsync(code, BaseUrl, token);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{code}/analytics")]
    public async Task<IActionResult> GetAnalytics(string code)
    {
        var token = OwnerToken;
        if (token is null) return BadRequest(new { error = "X-Owner-Token header is required." });

        var result = await urlService.GetAnalyticsAsync(code, token);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{code}")]
    public async Task<IActionResult> Delete(string code)
    {
        var token = OwnerToken;
        if (token is null) return BadRequest(new { error = "X-Owner-Token header is required." });

        var deleted = await urlService.DeleteUrlAsync(code, token);
        if (!deleted) return NotFound(); // also covers "exists but belongs to someone else"
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var token = OwnerToken;
        if (token is null) return BadRequest(new { error = "X-Owner-Token header is required." });

        var urls = await urlService.GetAllUrlsAsync(BaseUrl, token);
        return Ok(urls);
    }
}

[ApiController]
[Route("")]
public class RedirectController(IUrlService urlService) : ControllerBase
{
    [HttpGet("{code}")]
    public async Task<IActionResult> Redirect(string code)
    {
        // Redirect is public — no owner token needed
        var url = await urlService.ResolveShortCodeAsync(code);
        if (url is null) return NotFound(new { error = "Short URL not found or expired." });

        _ = urlService.RecordClickAsync(url.Id, Request);

        return RedirectPermanent(url.OriginalUrl);
    }
}

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow
        });
    }
}
