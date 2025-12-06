using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ddacProject.Migrations
{
    /// <inheritdoc />
    public partial class AddDateOfBirthToTenants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "Tenants",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Tenants");
        }
    }
}
