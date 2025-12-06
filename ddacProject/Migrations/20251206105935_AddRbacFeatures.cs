using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ddacProject.Migrations
{
    /// <inheritdoc />
    public partial class AddRbacFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompletedByStaffId",
                table: "MaintenanceRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EscalatedToStaff",
                table: "MaintenanceRequests",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "EscalationNotes",
                table: "MaintenanceRequests",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "TemplateId",
                table: "Leases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReminderSentAt",
                table: "Invoices",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OverdueReminderCount",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "LeaseTemplates",
                columns: table => new
                {
                    TemplateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TemplateName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TemplateContent = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TemplateVariables = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaseTemplates", x => x.TemplateId);
                    table.ForeignKey(
                        name: "FK_LeaseTemplates_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ScheduledNotifications",
                columns: table => new
                {
                    ScheduledNotificationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NotificationType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RecipientId = table.Column<int>(type: "int", nullable: false),
                    TriggerDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    MessageTemplate = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RelatedEntityType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RelatedEntityId = table.Column<int>(type: "int", nullable: true),
                    SentAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduledNotifications", x => x.ScheduledNotificationId);
                    table.ForeignKey(
                        name: "FK_ScheduledNotifications_Users_RecipientId",
                        column: x => x.RecipientId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StaffActionApprovals",
                columns: table => new
                {
                    ApprovalId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    ActionType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TableName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RecordId = table.Column<int>(type: "int", nullable: false),
                    ActionData = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AdminId = table.Column<int>(type: "int", nullable: true),
                    AdminNotes = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmittedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffActionApprovals", x => x.ApprovalId);
                    table.ForeignKey(
                        name: "FK_StaffActionApprovals_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StaffActionApprovals_Users_AdminId",
                        column: x => x.AdminId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SystemConfigurations",
                columns: table => new
                {
                    ConfigurationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ConfigKey = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfigValue = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemConfigurations", x => x.ConfigurationId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequests_CompletedByStaffId",
                table: "MaintenanceRequests",
                column: "CompletedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Leases_TemplateId",
                table: "Leases",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseTemplates_CreatedByUserId",
                table: "LeaseTemplates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseTemplates_TemplateName_IsActive",
                table: "LeaseTemplates",
                columns: new[] { "TemplateName", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledNotifications_RecipientId",
                table: "ScheduledNotifications",
                column: "RecipientId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledNotifications_TriggerDate_Status",
                table: "ScheduledNotifications",
                columns: new[] { "TriggerDate", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffActionApprovals_AdminId",
                table: "StaffActionApprovals",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffActionApprovals_StaffId",
                table: "StaffActionApprovals",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffActionApprovals_Status",
                table: "StaffActionApprovals",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StaffActionApprovals_SubmittedAt",
                table: "StaffActionApprovals",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigurations_ConfigKey",
                table: "SystemConfigurations",
                column: "ConfigKey",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Leases_LeaseTemplates_TemplateId",
                table: "Leases",
                column: "TemplateId",
                principalTable: "LeaseTemplates",
                principalColumn: "TemplateId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Staff_CompletedByStaffId",
                table: "MaintenanceRequests",
                column: "CompletedByStaffId",
                principalTable: "Staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leases_LeaseTemplates_TemplateId",
                table: "Leases");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Staff_CompletedByStaffId",
                table: "MaintenanceRequests");

            migrationBuilder.DropTable(
                name: "LeaseTemplates");

            migrationBuilder.DropTable(
                name: "ScheduledNotifications");

            migrationBuilder.DropTable(
                name: "StaffActionApprovals");

            migrationBuilder.DropTable(
                name: "SystemConfigurations");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceRequests_CompletedByStaffId",
                table: "MaintenanceRequests");

            migrationBuilder.DropIndex(
                name: "IX_Leases_TemplateId",
                table: "Leases");

            migrationBuilder.DropColumn(
                name: "CompletedByStaffId",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "EscalatedToStaff",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "EscalationNotes",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "TemplateId",
                table: "Leases");

            migrationBuilder.DropColumn(
                name: "LastReminderSentAt",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "OverdueReminderCount",
                table: "Invoices");
        }
    }
}
