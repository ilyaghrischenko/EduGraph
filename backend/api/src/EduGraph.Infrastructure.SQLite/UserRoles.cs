namespace EduGraph.Infrastructure.SQLite;

public static class UserRoles
{
    public const string Student = "Student";
    public const string Teacher = "Teacher";

    public static readonly IReadOnlyCollection<string> All = [Student, Teacher];
}
