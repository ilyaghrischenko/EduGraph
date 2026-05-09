using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;

namespace EduGraph.Infrastructure.VectorSearch.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddVectorSearchApiService(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient<VectorSearchService>(client =>
        {
            string vectorSearchApiUrl = configuration["VectorSearch:BaseUrl"]
                                        ?? throw new InvalidOperationException("Vector search API URL is not configured.");
            
            client.BaseAddress = new Uri(vectorSearchApiUrl);
            client.Timeout = Timeout.InfiniteTimeSpan;
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
