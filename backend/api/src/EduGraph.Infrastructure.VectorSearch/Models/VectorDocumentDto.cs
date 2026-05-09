using System.Text.Json.Serialization;

namespace EduGraph.Infrastructure.VectorSearch.Models;

public sealed record VectorDocumentDto
{
    [property: JsonPropertyName("id")]
    public required string Id { get; init; }

    [property: JsonPropertyName("title")]
    public required string Title { get; init; }

    [property: JsonPropertyName("content")]
    public required string Content { get; init; }

    [property: JsonPropertyName("url")]
#pragma warning disable CA1056
    public required string Url { get; init; }
#pragma warning restore CA1056

    [property: JsonPropertyName("content_hash")]
    public required string ContentHash { get; init; }

    [property: JsonPropertyName("folder_name")]
    public string? FolderName { get; init; }
}
