using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Infrastructure.VectorSearch;
using EduGraph.Infrastructure.VectorSearch.Models;
using EduGraph.Infrastructure.SQLite;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.GoogleDrive;

#pragma warning disable CA1056
#pragma warning disable CA1054
public static class SearchDocuments
{
    public sealed record Request(string Query);

    public sealed record Response
    {
        public required string Title { get; init; }
        public required string Url { get; init; }
        public string? FolderName { get; init; }
        public required double Score { get; init; }
    }

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(request => request.Query)
                .NotEmpty()
                .Must(query => !string.IsNullOrWhiteSpace(query))
                .WithMessage("Query is required.");
        }
    }

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("users/search-documents", Handle)
                .WithTags("Users")
                .Produces<IReadOnlyCollection<Response>>()
                .ProducesValidationProblem()
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [AsParameters] Request request,
            [FromServices] IValidator<Request> validator,
            [FromServices] VectorSearchService vectorSearchService,
            CancellationToken cancellationToken)
        {
            ValidationResult validateSearchDocumentsRequest = await validator.ValidateAsync(request, cancellationToken);

            if (!validateSearchDocumentsRequest.IsValid)
            {
                return Results.ValidationProblem(validateSearchDocumentsRequest.ToDictionary());
            }

            VectorSearchRequest searchRequest = new()
            {
                Query = request.Query
            };

            Result<IReadOnlyCollection<VectorSearchResult>?> getRelatedDocumentsResult = await vectorSearchService.SearchAsync(
                searchRequest,
                cancellationToken
            );

            if (getRelatedDocumentsResult.IsFailure)
            {
                return getRelatedDocumentsResult.ToHttpFailure();
            }

            List<Response> response = getRelatedDocumentsResult.Value!
                .Select(document => new Response
                {
                    Title = document.Title,
                    Url = document.Url,
                    FolderName = document.FolderName,
                    Score = document.Score
                })
                .ToList();

            return TypedResults.Ok(response);
        }
    }
}
#pragma warning restore CA1056
#pragma warning restore CA1054
