using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGraph.Infrastructure.SQLite.Migrations
{
    /// <inheritdoc />
    public partial class AddProps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentHash",
                table: "UniversityDocuments",
                type: "TEXT",
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "SearchIndexError",
                table: "UniversityDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SearchIndexStatus",
                table: "UniversityDocuments",
                type: "TEXT",
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SearchIndexedAt",
                table: "UniversityDocuments",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentHash",
                table: "UniversityDocuments");

            migrationBuilder.DropColumn(
                name: "SearchIndexError",
                table: "UniversityDocuments");

            migrationBuilder.DropColumn(
                name: "SearchIndexStatus",
                table: "UniversityDocuments");

            migrationBuilder.DropColumn(
                name: "SearchIndexedAt",
                table: "UniversityDocuments");
        }
    }
}
