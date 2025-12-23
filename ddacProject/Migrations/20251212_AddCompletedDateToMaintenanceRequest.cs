using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ddacProject.Migrations
{
    /// <inheritdoc />
    public partial class AddCompletedDateToMaintenanceRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedDate",
                table: "MaintenanceRequests",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedDate",
                table: "MaintenanceRequests");
        }
    }
}
