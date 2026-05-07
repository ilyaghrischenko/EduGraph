using System.Text.Json.Serialization;

namespace EduGraph.Infrastructure.VectorSearch.Models;

#pragma warning disable CA1056
public sealed record VectorSearchResult
{
    [property: JsonPropertyName("document_id")]
    public required string DocumentId { get; init; }
    
    [property: JsonPropertyName("title")]
    public required string Title { get; init; }
    
    [property: JsonPropertyName("content")]
    public required string Content { get; init; }
    
    [property: JsonPropertyName("url")]
    public required string Url { get; init; }
    
    [property: JsonPropertyName("folder_name")]
    public required string FolderName { get; init; }
    
    [property: JsonPropertyName("score")]
    public required double Score { get; init; }
}
#pragma warning restore CA1056
