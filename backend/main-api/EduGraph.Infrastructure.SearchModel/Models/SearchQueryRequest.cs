namespace EduGraph.Infrastructure.SearchModel.Models;

public sealed record SearchQueryRequest(string Query, IReadOnlyCollection<RequestDocument> Documents);
