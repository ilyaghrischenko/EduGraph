using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGraph.Infrastructure.SQLite.Migrations
{
    /// <inheritdoc />
    public partial class ChangeDocumentEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GoogleDriveId",
                table: "UniversityDocuments",
                type: "TEXT",
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.CreateIndex(
                name: "IX_UniversityDocuments_GoogleDriveId",
                table: "UniversityDocuments",
                column: "GoogleDriveId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UniversityDocuments_GoogleDriveId",
                table: "UniversityDocuments");

            migrationBuilder.DropColumn(
                name: "GoogleDriveId",
                table: "UniversityDocuments");
        }
    }
}
