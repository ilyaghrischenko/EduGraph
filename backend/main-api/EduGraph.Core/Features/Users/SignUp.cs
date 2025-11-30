using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common;
using EduGraph.Domain.Entities;
using EduGraph.Domain.Enums;
using EduGraph.Domain.Models;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Core.Features.Users;

public static class SignUp
{
    public sealed record Request(
        string FullName,
        string UserType,
        string? Group,
        string Login,
        string Password,
        string ConfirmPassword);

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty();
            RuleFor(x => x.UserType)
                .NotEmpty();
            RuleFor(x => x.Group)
                .NotEmpty()
                .When(x => x.UserType == "Student")
                .WithMessage("Група обовʼязкова для студентів");
            RuleFor(x => x.Login)
                .NotEmpty()
                .MinimumLength(RequestPropertiesRules.LoginMinLength);
            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(RequestPropertiesRules.PasswordMinLength);
            RuleFor(x => x.ConfirmPassword)
                .Equal(x => x.Password)
                .WithMessage("Паролі не збігаються");
        }
    }

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("users/signup", Handle)
                .WithTags("Users")
                .WithRequestValidation<Request>();
        }

        private static async Task<Results<NoContent, ValidationProblem, BadRequest<string>, Conflict<string>>> Handle(
            [FromBody] Request request,
            [FromServices] Handler handler,
            [FromServices] IValidator<Request> validator,
            CancellationToken cancellationToken)
        {
            VoidResult signUpResult = await handler.HandleAsync(request, cancellationToken);

            if (signUpResult.IsFailure)
            {
                return signUpResult.StatusCode switch
                {
                    HttpStatusCode.BadRequest => TypedResults.BadRequest(signUpResult.ErrorMessage),
                    HttpStatusCode.Conflict => TypedResults.Conflict(signUpResult.ErrorMessage),
                    _ => throw new UnknownStatusCodeException(signUpResult.StatusCode)
                };
            }
            
            return TypedResults.NoContent();
        }
    }

    public sealed class Handler(
        UserManager<User> userManager,
        EduGraphContext context,
        IPasswordHasher<User> passwordHasher)
    {
        public async Task<VoidResult> HandleAsync(Request request, CancellationToken cancellationToken)
        {
            //todo: вынести это в отдельную валидацию
            if (request.Password != request.ConfirmPassword)
            {
                return VoidResult.Failure("Passwords do not match");
            }

            if (request.UserType == "Student" && string.IsNullOrEmpty(request.Group))
            {
                return VoidResult.Failure("Group required for student");
            }

            if (!Enum.TryParse(request.UserType, out UserType signUpApplicationType))
            {
                return VoidResult.Failure("Invalid user type");
            }
        
            User? user = await userManager.FindByNameAsync(request.Login);

            if (user != null)
            {
                return VoidResult.Failure("This login is already taken", HttpStatusCode.Conflict);
            }

            bool isApplicationPending = await context.SignUpApplications
                .AsNoTracking()
                .AnyAsync(x => x.Login == request.Login && x.Status == SignUpApplicationStatus.Pending, cancellationToken);

            if (isApplicationPending)
            {
                return VoidResult.Failure("Your application is already in progress", HttpStatusCode.Conflict);
            }
        
            string passwordHash = passwordHasher.HashPassword(null!, request.Password);

            SignUpApplication signUpApplication = new(
                request.FullName,
                signUpApplicationType,
                request.Login,
                passwordHash,
                request.Group
            );

            await context.SignUpApplications.AddAsync(signUpApplication, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
        
            return VoidResult.Success();
        }
    }
}
