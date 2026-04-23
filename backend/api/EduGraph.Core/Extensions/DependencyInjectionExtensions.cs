using System.Reflection;
using EduGraph.SharedKernel;
using EduGraph.SharedKernel.Interfaces;

namespace EduGraph.Core.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddTypesToDi(this IServiceCollection services)
    {
        Type[] markerInterfaces = [typeof(IScopedType), typeof(ITransientType), typeof(ISingletonType)];
        
        services.Scan(scan => scan
            .FromApplicationDependencies(assembly => assembly.FullName != null && assembly.FullName.StartsWith("EduGraph.", StringComparison.Ordinal))
            .AddClasses(classes => classes.AssignableTo<IScopedType>(), publicOnly: false)
            .As(t => t.GetInterfaces().Except(markerInterfaces))
            .AsSelf()
            .WithScopedLifetime()
            .AddClasses(classes => classes.AssignableTo<ITransientType>(), publicOnly: false)
            .As(t => t.GetInterfaces().Except(markerInterfaces))
            .AsSelf()
            .WithTransientLifetime()
            .AddClasses(classes => classes.AssignableTo<ISingletonType>(), publicOnly: false)
            .As(t => t.GetInterfaces().Except(markerInterfaces))
            .AsSelf()
            .WithSingletonLifetime()
        );
        
        return services;
    }
}
