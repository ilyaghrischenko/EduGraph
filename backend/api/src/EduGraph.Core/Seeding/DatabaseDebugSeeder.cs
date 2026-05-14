using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite;
using EduGraph.Infrastructure.SQLite.Entities;
using Microsoft.AspNetCore.Identity;

namespace EduGraph.Core.Seeding;

public static class DatabaseDebugSeeder
{
    public static async Task SeedTeacherAndAdminAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        var teacher = User.Create(
            "teacher",
            "Грищенко Ілля Володимирович",
            UserType.Teacher,
            passwordHasher.HashPassword(null!, "Admin1234567!")
        ).Value!;
        await userManager.CreateAsync(teacher);
        await userManager.AddToRoleAsync(teacher, nameof(UserType.Teacher));

        var admin = User.Create(
            "admin",
            "Грищенко Ілля Володимирович",
            UserType.Admin,
            passwordHasher.HashPassword(null!, "Admin1234567!")
        ).Value!;
        await userManager.CreateAsync(admin);
        await userManager.AddToRoleAsync(admin, nameof(UserType.Admin));
    }
}
