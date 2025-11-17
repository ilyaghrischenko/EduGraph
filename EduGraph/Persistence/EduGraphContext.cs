using EduGraph.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Persistence;

public sealed class EduGraphContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public EduGraphContext() { }
    
    public EduGraphContext(DbContextOptions<EduGraphContext> options)
        : base(options) { }
    
    public DbSet<SignUpApplication> SignUpApplications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(EduGraphContext).Assembly);
    }
}