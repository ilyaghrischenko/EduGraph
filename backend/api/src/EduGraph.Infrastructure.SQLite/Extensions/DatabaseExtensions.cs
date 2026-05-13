using System.Globalization;
using System.Runtime.InteropServices;
using EduGraph.Infrastructure.SQLite.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EduGraph.Infrastructure.SQLite.Extensions;

public static class DatabaseExtensions
{
    public static async Task EnsureCreatedAndMigrated(this EduGraphContext db, CancellationToken cancellationToken = default)
    {
        await db.Database.MigrateAsync(cancellationToken);
    }
    
    public static async Task EnsureRolesExistAndValid(
        this EduGraphContext db,
        RoleManager<IdentityRole<int>> roleManager,
        CancellationToken cancellationToken = default)
    {
        foreach (string role in UserRoles.All)
        {
            await EnsureRoleExist(role, roleManager);
        }
        
        await DeleteInvalidRoles(db, roleManager);
        
        await db.SaveChangesAsync(cancellationToken);
    }
    
    private static async Task EnsureRoleExist(string role, RoleManager<IdentityRole<int>> roleManager)
    {
        IdentityRole<int>? existingRole = await roleManager.FindByNameAsync(role);
        if (existingRole == null)
        {
            var identityResult = await roleManager.CreateAsync(new IdentityRole<int>
            {
                Name = role,
                NormalizedName = role.ToUpper(CultureInfo.InvariantCulture),
                ConcurrencyStamp = Guid.CreateVersion7().ToString()
            });

            if (!identityResult.Succeeded)
            {
                throw new DatabaseException($"Failed to create role: {role}");
            }
        }
    }
    
    private static async Task DeleteInvalidRoles(EduGraphContext db, RoleManager<IdentityRole<int>> roleManager)
    {
        List<IdentityRole<int>> allInvalidRoles = await db.Roles
            .AsNoTracking()
            .Where(role => !UserRoles.All.Contains(role.Name))
            .ToListAsync();

        foreach (var invalidRole in allInvalidRoles)
        {
            var deleteResult = await roleManager.DeleteAsync(invalidRole);
            
            if (!deleteResult.Succeeded)
            {
                throw new DatabaseException($"Failed to delete role: {invalidRole.Name}");
            }
        }
    }
}
