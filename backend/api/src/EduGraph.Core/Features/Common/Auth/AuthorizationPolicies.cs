namespace EduGraph.Core.Features.Common.Auth;

public static class AuthorizationPolicies
{
    public const string Student = nameof(Student);
    public const string Teacher = nameof(Teacher);
    public const string Admin = nameof(Admin);
    
    public const string AnyRole = nameof(AnyRole);
    public const string TeacherOrAdmin = nameof(TeacherOrAdmin);
}
