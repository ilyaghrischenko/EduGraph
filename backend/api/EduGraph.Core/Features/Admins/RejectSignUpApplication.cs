using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common;
using EduGraph.Domain.Entities;
using EduGraph.Infrastructure.SQLite;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.Admins;

public static class RejectSignUpApplication
{
    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("admins/sign-up-applications/{applicationId:int}/reject", Handle)
                .WithTags("Admins");
        }

        private static async Task<Results<NoContent, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> Handle(
            [FromRoute] int applicationId,
            [FromServices] EduGraphContext db,
            CancellationToken cancellationToken)
        {
            SignUpApplication? application = await db.SignUpApplications
                .FirstOrDefaultAsync(application => application.Id == applicationId, cancellationToken);

            if (application is null)
            {
                var notFoundProblem = ProblemDetailsFactory.NotFound($"Заявки на реєстрацію з id: {applicationId} не існує");
                return TypedResults.NotFound(notFoundProblem);
            }

            Result rejectSignUpApplication = application.Reject();

            if (rejectSignUpApplication.IsFailure)
            {
                return TypedResults.BadRequest(rejectSignUpApplication.ToProblemDetails());
            }
            
            await db.SaveChangesAsync(cancellationToken);
            
            return TypedResults.NoContent();
        }
    }
}
