using EduGraph.Domain.Entities;
using EduGraph.Infrastructure.SQLite.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Infrastructure.SQLite;

public sealed class EduGraphContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public EduGraphContext() { }
    
    public EduGraphContext(DbContextOptions<EduGraphContext> options)
        : base(options) { }
    
    public DbSet<SignUpApplication> SignUpApplications { get; set; }
    
    public DbSet<UniversityDocument> UniversityDocuments { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        builder.ApplyConfigurationsFromAssembly(typeof(EduGraphContext).Assembly);
    }
}
