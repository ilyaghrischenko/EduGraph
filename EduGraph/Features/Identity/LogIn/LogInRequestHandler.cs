using EduGraph.Features.Shared;
using EduGraph.Persistence;
using Microsoft.AspNetCore.Identity;

namespace EduGraph.Features.Identity.LogIn;

public sealed class LogInRequestHandler(UserManager<IdentityUser<int>> userManager) : IRequestHandler<LogInRequest, Result<string>>
{
    public async Task<Result<string>> HandleAsync(LogInRequest request, CancellationToken ct)
    {
        IdentityUser<int>? user = await userManager.FindByNameAsync(request.Login);

        if (user is null)
        {
            return Result<string>.Failure($"Invalid {nameof(request.Login)}", nameof(request.Login));
        }
        
        bool isPasswordValid = await userManager.CheckPasswordAsync(user, request.Password);

        if (isPasswordValid is false)
        {
            return Result<string>.Failure($"Invalid {nameof(request.Password)}", nameof(request.Password));
        }
        
        string token = await userManager.GenerateUserTokenAsync(user, "EduGraph", "Login");
        
        return Result<string>.Success(token);
    }
}