using System.Net;
using System.Net.Http.Json;
using EduGraph.Infrastructure.VectorSearch.Models;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;

namespace EduGraph.Infrastructure.VectorSearch;

public sealed class VectorSearchService(HttpClient httpClient)
{
    public async Task<Result<IReadOnlyCollection<VectorSearchResult>?>> SearchAsync(
        VectorSearchRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await httpClient.PostAsJsonAsync(
                requestUri: "search",
                request,
                cancellationToken
            );

            response.EnsureSuccessStatusCode();

            var relatedDocuments = await response.Content.ReadFromJsonAsync<List<VectorSearchResult>>(cancellationToken);

            return relatedDocuments;
        }
        catch (Exception ex)
        {
            return new ErrorDetails(
                ex.Message,
                HttpStatusCode.InternalServerError
            );
        }
    }
    
    public async Task<Result> UpsertDocumentsAsync(
        VectorUpsertRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await httpClient.PostAsJsonAsync(
                requestUri: "/documents/upsert",
                request,
                cancellationToken
            );

            response.EnsureSuccessStatusCode();

            return Result.Success();
        }
        catch (Exception ex)
        {
            return new ErrorDetails(
                ex.Message,
                HttpStatusCode.InternalServerError
            );
        }
    }

    public async Task<Result> DeleteDocumentsAsync(
        VectorDeleteRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await httpClient.PostAsJsonAsync(
                requestUri: "/documents/delete",
                request,
                cancellationToken
            );

            response.EnsureSuccessStatusCode();
            
            return Result.Success();
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
