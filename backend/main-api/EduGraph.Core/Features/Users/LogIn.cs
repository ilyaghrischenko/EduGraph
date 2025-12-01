using System.Net;
using EduGraph.Core.Extensions;
using EduGraph.Core.Features.Common;
using EduGraph.Domain.Models;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
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
        string Password);

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Login)
                .NotEmpty()
                .MinimumLength(RequestPropertiesRules.LoginMinLength);
            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(RequestPropertiesRules.PasswordMinLength);
        }
    }

    public sealed class Endpoint : IEndpoint
    {
        public void MapEndpoint(IEndpointRouteBuilder app)
        {
            app.MapPost("users/login", Handle)
                .WithTags("Users")
                .WithRequestValidation<Request>();
        }

        private static async Task<Results<Ok<string>, BadRequest<string>, NotFound<string>>> Handle(
            [FromBody] Request request,
            [FromServices] Handler handler,
            CancellationToken cancellationToken)
        {
            Result<string> logInResult = await handler.HandleAsync(request, cancellationToken);

            if (logInResult.IsFailure)
            {
                return logInResult.StatusCode switch
                {
                    HttpStatusCode.NotFound => TypedResults.NotFound(logInResult.ErrorMessage),
                    HttpStatusCode.BadRequest => TypedResults.BadRequest(logInResult.ErrorMessage),
                    _ => throw new UnknownStatusCodeException(logInResult.StatusCode)
                };
            }
            
            return TypedResults.Ok(logInResult.Value);
        }
    }

    public sealed class Handler(
        SignInManager<User> signInManager,
        EduGraphContext context,
        JwtService jwtService)
    {
        public async Task<Result<string>> HandleAsync(Request request, CancellationToken cancellationToken)
        {
            User? user = await context.Users
                .FirstOrDefaultAsync(user => user.UserName == request.Login, cancellationToken);

            if (user is null)
            {
                return Result<string>.Failure("Неправильний логін чи пароль", HttpStatusCode.NotFound);
            }
        
            SignInResult result = await signInManager.CheckPasswordSignInAsync(
                user,
                request.Password, 
                lockoutOnFailure: true
            );

            if (result.IsLockedOut)
            {
                return Result<string>.Failure("Ваш аккаунт заблоковано, спробуйте пізніше", HttpStatusCode.Forbidden);
            }

            if (result.Succeeded is false)
            {
                return Result<string>.Failure($"Неправильний логін чи пароль");
            }
        
            user.MarkAsLoggedIn();
        
            await context.SaveChangesAsync(cancellationToken);

            string token = jwtService.GenerateToken(user.Id, user.UserName!, Roles.Student);

            return Result<string>.Success(token);
        }
    }
}
