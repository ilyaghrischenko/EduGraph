using System.Reflection;
using EduGraph.SharedKernel;
using EduGraph.SharedKernel.Interfaces;

namespace EduGraph.Core.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddTypesToDi(this IServiceCollection services, Assembly? assemblyToScan = null)
    {
        Assembly assembly = assemblyToScan ?? Assembly.GetExecutingAssembly();
        
        Type[] markerInterfaces = [typeof(IScopedType), typeof(ITransientType), typeof(ISingletonType)];

        services.Scan(scan => scan
            .FromAssemblies(assembly)
            .AddClasses(classes => classes.AssignableTo<IScopedType>())
                .As(t => t.GetInterfaces().Except(markerInterfaces))
                .AsSelf()
                .WithScopedLifetime()
            .AddClasses(classes => classes.AssignableTo<ITransientType>())
                .As(t => t.GetInterfaces().Except(markerInterfaces))
                .AsSelf()
                .WithTransientLifetime()
            .AddClasses(classes => classes.AssignableTo<ISingletonType>())
                .As(t => t.GetInterfaces().Except(markerInterfaces))
                .AsSelf()
                .WithSingletonLifetime()
        );
        
        return services;
    }
}
