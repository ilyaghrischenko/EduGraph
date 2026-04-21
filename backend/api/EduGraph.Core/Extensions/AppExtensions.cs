using System.Reflection;
using EduGraph.Core.Features.Common;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Filters;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Extensions;
using Microsoft.AspNetCore.Identity;

namespace EduGraph.Core.Extensions;

public static class AppExtensions
{
    public static async Task UseConfigurationAsync(this WebApplication app, CancellationToken cancellationToken = default)
    {
        app.UseStaticFiles();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwagger();
            app.UseSwaggerUI();

            app.MapGet("/", context =>
            {
                context.Response.Redirect("/swagger/index.html");
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
        
        var endpointTypes = assembly.GetTypes()
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
        await using var scope = app.Services.CreateAsyncScope();
        var services = scope.ServiceProvider;
        
        var context = services.GetRequiredService<EduGraphContext>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();

        await context.EnsureCreatedAndMigrated(cancellationToken);
        await context.EnsureRolesExistAndValid(roleManager, cancellationToken);
    }
}
