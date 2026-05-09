using System.Text.Json.Serialization;

namespace EduGraph.Infrastructure.VectorSearch.Models;

public sealed record VectorDeleteRequest
{
    [property: JsonPropertyName("document_ids")]
    public required IReadOnlyCollection<string> DocumentIds { get; init; }
}
