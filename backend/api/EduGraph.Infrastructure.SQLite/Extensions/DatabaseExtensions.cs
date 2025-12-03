using System.Globalization;
using System.Runtime.InteropServices;
using EduGraph.Infrastructure.SQLite.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EduGraph.Infrastructure.SQLite.Extensions;

public static class DatabaseExtensions
{
    public static async Task EnsureCreatedAndMigrated(this EduGraphContext context)
    {
        await context.Database.MigrateAsync();
    }
    
    public static async Task EnsureRolesExistAndValid(this EduGraphContext context, RoleManager<IdentityRole<int>> roleManager)
    {
        foreach (string role in Roles.All)
        {
            await EnsureRoleExist(role, roleManager);
        }
        
        await DeleteInvalidRoles(context, roleManager);
        
        await context.SaveChangesAsync();
    }
    
    private static async Task EnsureRoleExist(string role, RoleManager<IdentityRole<int>> roleManager)
    {
        var existingRole = await roleManager.FindByNameAsync(role);
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
    
    private static async Task DeleteInvalidRoles(EduGraphContext context, RoleManager<IdentityRole<int>> roleManager)
    {
        List<IdentityRole<int>> otherInvalidRoles = await context.Roles
            .AsNoTracking()
            .Where(role => !Roles.All.Contains(role.Name))
            .ToListAsync();

        foreach (var invalidRole in otherInvalidRoles)
        {
            var deleteResult = await roleManager.DeleteAsync(invalidRole);
            
            if (!deleteResult.Succeeded)
            {
                throw new DatabaseException($"Failed to delete role: {invalidRole.Name}");
            }
        }
    }
}
