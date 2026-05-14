using EduGraph.Domain.Enums;
using EduGraph.Infrastructure.SQLite.Entities;
using Microsoft.AspNetCore.Identity;

namespace EduGraph.Core.Seeding;

public static class DatabaseDebugSeeder
{
    public static async Task SeedTeacherAndAdminAndSuperAdminIfNotExistAsync(this WebApplication app)
    {
        if (app.Environment.IsDevelopment() is false)
        {
            return;
        }
        
        await using var scope = app.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        string passwordHash = passwordHasher.HashPassword(null!, "Admin1234567!");
        
        var existingTeacher = await userManager.FindByNameAsync("teacher");

        if (existingTeacher is null)
        {
            var teacher = User.Create(
                "teacher",
                "Грищенко Ілля Володимирович",
                UserType.Teacher,
                passwordHash
            ).Value!;
            await userManager.CreateAsync(teacher);
            await userManager.AddToRoleAsync(teacher, nameof(UserType.Teacher));
        }
        
        var existingAdmin = await userManager.FindByNameAsync("admin");

        if (existingAdmin is null)
        {
            var admin = User.Create(
                "admin",
                "Грищенко Ілля Володимирович",
                UserType.Admin,
                passwordHash
            ).Value!;
            await userManager.CreateAsync(admin);
            await userManager.AddToRoleAsync(admin, nameof(UserType.Admin));
        }
        
        var existingSuperAdmin = await userManager.FindByNameAsync("superadmin");

        if (existingSuperAdmin is null)
        {
            var superAdmin = User.Create(
                "superadmin",
                "Грищенко Ілля Володимирович",
                UserType.SuperAdmin,
                passwordHash
            ).Value!;
            await userManager.CreateAsync(superAdmin);
            await userManager.AddToRoleAsync(superAdmin, nameof(UserType.SuperAdmin));
        }
    }
}
