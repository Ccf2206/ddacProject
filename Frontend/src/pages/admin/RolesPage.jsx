import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import { rolesAPI } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import { PERMISSIONS } from '../../utils/permissions';

function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ roleName: '', permissions: [] });
    const [searchTerm, setSearchTerm] = useState('');

    // Available permissions grouped by module
    const permissionGroups = {
        Properties: ['properties.view', 'properties.create', 'properties.edit', 'properties.delete', 'properties.*'],
        Units: ['units.view', 'units.create', 'units.edit', 'units.delete', 'units.*'],
        Tenants: ['tenants.view', 'tenants.create', 'tenants.edit', 'tenants.delete', 'tenants.*'],
        Leases: ['leases.view', 'leases.create', 'leases.edit', 'leases.terminate', 'leases.*'],
        Invoices: ['invoices.view', 'invoices.create'],
        Payments: ['payments.view', 'payments.create'],
        Expenses: ['expenses.view', 'expenses.create'],
        Maintenance: ['maintenance.view.all', 'maintenance.view.assigned', 'maintenance.assign', 'maintenance.update', 'maintenance.create', 'maintenance.escalate', 'maintenance.signoff'],
        Reports: ['reports.financial.view', 'reports.occupancy.view', 'reports.maintenance.view'],
        Admin: ['users.manage', 'roles.manage', 'audit.view', 'lease.templates.manage', '*']
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await rolesAPI.getAll();
            setRoles(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching roles:', error);
            setLoading(false);
        }
    };

    const handleSubmitRole = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await rolesAPI.update(editingRole.roleId, formData);
                alert('Role updated successfully!');
            } else {
                await rolesAPI.create(formData);
                alert('Role created successfully!');
            }
            setShowRoleForm(false);
            setEditingRole(null);
            setFormData({ roleName: '', permissions: [] });
            fetchRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            alert('Error saving role: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setFormData({
            roleName: role.roleName,
            permissions: role.permissions || []
        });
        setShowRoleForm(true);
    };

    const handleCancelEdit = () => {
        setShowRoleForm(false);
        setEditingRole(null);
        setFormData({ roleName: '', permissions: [] });
    };

    const handleDeleteRole = async () => {
        if (!selectedRole) return;
        try {
            await rolesAPI.delete(selectedRole.roleId);
            setShowDeleteModal(false);
            setSelectedRole(null);
            fetchRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const togglePermission = (permission) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const columns = [
        { header: 'Role Name', accessor: 'roleName', render: (row) => <span className="font-semibold">{row.roleName}</span> },
        { header: 'Users', accessor: 'userCount', render: (row) => <span className="badge badge-info">{row.userCount} users</span> },
        {
            header: 'Permissions',
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.permissions.slice(0, 3).map((perm, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{perm}</span>
                    ))}
                    {row.permissions.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">+{row.permissions.length - 3} more</span>
                    )}
                </div>
            )
        },
        { header: 'Created', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() },
        {
            header: 'Actions',
            render: (row) => (
                <PermissionGuard permission={PERMISSIONS.ROLES_MANAGE}>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEditRole(row); }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Edit
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRole(row); setShowDeleteModal(true); }}
                            className="text-sm text-red-600 hover:text-red-800"
                            disabled={row.userCount > 0}
                        >
                            {row.userCount > 0 ? 'Cannot Delete' : 'Delete'}
                        </button>
                    </div>
                </PermissionGuard>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Role Management</h2>
                    <PermissionGuard permission={PERMISSIONS.ROLES_MANAGE}>
                        <button
                            onClick={() => showRoleForm ? handleCancelEdit() : setShowRoleForm(true)}
                            className="btn btn-primary"
                        >
                            {showRoleForm ? 'Cancel' : '+ New Role'}
                        </button>
                    </PermissionGuard>
                </div>

                {showRoleForm && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
                        <form onSubmit={handleSubmitRole}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                <input
                                    type="text"
                                    value={formData.roleName}
                                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                                    className="input"
                                    disabled={editingRole !== null}
                                    required
                                />
                                {editingRole && (
                                    <p className="text-xs text-gray-500 mt-1">Role name cannot be changed after creation</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                <div className="space-y-4">
                                    {Object.entries(permissionGroups).map(([group, permissions]) => (
                                        <div key={group} className="border rounded-lg p-4">
                                            <h4 className="font-medium text-gray-800 mb-2">{group}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {permissions.map((perm) => (
                                                    <label key={perm} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.permissions.includes(perm)}
                                                            onChange={() => togglePermission(perm)}
                                                            className="rounded text-primary-600"
                                                        />
                                                        <span className="text-sm">{perm}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button type="submit" className="btn btn-primary">
                                    {editingRole ? 'Update Role' : 'Create Role'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleCancelEdit}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card">
                    <div className="mb-4">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search by role name or permissions..."
                        />
                        <p className="text-sm text-gray-600 mt-2">
                            Showing {roles.filter(role =>
                                role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                role.permissions.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
                            ).length} of {roles.length} roles
                        </p>
                    </div>
                    {loading ? (
                        <p>Loading roles...</p>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={roles.filter(role =>
                                role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                role.permissions.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
                            )}
                        />
                    )}
                </div>

                <ConfirmModal
                    isOpen={showDeleteModal}
                    title="Delete Role"
                    message={
                        selectedRole?.userCount > 0
                            ? `Cannot delete the ${selectedRole?.roleName} role because it has ${selectedRole?.userCount} user(s) assigned. Please reassign or remove these users before deleting the role.`
                            : `Are you sure you want to delete the ${selectedRole?.roleName} role? This action cannot be undone.`
                    }
                    onConfirm={selectedRole?.userCount > 0 ? undefined : handleDeleteRole}
                    onCancel={() => { setShowDeleteModal(false); setSelectedRole(null); }}
                    danger={true}
                    confirmText={selectedRole?.userCount > 0 ? undefined : "Delete"}
                    cancelText={selectedRole?.userCount > 0 ? "Close" : "Cancel"}
                />
            </div>
        </div>
    );
}

export default RolesPage;
