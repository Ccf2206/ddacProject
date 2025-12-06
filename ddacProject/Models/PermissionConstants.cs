namespace ddacProject.Models
{
    public static class PermissionConstants
    {
        // Properties
        public const string PROPERTIES_VIEW = "properties.view";
        public const string PROPERTIES_CREATE = "properties.create";
        public const string PROPERTIES_EDIT = "properties.edit";
        public const string PROPERTIES_DELETE = "properties.delete";

        // Units
        public const string UNITS_VIEW = "units.view";
        public const string UNITS_CREATE = "units.create";
        public const string UNITS_EDIT = "units.edit";
        public const string UNITS_DELETE = "units.delete";

        // Tenants
        public const string TENANTS_VIEW = "tenants.view";
        public const string TENANTS_CREATE = "tenants.create";
        public const string TENANTS_EDIT = "tenants.edit";
        public const string TENANTS_DELETE = "tenants.delete";

        // Leases
        public const string LEASES_VIEW = "leases.view";
        public const string LEASES_CREATE = "leases.create";
        public const string LEASES_EDIT = "leases.edit";
        public const string LEASES_TERMINATE = "leases.terminate";

        // Finance
        public const string INVOICES_VIEW = "invoices.view";
        public const string INVOICES_CREATE = "invoices.create";
        public const string PAYMENTS_VIEW = "payments.view";
        public const string PAYMENTS_CREATE = "payments.create";
        public const string EXPENSES_VIEW = "expenses.view";
        public const string EXPENSES_CREATE = "expenses.create";

        // Maintenance
        public const string MAINTENANCE_VIEW_ALL = "maintenance.view.all";
        public const string MAINTENANCE_VIEW_ASSIGNED = "maintenance.view.assigned";
        public const string MAINTENANCE_ASSIGN = "maintenance.assign";
        public const string MAINTENANCE_UPDATE = "maintenance.update";
        public const string MAINTENANCE_CREATE = "maintenance.create";
        public const string MAINTENANCE_ESCALATE = "maintenance.escalate";
        public const string MAINTENANCE_SIGNOFF = "maintenance.signoff";

        // Reports
        public const string REPORTS_FINANCIAL_VIEW = "reports.financial.view";
        public const string REPORTS_OCCUPANCY_VIEW = "reports.occupancy.view";
        public const string REPORTS_MAINTENANCE_VIEW = "reports.maintenance.view";

        // Approvals
        public const string APPROVALS_REVIEW = "approvals.review";
        public const string APPROVALS_SUBMIT = "approvals.submit";

        // Admin
        public const string USERS_MANAGE = "users.manage";
        public const string ROLES_MANAGE = "roles.manage";
        public const string AUDIT_VIEW = "audit.view";

        // Wildcard permissions
        public const string ALL_PERMISSIONS = "*";
    }
}
