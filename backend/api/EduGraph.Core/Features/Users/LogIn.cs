using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common;
using EduGraph.Core.Features.Common.Endpoints;
using EduGraph.Core.Features.Common.ValidationRules;
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
using SignInResult = Microsoft.AspNetCore.Identity.SignInResult;

namespace EduGraph.Core.Features.Users;

public static class LogIn
{
    public sealed record Request(
        string Login,
        string Password
    );

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Login)
                .NotEmpty()
                .MinimumLength(RequestValidationRules.LoginMinLength);
            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(RequestValidationRules.PasswordMinLength);
        }
    }

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("users/login", Handle)
                .WithTags("Users")
                .WithRequestValidation<Request>()
                .Produces<string>()
                .ProducesProblem(StatusCodes.Status400BadRequest);
        }

        private static async Task<IResult> Handle(
            [FromBody] Request request,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            Result<string> logInResult = await handler.HandleAsync(request, cancellationToken);

            if (logInResult.IsFailure)
            {
                return logInResult.ToHttpFailure();
            }
            
            return TypedResults.Ok(logInResult.Value);
        }
    }

    public sealed class Handler(
        SignInManager<User> signInManager,
        EduGraphContext db,
        UserManager<User> userManager,
        JwtService jwtService,
        TimeProvider timeProvider) : IScopedType
    {
        public async Task<Result<string>> HandleAsync(Request request, CancellationToken cancellationToken)
        {
            User? user = await db.Users
                .FirstOrDefaultAsync(user => user.UserName == request.Login, cancellationToken);

            if (user is null)
            {
                return new ErrorDetails("Неправильний логін чи пароль");
            }
        
            SignInResult result = await signInManager.CheckPasswordSignInAsync(
                user,
                request.Password, 
                lockoutOnFailure: true
            );

            if (result.IsLockedOut || !result.Succeeded)
            {
                return new ErrorDetails("Неправильний логін чи пароль");
            }

            DateOnly currentDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().DateTime);
            user.MarkAsLoggedIn(currentDate);
        
            await db.SaveChangesAsync(cancellationToken);
            
            var userRoles = await userManager.GetRolesAsync(user);

            if (userRoles.Count is 0 or > 1)
            {
                throw new InvalidOperationException("Користувач може мати лише 1 роль");
            }

            string token = jwtService.GenerateToken(user.Id, user.UserName!, userRoles[0]);

            return token;
        }
    }
}
