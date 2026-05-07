using System.Text.Json.Serialization;

namespace EduGraph.Infrastructure.VectorSearch.Models;

public sealed record VectorUpsertRequest
{
    [property: JsonPropertyName("documents")]
    public required IReadOnlyList<VectorDocumentDto> Documents { get; init; }
}
