using EduGraph.Features.Shared;

namespace EduGraph.Features.Identity.LogIn;

public sealed record LogInRequest(string Login, string Password) : IRequest;