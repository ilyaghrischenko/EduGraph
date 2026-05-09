using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Infrastructure.GoogleDrive;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.GoogleDrive;

//todo: review + на фронте кнопку добавить красивую
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
