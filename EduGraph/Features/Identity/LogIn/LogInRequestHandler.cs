using EduGraph.Features.Shared;
using EduGraph.Persistence;
using Microsoft.AspNetCore.Identity;

namespace EduGraph.Features.Identity.LogIn;

public sealed class LogInRequestHandler(SignInManager<IdentityUser<int>> signInManager)
    : IRequestHandler<LogInRequest, VoidResult>
{
    public async Task<VoidResult> HandleAsync(LogInRequest request, CancellationToken ct)
    {
        SignInResult result = await signInManager.PasswordSignInAsync(
            request.Login,
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

        return VoidResult.Success();
    }
}