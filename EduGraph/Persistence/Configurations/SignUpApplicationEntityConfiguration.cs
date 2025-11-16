using EduGraph.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGraph.Persistence.Configurations;

public sealed class SignUpApplicationEntityConfiguration : IEntityTypeConfiguration<SignUpApplication>
{
    public void Configure(EntityTypeBuilder<SignUpApplication> builder)
    {
        builder.ToTable("SignUpApplications");
        
        builder.Property(x => x.FullName).IsRequired();
        
        builder.Property(x => x.Type)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(x => x.Group).IsRequired(false);
        
        builder.Property(x => x.Login).IsRequired();
        builder.HasIndex(x => x.Login).IsUnique();
        
        builder.Property(x => x.Password).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
    }
}