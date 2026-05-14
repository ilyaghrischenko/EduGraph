using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGraph.Infrastructure.SQLite.Migrations
{
    /// <inheritdoc />
    public partial class AddIndexOnIsMain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsMain",
                table: "UniversityFolders",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_UniversityFolders_IsMain",
                table: "UniversityFolders",
                column: "IsMain",
                unique: true,
                filter: "IsMain = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UniversityFolders_IsMain",
                table: "UniversityFolders");

            migrationBuilder.DropColumn(
                name: "IsMain",
                table: "UniversityFolders");
        }
    }
}
