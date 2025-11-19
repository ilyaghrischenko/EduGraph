using EduGraph.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGraph.Persistence.Configurations;

public sealed class UserEntityConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.Property(u => u.FullName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.Type)
            .IsRequired()
            .HasConversion<string>();
        
        builder.Property(u => u.Group)
            .IsRequired(false);
        
        builder.Property(u => u.LastLoginDate)
            .IsRequired(false);
    }
}