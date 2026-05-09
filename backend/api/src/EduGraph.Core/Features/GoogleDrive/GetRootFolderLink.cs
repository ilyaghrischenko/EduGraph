using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Infrastructure.GoogleDrive;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.GoogleDrive;

public static class GetRootFolderLink
{
    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("users/root-folder-link", Handle)
                .WithTags("Users")
                .Produces<string>()
                .ProducesProblem(StatusCodes.Status404NotFound)
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            Result<string> getRootFolderLinkResult = await handler.HandleAsync(cancellationToken);

            if (getRootFolderLinkResult.IsFailure)
            {
                return getRootFolderLinkResult.ToHttpFailure();
            }

            return TypedResults.Ok(getRootFolderLinkResult.Value);
        }
    }

    public sealed class Handler(GoogleDriveService googleDriveService) : IScopedType
    {
        public async Task<Result<string>> HandleAsync(CancellationToken cancellationToken)
        {
            Result<string> getRootFolderLinkResult = await googleDriveService.GetRootFolderLinkAsync(cancellationToken);

            if (getRootFolderLinkResult.IsFailure)
            {
                return getRootFolderLinkResult;
            }

            return getRootFolderLinkResult.Value!;
        }
    }
}
