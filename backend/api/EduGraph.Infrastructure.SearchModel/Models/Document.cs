namespace EduGraph.Infrastructure.SearchModel.Models;

#pragma warning disable CA1056
public sealed record Document
{
    public required string Title { get; init; }
    public required string Content { get; init; }
    public required string Url { get; init; }
}
#pragma warning restore CA1056
