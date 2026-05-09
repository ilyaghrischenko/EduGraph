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
            //todo: поменять роут и WithTags потому что не правильно сейчас + поправить это на фронте потом
            app.MapGet("users/root-folder-link", Handle)
                .WithTags("Users")
                .Produces<string>()
                .ProducesProblem(StatusCodes.Status404NotFound)
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [FromServices] GoogleDriveService googleDriveService,
            CancellationToken cancellationToken)
        {
            Result<string> getRootFolderLinkResult = await googleDriveService.GetRootFolderLinkAsync(cancellationToken);

            if (getRootFolderLinkResult.IsFailure)
            {
                return getRootFolderLinkResult.ToHttpFailure();
            }

            return TypedResults.Ok(getRootFolderLinkResult.Value);
        }
    }
}
