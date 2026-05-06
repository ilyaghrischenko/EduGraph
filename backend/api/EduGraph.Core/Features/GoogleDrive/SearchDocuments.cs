using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Infrastructure.SearchModel;
using EduGraph.Infrastructure.SearchModel.Models;
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

    public sealed record Response(string Title, string Url);

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
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            ValidationResult validateSearchDocumentsRequest = await validator.ValidateAsync(request, cancellationToken);

            if (!validateSearchDocumentsRequest.IsValid)
            {
                return Results.ValidationProblem(validateSearchDocumentsRequest.ToDictionary());
            }

            Result<IReadOnlyCollection<Response>> searchDocumentsResult = await handler.HandleAsync(request, cancellationToken);

            if (searchDocumentsResult.IsFailure)
            {
                return searchDocumentsResult.ToHttpFailure();
            }

            return TypedResults.Ok(searchDocumentsResult.Value);
        }
    }

    public sealed class Handler(
        EduGraphContext db,
        SearchService searchService) : IScopedType
    {
        public async Task<Result<IReadOnlyCollection<Response>>> HandleAsync(
            Request request,
            CancellationToken cancellationToken)
        {
            List<Document> documents = await db.UniversityDocuments
                .AsNoTracking()
                .Select(document => new Document
                {
                    Title = document.Name,
                    Content = document.Content,
                    Url = document.Link
                })
                .ToListAsync(cancellationToken);

            SearchOptions searchOptions = new()
            {
                Query = request.Query,
                Documents = documents
            };

            Result<IReadOnlyCollection<Document>?> getRelatedDocumentsByQueryResult = await searchService.GetRelatedDocumentsByQueryAsync(
                searchOptions,
                cancellationToken
            );

            if (getRelatedDocumentsByQueryResult.IsFailure)
            {
                return Result<IReadOnlyCollection<Response>>.Failure(getRelatedDocumentsByQueryResult);
            }

            if (getRelatedDocumentsByQueryResult.Value is null
                || getRelatedDocumentsByQueryResult.Value.Count == 0)
            {
                return Result<IReadOnlyCollection<Response>>.Success([]);
            }

            List<Response> response = getRelatedDocumentsByQueryResult.Value
                .Select(document => new Response(document.Title, document.Url))
                .ToList();

            return response;
        }
    }
}
#pragma warning restore CA1056
#pragma warning restore CA1054
