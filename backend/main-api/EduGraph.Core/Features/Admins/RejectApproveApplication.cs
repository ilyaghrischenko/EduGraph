using System.Net;
using EduGraph.Core.Features.Common;
using EduGraph.Domain.Entities;
using EduGraph.Domain.Models;
using EduGraph.Infrastructure.SQLite;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.Admins;

public static class RejectApproveApplication
{
    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("admins/sign-up-applications/{applicationId:int}/reject", Handle)
                .WithTags("Admins");
        }

        private static async Task<Results<NoContent, NotFound<string>, BadRequest<string>>> Handle(
            [FromRoute] int applicationId,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            VoidResult rejectApplicationResult = await handler.HandleAsync(applicationId, cancellationToken);

            if (rejectApplicationResult.IsFailure)
            {
                return rejectApplicationResult.StatusCode switch
                {
                    HttpStatusCode.NotFound => TypedResults.NotFound(rejectApplicationResult.ErrorMessage),
                    HttpStatusCode.BadRequest => TypedResults.BadRequest(rejectApplicationResult.ErrorMessage),
                    _ => throw new UnknownStatusCodeException(rejectApplicationResult.StatusCode)
                };
            }
            
            return TypedResults.NoContent();
        }
    }

    public sealed class Handler(EduGraphContext context)
    {
        public async Task<VoidResult> HandleAsync(int applicationId, CancellationToken cancellationToken)
        {
            SignUpApplication? application = await context.SignUpApplications
                .FirstOrDefaultAsync(application => application.Id == applicationId, cancellationToken);

            if (application is null)
            {
                return VoidResult.Failure(
                    $"Заявки на реєстрацію з id: {applicationId} не існує",
                    HttpStatusCode.NotFound
                );
            }

            VoidResult rejectSignUpApplication = application.Reject();

            if (rejectSignUpApplication.IsFailure)
            {
                return rejectSignUpApplication;
            }
            
            await context.SaveChangesAsync(cancellationToken);
            
            return VoidResult.Success();
        }
    }
}
