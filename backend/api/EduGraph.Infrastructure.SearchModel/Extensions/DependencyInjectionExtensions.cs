using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;

namespace EduGraph.Infrastructure.SearchModel.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddSearchService(this IServiceCollection services, string baseUrl)
    {
        services.AddHttpClient<SearchService>(client =>
        {
            client.BaseAddress = new Uri(baseUrl);
        })
        .AddStandardResilienceHandler(options =>
        {
            options.AttemptTimeout.Timeout = TimeSpan.FromMinutes(5);
            options.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(16);
            options.CircuitBreaker.SamplingDuration = TimeSpan.FromMinutes(10);
        });
        
        return services;
    }

    public static IServiceCollection AddSearchService(this IServiceCollection services, Uri baseUrl)
    {
        services.AddHttpClient<SearchService>(client =>
        {
            client.BaseAddress = baseUrl;
        })
        .AddStandardResilienceHandler(options =>
        {
            options.AttemptTimeout.Timeout = TimeSpan.FromMinutes(5);
            options.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(16);
            options.CircuitBreaker.SamplingDuration = TimeSpan.FromMinutes(10);
        });
        
        return services;
    }
}
