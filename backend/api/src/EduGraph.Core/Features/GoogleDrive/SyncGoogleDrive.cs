using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.GoogleDrive;

public static class SyncGoogleDrive
{
    public sealed record Response(string Status, string Message);

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("google-drive/sync", Handle)
                .RequireAuthorization(AuthorizationPolicies.TeacherOrAdminOrSuperAdmin)
                .WithTags("GoogleDrive")
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

