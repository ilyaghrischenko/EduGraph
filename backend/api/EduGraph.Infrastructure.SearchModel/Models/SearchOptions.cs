namespace EduGraph.Infrastructure.SearchModel.Models;

public sealed record SearchOptions
{
    public required string Query { get; init; }
    public required IReadOnlyCollection<Document> Documents { get; init; }
}
