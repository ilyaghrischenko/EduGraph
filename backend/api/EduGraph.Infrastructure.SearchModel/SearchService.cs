using System.Net;
using System.Net.Http.Json;
using EduGraph.Domain.Models;
using EduGraph.Infrastructure.SearchModel.Models;

namespace EduGraph.Infrastructure.SearchModel;

public sealed class SearchService(HttpClient httpClient)
{
    public async Task<Result<IReadOnlyCollection<Document>?>> GetDocumentsByQueryAsync(
        SearchOptions options,
        CancellationToken cancellationToken)
    {
        try
        {
            var payload = new
            {
                options.Query,
                options.Documents
            };
            
            var response = await httpClient.PostAsJsonAsync("search", payload, cancellationToken);

            response.EnsureSuccessStatusCode();

            var documents = await response.Content.ReadFromJsonAsync<IReadOnlyCollection<Document>>(cancellationToken);

            return Result<IReadOnlyCollection<Document>?>.Success(documents);
        }
        catch (Exception ex)
        {
            return Result<IReadOnlyCollection<Document>?>.Failure(ex.Message, HttpStatusCode.InternalServerError);
        }
    }
}
