using EduGraph.Entities;
using EduGraph.Features.Shared;
using EduGraph.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Features.Identity.LogIn;

public sealed class LogInRequestHandler(SignInManager<User> signInManager, EduGraphContext context)
    : IRequestHandler<LogInRequest, VoidResult>
{
    public async Task<VoidResult> HandleAsync(LogInRequest request, CancellationToken cancellationToken)
    {
        User? user = await context.Users
            .FirstOrDefaultAsync(user => user.UserName == request.Login, cancellationToken);

        if (user is null)
        {
            return VoidResult.Failure("Такого аккаунту не існує");
        }
        
        SignInResult result = await signInManager.PasswordSignInAsync(
            user,
            request.Password, 
            isPersistent: false, 
            lockoutOnFailure: true
        );

        if (result.IsLockedOut)
        {
            return VoidResult.Failure("Ваш аккаунт заблоковано, спробуйте пізніше");
        }

        if (result.Succeeded is false)
        {
            return VoidResult.Failure($"Неправильний логін чи пароль");
        }
        
        user.MarkAsLoggedIn();
        
        await context.SaveChangesAsync(cancellationToken);

        return VoidResult.Success();
    }
}