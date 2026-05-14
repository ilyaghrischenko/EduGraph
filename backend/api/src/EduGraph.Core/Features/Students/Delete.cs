using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common.Auth;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.Infrastructure.SQLite.Extensions;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EduGraph.Core.Features.Students;

internal static class Delete
{
    internal sealed record Request(int Id);

    internal sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0);
        }
    }

    internal sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapDelete("students/{id:int}", Handle)
                .RequireAuthorization(AuthorizationPolicies.TeacherOrAdmin)
                .WithTags("Students")
                .WithRequestValidation<Request>()
                .Produces(StatusCodes.Status204NoContent)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status404NotFound)
                .ProducesProblem(StatusCodes.Status500InternalServerError);
        }

        private static async Task<IResult> Handle(
            [AsParameters] Request request,
            [FromServices] IValidator<Request> validator,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            ValidationResult validateDeleteStudentRequestResult = await validator.ValidateAsync(request, cancellationToken);

            if (!validateDeleteStudentRequestResult.IsValid)
            {
                return Results.ValidationProblem(validateDeleteStudentRequestResult.ToDictionary());
            }

            Result deleteStudentResult = await handler.HandleAsync(request, cancellationToken);

            if (deleteStudentResult.IsFailure)
            {
                return deleteStudentResult.ToHttpFailure();
            }

            return TypedResults.NoContent();
        }
    }

    internal sealed class Handler(UserManager<User> userManager) : IScopedType
    {
        public async Task<Result> HandleAsync(Request request, CancellationToken cancellationToken)
        {
            User? user = await userManager.FindByIdAsync(request.Id.ToString());

            if (user is null)
            {
                return new ErrorDetails(
                    "Студента не знайдено",
                    HttpStatusCode.NotFound
                );
            }

            if (user.Type != UserType.Student)
            {
                return new ErrorDetails(
                    "Студента не знайдено",
                    HttpStatusCode.NotFound
                );
            }

            IdentityResult deleteStudentResult = await userManager.DeleteAsync(user);

            if (deleteStudentResult.Succeeded is false)
            {
                return new ErrorDetails(
                    deleteStudentResult.GetErrorMessage(),
                    HttpStatusCode.InternalServerError
                );
            }

            return Result.Success();
        }
    }
}
