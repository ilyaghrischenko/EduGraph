using EduGraph.Core.Extensions;
using EduGraph.Core.Factories;
using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Domain.Entities;
using EduGraph.Infrastructure.SQLite;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.SignUpApplications;

public static class RejectSignUpApplication
{
    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("sign-up-applications/{applicationId:int}/reject", Handle)
                .RequireAuthorization(AuthorizationPolicies.TeacherOrAdminOrSuperAdmin)
                .WithTags("SignUpApplications")
                .Produces(StatusCodes.Status204NoContent)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status404NotFound);
        }

        private static async Task<IResult> Handle(
            [FromRoute] int applicationId,
            [FromServices] EduGraphContext db,
            CancellationToken cancellationToken)
        {
            SignUpApplication? application = await db.SignUpApplications
                .FirstOrDefaultAsync(application => application.Id == applicationId, cancellationToken);

            if (application is null)
            {
                var notFoundProblem = ProblemDetailsFactory.NotFound($"Заявки на реєстрацію з id: {applicationId} не існує");
                return TypedResults.Problem(notFoundProblem);
            }

            Result rejectSignUpApplication = application.Reject();

            if (rejectSignUpApplication.IsFailure)
            {
                return rejectSignUpApplication.ToHttpFailure();
            }
            
            await db.SaveChangesAsync(cancellationToken);
            
            return TypedResults.NoContent();
        }
    }
}
