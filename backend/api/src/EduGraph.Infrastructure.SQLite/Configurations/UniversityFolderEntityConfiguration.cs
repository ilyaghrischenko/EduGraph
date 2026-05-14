using EduGraph.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGraph.Infrastructure.SQLite.Configurations;

public sealed class UniversityFolderEntityConfiguration : IEntityTypeConfiguration<UniversityFolder>
{
    public void Configure(EntityTypeBuilder<UniversityFolder> builder)
    {
        builder.ToTable("UniversityFolders");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.GoogleDriveId)
            .IsRequired();

        builder.HasIndex(x => x.GoogleDriveId)
            .IsUnique();

        builder.Property(x => x.Name)
            .IsRequired();

        builder.Property(x => x.Link)
            .IsRequired();

        builder.Property(x => x.IsMain)
            .IsRequired();

        builder.HasIndex(x => x.IsMain)
            .IsUnique()
            .HasFilter($"{nameof(UniversityFolder.IsMain)} = 1");
    }
}
