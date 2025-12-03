namespace EduGraph.Infrastructure.SearchModel.Models;

public sealed record SearchOptions(string Query, IReadOnlyCollection<Document> Documents);
