namespace EduGraph.Infrastructure.SQLite;

public static class UserRoles
{
    public const string Student = nameof(Student);
    public const string Teacher = nameof(Teacher);
    public const string Admin = nameof(Admin);

    public static readonly IReadOnlyCollection<string> All = [Student, Teacher, Admin];
}
