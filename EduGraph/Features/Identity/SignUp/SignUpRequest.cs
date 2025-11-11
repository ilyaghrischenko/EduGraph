namespace EduGraph.Features.Identity.SignUp;

public sealed record SignUpRequest(string Login, string Password, string ConfirmPassword);