using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Features.Common.ValidationRules;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.Infrastructure.SQLite.Extensions;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Storage;

namespace EduGraph.Core.Features.Students;

internal static class Create
{
    internal sealed record Request(
        string FullName,
        string Group,
        string Login,
        string Password,
        string ConfirmPassword
    );

    internal sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty();
            RuleFor(x => x.Group)
                .NotEmpty();
            RuleFor(x => x.Login)
                .NotEmpty()
                .MinimumLength(RequestValidationRules.LoginMinLength);
            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(RequestValidationRules.PasswordMinLength);
            RuleFor(x => x.ConfirmPassword)
                .Equal(x => x.Password)
                .WithMessage("Паролі не збігаються");
        }
    }

    internal sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("students", Handle)
                .RequireAuthorization(AuthorizationPolicies.TeacherOrAdminOrSuperAdmin)
                .WithTags("Students")
                .WithRequestValidation<Request>()
                .Produces<int>(StatusCodes.Status201Created)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status409Conflict)
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [FromBody] Request request,
            [FromServices] IValidator<Request> validator,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            ValidationResult validateSearchDocumentsRequest = await validator.ValidateAsync(request, cancellationToken);

            if (!validateSearchDocumentsRequest.IsValid)
            {
                return Results.ValidationProblem(validateSearchDocumentsRequest.ToDictionary());
            }
            
            Result<int> createStudentResult = await handler.HandleAsync(request, cancellationToken);

            if (createStudentResult.IsFailure)
            {
                return createStudentResult.ToHttpFailure();
            }

            return TypedResults.Created($"students/{createStudentResult.Value}", createStudentResult.Value);
        }
    }

    internal sealed class Handler(
        UserManager<User> userManager,
        EduGraphContext db,
        IPasswordHasher<User> passwordHasher) : IScopedType
    {
        public async Task<Result<int>> HandleAsync(Request request, CancellationToken cancellationToken)
        {
            User? existingUser = await userManager.FindByNameAsync(request.Login);

            if (existingUser is not null)
            {
                return new ErrorDetails(
                    "Цей логін вже зайнятий",
                    HttpStatusCode.Conflict
                );
            }

            string passwordHash = passwordHasher.HashPassword(null!, request.Password);

            Result<User> createUserResult = User.Create(
                request.Login,
                request.FullName,
                UserType.Student,
                passwordHash,
                request.Group
            );

            if (createUserResult.IsFailure)
            {
                return createUserResult.ErrorDetails!;
            }

            User user = createUserResult.Value!;
            
            await using IDbContextTransaction transaction = await db.Database.BeginTransactionAsync(cancellationToken);

            IdentityResult createIdentityUserResult = await userManager.CreateAsync(user);

            if (createIdentityUserResult.Succeeded is false)
            {
                await transaction.RollbackAsync(cancellationToken);
                
                return new ErrorDetails(
                    createIdentityUserResult.GetErrorMessage(),
                    HttpStatusCode.InternalServerError
                );
            }

            IdentityResult addUserToRoleResult = await userManager.AddToRoleAsync(user, nameof(UserType.Student));

            if (addUserToRoleResult.Succeeded is false)
            {
                await transaction.RollbackAsync(cancellationToken);
                
                return new ErrorDetails(
                    addUserToRoleResult.GetErrorMessage(),
                    HttpStatusCode.InternalServerError
                );
            }

            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return user.Id;
        }
    }
}
