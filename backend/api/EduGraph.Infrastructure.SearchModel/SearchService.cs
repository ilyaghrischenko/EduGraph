using System.Net;
using System.Net.Http.Json;
using EduGraph.Infrastructure.SearchModel.Models;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;

namespace EduGraph.Infrastructure.SearchModel;

public sealed class SearchService(HttpClient httpClient) : IScopedType
{
    public async Task<Result<IReadOnlyCollection<Document>?>> GetRelatedDocumentsByQueryAsync(
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

            var documents = await response.Content.ReadFromJsonAsync<List<Document>>(cancellationToken);

            return documents;
        }
        catch (Exception ex)
        {
            return new ErrorDetails(
                ex.Message,
                HttpStatusCode.InternalServerError
            );
        }
    }
}
