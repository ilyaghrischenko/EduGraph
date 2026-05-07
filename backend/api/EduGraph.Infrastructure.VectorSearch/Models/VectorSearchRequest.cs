using System.Text.Json.Serialization;

namespace EduGraph.Infrastructure.VectorSearch.Models;

public sealed record VectorSearchRequest
{
    [property: JsonPropertyName("query")]
    public required string Query { get; init; }
    
    [property: JsonPropertyName("top_k")]
    public int TopK { get; init; } = 5;
    
    [property: JsonPropertyName("min_score")]
    public double MinScore { get; init; } = 0.81;
}
