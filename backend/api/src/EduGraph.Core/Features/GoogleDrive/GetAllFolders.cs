using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Infrastructure.GoogleDrive;
using EduGraph.Infrastructure.GoogleDrive.Models;
using EduGraph.Infrastructure.SQLite;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.GoogleDrive;

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
            [FromServices] EduGraphContext db,
            CancellationToken cancellationToken)
        {
            List<Response> response = await db.UniversityFolders
                .AsNoTracking()
                .Select(folder => new Response(folder.GoogleDriveId, folder.Name, folder.Link))
                .ToListAsync(cancellationToken);
            
            return TypedResults.Ok(response);
        }
    }
}
