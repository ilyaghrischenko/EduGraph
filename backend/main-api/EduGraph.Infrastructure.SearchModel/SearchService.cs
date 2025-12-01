using System.Net.Http.Json;
using EduGraph.Domain.Models;
using EduGraph.Infrastructure.SearchModel.Models;

namespace EduGraph.Infrastructure.SearchModel;

public sealed class SearchService(HttpClient httpClient)
{
    public async Task<Result<IReadOnlyCollection<ResponseDocument>?>> GetDocumentsByQueryAsync(
        SearchQueryRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var payload = new
            {
                request.Query,
                request.Documents
            };
            
            var response = await httpClient.PostAsJsonAsync("search", payload, cancellationToken);

            response.EnsureSuccessStatusCode();

            var documents = await response.Content.ReadFromJsonAsync<IReadOnlyCollection<ResponseDocument>>(cancellationToken);

            return Result<IReadOnlyCollection<ResponseDocument>?>.Success(documents);
        }
        catch (Exception ex)
        {
            return Result<IReadOnlyCollection<ResponseDocument>?>.Failure(ex.Message);
        }
    }
}
