using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.Admins;

public static class SyncGoogleDrive
{
    public sealed record Response(string Status, string Message);

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("/admins/google-drive/sync", Handle)
                .RequireAuthorization(AuthorizationRoles.Teacher, AuthorizationRoles.Admin)
                .WithTags("Admins")
                .WithName("SyncGoogleDrive")
                .Produces(StatusCodes.Status202Accepted);
        }

        private static Accepted Handle(
            [FromServices] GoogleDriveSyncQueue queue,
            [FromServices] TimeProvider timeProvider)
        {
            queue.TryEnqueue(
                new GoogleDriveSyncQueueItem(
                    RequestedAt: timeProvider.GetUtcNow()
                )
            );

            return TypedResults.Accepted(new Uri("/admins/google-drive/sync/status", UriKind.Relative));
        }
    }
}

