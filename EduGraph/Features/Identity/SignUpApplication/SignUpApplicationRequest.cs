using EduGraph.Features.Shared;

namespace EduGraph.Features.Identity.SignUpApplication;

public sealed record SignUpApplicationRequest(string FullName, string UserType, string? Group, string Login, string Password, string ConfirmPassword) : IRequest;