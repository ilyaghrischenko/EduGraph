using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Domain.Entities;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.Infrastructure.SQLite.Extensions;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace EduGraph.Core.Features.SignUpApplications;

public static class ApproveSignUpApplication
{
    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("sign-up-applications/{applicationId:int}/approve", Handle)
                .RequireAuthorization(AuthorizationRoles.Teacher, AuthorizationRoles.Admin)
                .WithTags("SignUpApplications")
                .Produces(StatusCodes.Status204NoContent)
                .ProducesProblem(StatusCodes.Status404NotFound)
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [FromRoute] int applicationId,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            Result approveApplicationResult = await handler.HandleAsync(applicationId, cancellationToken);

            if (approveApplicationResult.IsFailure)
            {
                return approveApplicationResult.ToHttpFailure();
            }
            
            return TypedResults.NoContent();
        }
    }

    public sealed class Handler(
        UserManager<User> userManager,
        EduGraphContext db) : IScopedType
    {
        public async Task<Result> HandleAsync(int applicationId, CancellationToken cancellationToken)
        {
            SignUpApplication? application = await db.SignUpApplications
                .FirstOrDefaultAsync(application => application.Id == applicationId, cancellationToken);

            if (application is null)
            {
                return new ErrorDetails(
                    $"Заявка на реєстрацію з id: {applicationId} не існує",
                    HttpStatusCode.NotFound
                );
            }
            
            await using IDbContextTransaction transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            
            Result approveApplicationResult = application.Approve();

            if (approveApplicationResult.IsFailure)
            {
                await transaction.RollbackAsync(cancellationToken);
                
                return approveApplicationResult;
            }

            Result<User> createResult = User.Create(
                application.Login,
                application.FullName,
                application.Type,
                application.PasswordHash,
                application.Group
            );

            if (createResult.IsFailure)
            {
                await transaction.RollbackAsync(cancellationToken);
                
                return createResult;
            }

            User user = createResult.Value!;
            
            IdentityResult createUserResult = await userManager.CreateAsync(user);

            if (createUserResult.Succeeded is false)
            {
                await transaction.RollbackAsync(cancellationToken);
                
                return new ErrorDetails(
                    createUserResult.GetErrorMessage(),
                    HttpStatusCode.InternalServerError
                );
            }
            
            var addUserToRoleResult = await userManager.AddToRoleAsync(user, application.Type.ToString());

            if (addUserToRoleResult.Succeeded is false)
            {
                await transaction.RollbackAsync(cancellationToken);
                
                return new ErrorDetails(
                    createUserResult.GetErrorMessage(),
                    HttpStatusCode.InternalServerError
                );
            }
            
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            
            return approveApplicationResult;
        }
    }
}
