using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EduGraph.Persistence;

public sealed class EduGraphContext : IdentityDbContext<IdentityUser<int>, IdentityRole<int>, int>
{
    public EduGraphContext() { }
    
    public EduGraphContext(DbContextOptions<EduGraphContext> options)
        : base(options) { }
}