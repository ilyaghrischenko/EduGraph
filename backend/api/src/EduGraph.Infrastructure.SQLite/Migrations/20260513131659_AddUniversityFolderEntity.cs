using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGraph.Infrastructure.SQLite.Migrations
{
    /// <inheritdoc />
    public partial class AddUniversityFolderEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UniversityFolders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GoogleDriveId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Link = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UniversityFolders", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UniversityFolders_GoogleDriveId",
                table: "UniversityFolders",
                column: "GoogleDriveId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UniversityFolders");
        }
    }
}
