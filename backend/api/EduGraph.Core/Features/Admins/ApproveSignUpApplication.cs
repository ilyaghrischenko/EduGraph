using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common;
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

namespace EduGraph.Core.Features.Admins;

public static class ApproveSignUpApplication
{
    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("admins/sign-up-applications/{applicationId:int}/approve", Handle)
                .WithTags("Admins")
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
            
            Result approveApplicationResult = application.Approve();

            if (approveApplicationResult.IsFailure)
            {
                return approveApplicationResult;
            }
            
            Result<User> createResult = User.Create(application.Login, application.FullName, application.Type, application.Group);

            if (createResult.IsFailure)
            {
                return createResult;
            }

            User user = createResult.Value!;
            
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

            var createUserResult = await userManager.CreateAsync(user);

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
