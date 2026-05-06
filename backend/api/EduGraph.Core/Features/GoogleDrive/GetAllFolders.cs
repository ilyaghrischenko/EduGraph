using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Infrastructure.GoogleDrive;
using EduGraph.Infrastructure.GoogleDrive.Models;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.GoogleDrive;

#pragma warning disable CA1056
#pragma warning disable CA1054
public static class GetAllFolders
{
    public sealed record Response(string Id, string Name, string Link);

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("users/folders", Handle)
                .WithTags("Users")
                .Produces<IReadOnlyCollection<Response>>()
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            Result<IReadOnlyCollection<Response>> getAllFoldersResult = await handler.HandleAsync(cancellationToken);

            if (getAllFoldersResult.IsFailure)
            {
                return getAllFoldersResult.ToHttpFailure();
            }

            return TypedResults.Ok(getAllFoldersResult.Value);
        }
    }

    public sealed class Handler(
        GoogleDriveService googleDriveService) : IScopedType
    {
        public async Task<Result<IReadOnlyCollection<Response>>> HandleAsync(CancellationToken cancellationToken)
        {
            List<Result<GoogleDriveFolder>> getRootFoldersResult = await googleDriveService.GetRootFoldersAsync(cancellationToken);

            if (getRootFoldersResult.Count == 0)
            {
                return Result<IReadOnlyCollection<Response>>.Success([]);
            }

            List<string> errorMessages = [];

            foreach (Result<GoogleDriveFolder> googleDriveFolderResult in getRootFoldersResult)
            {
                if (googleDriveFolderResult.IsFailure)
                {
                    errorMessages.Add(googleDriveFolderResult.ErrorDetails!.ErrorMessage);
                }
            }

            if (errorMessages.Count > 0)
            {
                string errorMessage = string.Join("; ", errorMessages);
                return Result<IReadOnlyCollection<Response>>.Failure(errorMessage, HttpStatusCode.InternalServerError);
            }

            List<Response> response = [];

            foreach (Result<GoogleDriveFolder> googleDriveFolderResult in getRootFoldersResult)
            {
                GoogleDriveFolder googleDriveFolder = googleDriveFolderResult.Value!;

                response.Add(new Response(
                    googleDriveFolder.Id,
                    googleDriveFolder.Name,
                    googleDriveFolder.Link
                ));
            }

            return response;
        }
    }
}
#pragma warning restore CA1056
#pragma warning restore CA1054
