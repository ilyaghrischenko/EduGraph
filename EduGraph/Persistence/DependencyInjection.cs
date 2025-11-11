using Microsoft.EntityFrameworkCore;

namespace EduGraph.Persistence;

public static class DependencyInjection
{
    public static WebApplicationBuilder AddDbContext(this WebApplicationBuilder builder)
    {
        string? connectionString = builder.Configuration["DB_CONNECTION_STRING"];

        if (string.IsNullOrEmpty(connectionString))
        {
            throw new Exception("DB_CONNECTION_STRING is not set");
        }
        
        builder.Services.AddDbContext<EduGraphContext>(options =>
            options.UseSqlite(connectionString));

        return builder;
    }
}