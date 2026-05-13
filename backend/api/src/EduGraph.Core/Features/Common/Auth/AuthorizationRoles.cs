namespace EduGraph.Core.Features.Common.Auth;

public static class AuthorizationRoles
{
    public const string Student = nameof(Student);
    
    public const string Teacher = nameof(Teacher);
    
    public const string Admin = nameof(Admin);

    public static readonly string[] All = [Student, Teacher, Admin];
}
