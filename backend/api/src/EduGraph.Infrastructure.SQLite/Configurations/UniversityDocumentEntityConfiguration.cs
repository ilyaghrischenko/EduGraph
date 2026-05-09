using EduGraph.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGraph.Infrastructure.SQLite.Configurations;

public sealed class UniversityDocumentEntityConfiguration : IEntityTypeConfiguration<UniversityDocument>
{
    public void Configure(EntityTypeBuilder<UniversityDocument> builder)
    {
        builder.ToTable("UniversityDocuments");
        
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FolderName)
            .IsRequired(false);

        builder.Property(x => x.Name)
            .IsRequired();

        builder.Property(x => x.Content)
            .IsRequired();

        builder.Property(x => x.Link)
            .IsRequired();

        builder.Property(x => x.GoogleDriveId)
            .IsRequired();
        
        builder.HasIndex(x => x.GoogleDriveId)
            .IsUnique();

        builder.Property(x => x.ContentHash)
            .IsRequired();

        builder.Property(x => x.SearchIndexStatus)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(x => x.SearchIndexedAt)
            .IsRequired(false);

        builder.Property(x => x.SearchIndexError)
            .IsRequired(false);
    }
}
