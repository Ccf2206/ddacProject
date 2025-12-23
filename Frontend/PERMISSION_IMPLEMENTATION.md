# Frontend Permission System Implementation Guide

This guide explains how to integrate permission-based UI rendering in the React frontend.

## ? What's Been Set Up

### 1. **Permission Utilities** (`src/utils/permissions.js`)
- `PERMISSIONS` - Constants matching backend permissions
- `hasPermission()` - Check single permission
- `hasAnyPermission()` - Check if user has ANY of multiple permissions
- `hasAllPermissions()` - Check if user has ALL of multiple permissions

### 2. **Auth Store Updated** (`src/stores/authStore.js`)
- Now stores `permissions` array from user's role
- Automatically parses permissions from `user.role.permissions` on login
- Permissions persist in localStorage

### 3. **Permission Guard Component** (`src/components/PermissionGuard.jsx`)
- Conditional rendering based on permissions
- Usage: Wrap any UI element to show/hide based on permissions

### 4. **usePermissions Hook** (`src/hooks/usePermissions.js`)
- Easy access to permission checking functions
- Helper methods: `canView()`, `canCreate()`, `canEdit()`, `canDelete()`

## ?? How to Use in Your Pages

### Example 1: Hide/Show Buttons

```jsx
import PermissionGuard from '../../components/PermissionGuard';
import { PERMISSIONS } from '../../utils/permissions';

function MyPage() {
    return (
        <div>
            {/* Only show Create button if user has permission */}
            <PermissionGuard permission={PERMISSIONS.PROPERTIES_CREATE}>
                <button onClick={handleCreate}>
                    + New Property
                </button>
            </PermissionGuard>

            {/* Only show Edit button if user has permission */}
            <PermissionGuard permission={PERMISSIONS.PROPERTIES_EDIT}>
                <button onClick={handleEdit}>Edit</button>
            </PermissionGuard>

            {/* Only show Delete button if user has permission */}
            <PermissionGuard permission={PERMISSIONS.PROPERTIES_DELETE}>
                <button onClick={handleDelete}>Delete</button>
            </PermissionGuard>
        </div>
    );
}
```

### Example 2: Using the Hook

```jsx
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

function MyPage() {
    const { hasPermission, canEdit, canDelete } = usePermissions();

    return (
        <div>
            {canEdit('properties') && (
                <button onClick={handleEdit}>Edit</button>
            )}

            {canDelete('properties') && (
                <button onClick={handleDelete}>Delete</button>
            )}

            {hasPermission(PERMISSIONS.REPORTS_FINANCIAL_VIEW) && (
                <button onClick={viewReports}>View Reports</button>
            )}
        </div>
    );
}
```

### Example 3: Multiple Permissions (ANY)

```jsx
{/* Show if user has ANY of these permissions */}
<PermissionGuard permission={[
    PERMISSIONS.MAINTENANCE_VIEW_ALL,
    PERMISSIONS.MAINTENANCE_VIEW_ASSIGNED
]}>
    <MaintenanceList />
</PermissionGuard>
```

### Example 4: Multiple Permissions (ALL)

```jsx
{/* Show only if user has ALL of these permissions */}
<PermissionGuard 
    permission={[
        PERMISSIONS.PROPERTIES_VIEW,
        PERMISSIONS.PROPERTIES_EDIT
    ]}
    requireAll={true}
>
    <AdvancedEditor />
</PermissionGuard>
```

## ?? TODO: Apply to All Pages

You need to update these pages with permission guards:

### Staff Pages
- ? `PropertiesPage.jsx` - Already updated with example
- ? `UnitsPage.jsx` - Add UNITS_* permissions
- ? `TenantsPage.jsx` - Add TENANTS_* permissions
- ? `LeasesPage.jsx` - Add LEASES_* permissions
- ? `InvoicesPage.jsx` - Add INVOICES_* permissions
- ? `PaymentsPage.jsx` - Add PAYMENTS_* permissions
- ? `ExpensesPage.jsx` - Add EXPENSES_* permissions
- ? `MaintenancePage.jsx` - Add MAINTENANCE_* permissions
- ? `ReportsPage.jsx` - Add REPORTS_* permissions

### Admin Pages
- ? `UsersPage.jsx` - Add USERS_MANAGE permission
- ? `RolesPage.jsx` - Add ROLES_MANAGE permission
- ? `AuditLogsPage.jsx` - Add AUDIT_VIEW permission
- ? `ApprovalsPage.jsx` - Add APPROVALS_* permissions

### Navigation
- ? `Navbar.jsx` - Hide menu items based on VIEW permissions

## ?? Pattern to Follow

For each page, follow this pattern:

1. **Import Required Items:**
```jsx
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';
```

2. **Use Hook in Component:**
```jsx
const { canCreate, canEdit, canDelete } = usePermissions();
```

3. **Wrap Action Buttons:**
- Create buttons ? `PERMISSIONS.{MODULE}_CREATE`
- Edit buttons ? `PERMISSIONS.{MODULE}_EDIT`
- Delete buttons ? `PERMISSIONS.{MODULE}_DELETE`

4. **Example for Units Page:**
```jsx
<PermissionGuard permission={PERMISSIONS.UNITS_CREATE}>
    <button onClick={handleCreateUnit}>+ New Unit</button>
</PermissionGuard>

<PermissionGuard permission={PERMISSIONS.UNITS_EDIT}>
    <button onClick={() => handleEditUnit(unit)}>Edit</button>
</PermissionGuard>

<PermissionGuard permission={PERMISSIONS.UNITS_DELETE}>
    <button onClick={() => handleDeleteUnit(unit)}>Delete</button>
</PermissionGuard>
```

## ?? Available Permissions

All permissions are defined in `PERMISSIONS` object:

### Properties
- `PROPERTIES_VIEW`, `PROPERTIES_CREATE`, `PROPERTIES_EDIT`, `PROPERTIES_DELETE`

### Units
- `UNITS_VIEW`, `UNITS_CREATE`, `UNITS_EDIT`, `UNITS_DELETE`

### Tenants
- `TENANTS_VIEW`, `TENANTS_CREATE`, `TENANTS_EDIT`, `TENANTS_DELETE`

### Leases
- `LEASES_VIEW`, `LEASES_CREATE`, `LEASES_EDIT`, `LEASES_TERMINATE`

### Finance
- `INVOICES_VIEW`, `INVOICES_CREATE`
- `PAYMENTS_VIEW`, `PAYMENTS_CREATE`
- `EXPENSES_VIEW`, `EXPENSES_CREATE`

### Maintenance
- `MAINTENANCE_VIEW_ALL`, `MAINTENANCE_VIEW_ASSIGNED`
- `MAINTENANCE_CREATE`, `MAINTENANCE_ASSIGN`, `MAINTENANCE_UPDATE`
- `MAINTENANCE_ESCALATE`, `MAINTENANCE_SIGNOFF`

### Reports
- `REPORTS_FINANCIAL_VIEW`, `REPORTS_OCCUPANCY_VIEW`, `REPORTS_MAINTENANCE_VIEW`

### Admin
- `USERS_MANAGE`, `ROLES_MANAGE`, `AUDIT_VIEW`
- `APPROVALS_REVIEW`, `APPROVALS_SUBMIT`

## ?? UI/UX Best Practices

1. **Always hide, never disable** - If user can't perform an action, don't show the button
2. **Graceful degradation** - Page should still look good with buttons hidden
3. **Consistent spacing** - Use flexbox/grid that adapts when buttons are hidden
4. **Navigation** - Hide entire nav sections if user has no VIEW permission for that module

## ?? Testing

Test with different roles:
- **Admin** (permission: `["*"]`) - Should see everything
- **Staff** - Should see most features except admin-only
- **Technician** - Should only see maintenance features
- **Tenant** - Should only see tenant-specific features

Log in as each role and verify buttons appear/disappear correctly!
