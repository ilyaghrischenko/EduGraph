using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Infrastructure.GoogleDrive;
using EduGraph.Infrastructure.SQLite;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.GoogleDrive;

public static class GetRootFolderLink
{
    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapGet("google-drive/root-folder-link", Handle)
                .RequireAuthorization(AuthorizationPolicies.TeacherOrAdmin)
                .WithTags("GoogleDrive")
                .Produces<string>()
                .ProducesProblem(StatusCodes.Status404NotFound)
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [FromServices] EduGraphContext db,
            CancellationToken cancellationToken)
        {
            string? link = await db.UniversityFolders
                .AsNoTracking()
                .Where(folder => folder.IsMain)
                .Select(folder => folder.Link)
                .FirstOrDefaultAsync(cancellationToken);

            if (link is null)
            {
                return TypedResults.NotFound("Головна папка не знайдена");
            }

            return TypedResults.Ok(link);
        }
    }
}
