using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Features.Common.ValidationRules;
using EduGraph.Domain.Entities;
using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using EduGraph.SharedKernel;
using EduGraph.SharedKernel.Interfaces;
using EduGraph.SharedKernel.Models;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.MicrosoftExtensions;

namespace EduGraph.Core.Features.Users;

public static class SignUp
{
    public sealed record Request(
        string FullName,
        string UserType,
        string? Group,
        string Login,
        string Password,
        string ConfirmPassword
    );

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
                .When(x => x.UserType == Roles.Student)
                .WithMessage("Група обовʼязкова для студентів");
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

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("users/signup", Handle)
                .WithTags("Users")
                .WithRequestValidation<Request>()
                .Produces(StatusCodes.Status204NoContent)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status409Conflict);
        }

        private static async Task<IResult> Handle(
            [FromBody] Request request,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            Result signUpResult = await handler.HandleAsync(request, cancellationToken);

            if (signUpResult.IsFailure)
            {
                return signUpResult.ToHttpFailure();
            }
            
            return TypedResults.NoContent();
        }
    }

    public sealed class Handler(
        UserManager<User> userManager,
        EduGraphContext db,
        IPasswordHasher<User> passwordHasher) : IScopedType
    {
        public async Task<Result> HandleAsync(Request request, CancellationToken cancellationToken)
        {
            User? user = await userManager.FindByNameAsync(request.Login);

            if (user != null)
            {
                return new ErrorDetails(
                    "Цей логін вже зайнятий",
                    HttpStatusCode.Conflict
                );
            }

            bool isApplicationPending = await db.SignUpApplications
                .AsNoTracking()
                .AnyAsync(x => x.Login == request.Login && x.Status == SignUpApplicationStatus.Pending, cancellationToken);

            if (isApplicationPending)
            {
                return new ErrorDetails(
                    "Ваша заявка вже в обробці",
                    HttpStatusCode.Conflict
                );
            }
        
            string passwordHash = passwordHasher.HashPassword(null!, request.Password);

            if (!Enum.TryParse(request.UserType, out UserType signUpApplicationType))
            {
                return new ErrorDetails("Неправильний тип користувача");
            }

            Result<SignUpApplication> createSignUpApplication = SignUpApplication.Create(
                request.FullName,
                signUpApplicationType,
                request.Login,
                passwordHash,
                request.Group
            );

            if (createSignUpApplication.IsFailure)
            {
                return createSignUpApplication;
            }

            await db.SignUpApplications.AddAsync(createSignUpApplication.Value!, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        
            return Result.Success();
        }
    }
}
