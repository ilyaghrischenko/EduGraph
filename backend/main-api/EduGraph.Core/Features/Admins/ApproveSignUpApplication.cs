using System.Net;
using EduGraph.Core.Features.Common;
using EduGraph.Domain.Entities;
using EduGraph.Domain.Enums;
using EduGraph.Domain.Models;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.Infrastructure.SQLite.Extensions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.Admins;

public static class ApproveSignUpApplication
{
    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("admins/sign-up-applications/{applicationId:int}/approve", Handle)
                .WithTags("Admins");
        }

        private static async Task<Results<NoContent, NotFound<string>, InternalServerError<string>>> Handle(
            [FromRoute] int applicationId,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            VoidResult approveApplicationResult = await handler.HandleAsync(applicationId, cancellationToken);

            if (approveApplicationResult.IsFailure)
            {
                return approveApplicationResult.StatusCode switch
                {
                    HttpStatusCode.NotFound => TypedResults.NotFound(approveApplicationResult.ErrorMessage),
                    HttpStatusCode.InternalServerError => TypedResults.InternalServerError(approveApplicationResult.ErrorMessage),
                    _ => throw new UnknownStatusCodeException(approveApplicationResult.StatusCode)
                };
            }
            
            return TypedResults.NoContent();
        }
    }

    public sealed class Handler(
        UserManager<User> userManager,
        EduGraphContext context)
    {
        public async Task<VoidResult> HandleAsync(int applicationId, CancellationToken cancellationToken)
        {
            SignUpApplication? application = await context.SignUpApplications
                .FirstOrDefaultAsync(application => application.Id == applicationId, cancellationToken);

            if (application is null)
            {
                return VoidResult.Failure(
                    $"Заявка на реєстрацію з id: {applicationId} не існує",
                    HttpStatusCode.NotFound
                );
            }
            
            VoidResult approveApplicationResult = application.Approve();

            if (approveApplicationResult.IsFailure)
            {
                return approveApplicationResult;
            }
            
            User user = new(application.Login, application.FullName, application.Type, application.Group)
            {
                PasswordHash = application.PasswordHash
            };
            
            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

            var createUserResult = await userManager.CreateAsync(user);

            if (createUserResult.Succeeded is false)
            {
                await transaction.RollbackAsync(cancellationToken);
                return VoidResult.Failure(createUserResult.GetErrorMessage(), HttpStatusCode.InternalServerError);
            }
            
            var addUserToRoleResult = await userManager.AddToRoleAsync(user, application.Type.ToString());

            if (addUserToRoleResult.Succeeded is false)
            {
                await transaction.RollbackAsync(cancellationToken);
                return VoidResult.Failure(addUserToRoleResult.GetErrorMessage(), HttpStatusCode.InternalServerError);
            }
            
            await transaction.CommitAsync(cancellationToken);
            
            return approveApplicationResult;
        }
    }
}
