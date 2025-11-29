using System.Reflection;
using EduGraph.Core.Features.Common;

namespace EduGraph.Core.Extensions;

public static class AppExtensions
{
    public static IApplicationBuilder MapEndpoints(this WebApplication app, IEndpointRouteBuilder? routeBuilder = null, Assembly? endpointsAssembly = null)
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
}
