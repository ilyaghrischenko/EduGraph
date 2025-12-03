using System.Reflection;
using EduGraph.Core.Features.Common;
using EduGraph.Core.Filters;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Extensions;
using Microsoft.AspNetCore.Identity;

namespace EduGraph.Core.Extensions;

public static class AppExtensions
{
    public static async Task UseConfigurationAsync(this WebApplication app)
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

        app.UseCors("AllowReactClient");

        var apiGroup = app.MapGroup("api");
        app.MapEndpoints(apiGroup);

        await app.EnsureDatabaseIsOk();
    }
    
    private static WebApplication MapEndpoints(this WebApplication app, IEndpointRouteBuilder? routeBuilder = null, Assembly? endpointsAssembly = null)
    {
        IEndpointRouteBuilder endpoints = routeBuilder ?? app;

        Assembly assembly = endpointsAssembly ?? typeof(AppExtensions).Assembly;
        
        var endpointTypes = assembly.GetTypes()
            .Where(t => typeof(IEndpoint).IsAssignableFrom(t)
                        && t is { IsInterface: false, IsAbstract: false });

        foreach (var type in endpointTypes)
        {
            if (Activator.CreateInstance(type) is IEndpoint endpoint)
            {
                endpoint.MapEndpoint(endpoints);
            }
        }

        return app;
    }

    private static async Task EnsureDatabaseIsOk(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var services = scope.ServiceProvider;
        
        var context = services.GetRequiredService<EduGraphContext>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();

        await context.EnsureCreatedAndMigrated();
        await context.EnsureRolesExistAndValid(roleManager);
    }
    
    public static RouteHandlerBuilder WithRequestValidation<TRequest>(this RouteHandlerBuilder builder)
    {
        return builder.AddEndpointFilter<ValidationFilter<TRequest>>()
            .ProducesValidationProblem();
    }
}
