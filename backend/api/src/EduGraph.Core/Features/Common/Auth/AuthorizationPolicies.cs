namespace EduGraph.Core.Features.Common.Auth;

public static class AuthorizationPolicies
{
    public const string SuperAdmin = nameof(SuperAdmin);
    
    public const string AnyRole = nameof(AnyRole);
    public const string TeacherOrAdminOrSuperAdmin = nameof(TeacherOrAdminOrSuperAdmin);
}
