# Migrations

Run these commands from the `backend/` directory to create and apply migrations:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Or let the app auto-migrate on startup (already configured in Program.cs for Railway).
