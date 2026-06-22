using Microsoft.EntityFrameworkCore;
using UrlShortener.Models;

namespace UrlShortener.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ShortenedUrl> ShortenedUrls => Set<ShortenedUrl>();
    public DbSet<ClickEvent> ClickEvents => Set<ClickEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShortenedUrl>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ShortCode).IsUnique();
            e.HasIndex(x => x.OwnerToken); // for filtering dashboard by owner
            e.Property(x => x.OwnerToken).HasMaxLength(64);
            e.Property(x => x.ShortCode).HasMaxLength(20);
            e.Property(x => x.OriginalUrl).HasMaxLength(2048);
            e.Property(x => x.CustomAlias).HasMaxLength(50);
            e.HasMany(x => x.ClickEvents)
             .WithOne(x => x.ShortenedUrl)
             .HasForeignKey(x => x.ShortenedUrlId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClickEvent>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ShortenedUrlId);
            e.HasIndex(x => x.ClickedAt);
            e.Property(x => x.IpAddress).HasMaxLength(45);
            e.Property(x => x.Browser).HasMaxLength(100);
            e.Property(x => x.Os).HasMaxLength(100);
        });
    }
}
