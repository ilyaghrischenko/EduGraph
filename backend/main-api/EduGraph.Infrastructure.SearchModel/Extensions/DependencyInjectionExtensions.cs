using Microsoft.Extensions.DependencyInjection;

namespace EduGraph.Infrastructure.SearchModel.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddSearchService(this IServiceCollection services, string baseUrl)
    {
        services.AddHttpClient<SearchService>(client =>
        {
            client.BaseAddress = new Uri(baseUrl);
        })
        .AddStandardResilienceHandler();
        
        return services;
    }

    public static IServiceCollection AddSearchService(this IServiceCollection services, Uri baseUrl)
    {
        services.AddHttpClient<SearchService>(client =>
            {
                client.BaseAddress = baseUrl;
            })
            .AddStandardResilienceHandler();
        
        return services;
    }
}
