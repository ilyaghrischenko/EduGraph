using System.Reflection;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Extensions;
using EduGraph.ServiceDefaults;
using Microsoft.AspNetCore.Identity;
using Scalar.AspNetCore;

namespace EduGraph.Core.Extensions;

public static class AppExtensions
{
    public static async Task UseConfigurationAsync(this WebApplication app, CancellationToken cancellationToken = default)
    {
        app.MapDefaultEndpoints();
        
        app.UseStaticFiles();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();

            app.MapScalarApiReference(options =>
            {
                options.Theme = ScalarTheme.Mars;
            });

            app.MapGet("/", context =>
            {
                context.Response.Redirect("/scalar/v1");
                return Task.CompletedTask;
            });
        }

        app.UseHttpsRedirection();
        app.MapStaticAssets();
        app.UseRouting();

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseResponseCompression();

        app.UseCors("AllowReactDevClient");

        var apiGroup = app.MapGroup("api");
        app.MapEndpoints(apiGroup);

        await app.EnsureDatabaseIsOk(cancellationToken);
    }
    
    private static WebApplication MapEndpoints(this WebApplication app, IEndpointRouteBuilder? routeBuilder = null, Assembly? assemblyToScan = null)
    {
        IEndpointRouteBuilder endpoints = routeBuilder ?? app;

        Assembly assembly = assemblyToScan ?? Assembly.GetExecutingAssembly();
        
        IEnumerable<Type> endpointTypes = assembly.GetTypes()
            .Where(t => typeof(IEndpoint).IsAssignableFrom(t)
                        && t is { IsInterface: false, IsAbstract: false, IsNested: true });

        foreach (Type type in endpointTypes)
        {
            if (Activator.CreateInstance(type) is IEndpoint endpoint)
            {
                endpoint.MapEndpoint(endpoints);
            }
        }

        return app;
    }

    private static async Task EnsureDatabaseIsOk(this WebApplication app, CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = app.Services.CreateAsyncScope();
        IServiceProvider services = scope.ServiceProvider;
        
        var context = services.GetRequiredService<EduGraphContext>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();

        await context.EnsureCreatedAndMigrated(cancellationToken);
        await context.EnsureRolesExistAndValid(roleManager, cancellationToken);
    }
}
