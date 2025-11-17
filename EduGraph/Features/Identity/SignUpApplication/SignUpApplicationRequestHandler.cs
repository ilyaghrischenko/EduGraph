using EduGraph.Entities;
using EduGraph.Features.Shared;
using EduGraph.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Features.Identity.SignUpApplication;

public sealed class SignUpApplicationRequestHandler(
    UserManager<User> userManager,
    EduGraphContext context,
    IPasswordHasher<User> passwordHasher)
    : IRequestHandler<SignUpApplicationRequest, VoidResult>
{
    public async Task<VoidResult> HandleAsync(SignUpApplicationRequest request, CancellationToken cancellationToken)
    {
        //todo: вынести это в отдельную валидацию
        if (request.Password != request.ConfirmPassword)
        {
            return VoidResult.Failure("Passwords do not match", nameof(request.ConfirmPassword));
        }

        if (request.UserType == "Student" && string.IsNullOrEmpty(request.Group))
        {
            return VoidResult.Failure("Group required for student", nameof(request.Group));
        }

        if (!Enum.TryParse(request.UserType, out UserType signUpApplicationType))
        {
            return VoidResult.Failure("Invalid user type", nameof(request.UserType));
        }
        //
        
        User? user = await userManager.FindByNameAsync(request.Login);

        if (user != null)
        {
            return VoidResult.Failure("This login is already taken");
        }

        bool isApplicationPending = await context.SignUpApplications
            .AsNoTracking()
            .AnyAsync(x => x.Login == request.Login && x.Status == SignUpApplicationStatus.Pending, cancellationToken);

        if (isApplicationPending)
        {
            return VoidResult.Failure("Your application is already in progress");
        }
        
        string passwordHash = passwordHasher.HashPassword(null, request.Password);

        Entities.SignUpApplication signUpApplication = new(
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