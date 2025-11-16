using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGraph.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Change : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Password",
                table: "SignUpApplications",
                newName: "PasswordHash");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "SignUpApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "SignUpApplications");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "SignUpApplications",
                newName: "Password");
        }
    }
}
