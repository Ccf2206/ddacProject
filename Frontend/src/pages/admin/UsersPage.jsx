import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import { usersAPI, rolesAPI } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import { PERMISSIONS } from '../../utils/permissions';

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', roleId: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                usersAPI.getAll(),
                rolesAPI.getAll()
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await usersAPI.create(formData);
            setShowUserForm(false);
            setFormData({ name: '', email: '', phone: '', password: '', roleId: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error creating user: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await usersAPI.delete(selectedUser.userId);
            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleStatusChange = async (user, newStatus) => {
        try {
            await usersAPI.changeStatus(user.userId, newStatus);
            fetchData();
        } catch (error) {
            console.error('Error changing status:', error);
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Phone', accessor: 'phone' },
        {
            header: 'Role',
            accessor: 'roleName',
            render: (row) => (
                <span className="badge badge-info">{row.roleName}</span>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className={`badge ${row.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Created',
            accessor: 'createdAt',
            render: (row) => new Date(row.createdAt).toLocaleDateString()
        },
        {
            header: 'Actions',
            render: (row) => (
                <PermissionGuard permission={PERMISSIONS.USERS_MANAGE}>
                    <div className="flex space-x-2">
                        {row.status === 'Active' ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(row, 'Inactive'); }}
                                className="text-sm text-orange-600 hover:text-orange-800"
                            >
                                Deactivate
                            </button>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(row, 'Active'); }}
                                className="text-sm text-green-600 hover:text-green-800"
                            >
                                Activate
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setShowDeleteModal(true); }}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            Delete
                        </button>
                    </div>
                </PermissionGuard>
            )
        }
    ];

    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
                    <PermissionGuard permission={PERMISSIONS.USERS_MANAGE}>
                        <button
                            onClick={() => setShowUserForm(!showUserForm)}
                            className="btn btn-primary"
                        >
                            {showUserForm ? 'Cancel' : '+ New User'}
                        </button>
                    </PermissionGuard>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <SearchBar 
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search users by name, email, phone, or role..."
                    />
                </div>

                {showUserForm && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                >
                                    <option value="">Select a role</option>
                                    {roles.map((role) => (
                                        <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card">
                    {loading ? (
                        <p>Loading users...</p>
                    ) : (
                        <>
                            <div className="mb-4 text-sm text-gray-600">
                                Showing {filteredUsers.length} of {users.length} users
                            </div>
                            <DataTable columns={columns} data={filteredUsers} />
                        </>
                    )}
                </div>

                <ConfirmModal
                    isOpen={showDeleteModal}
                    title="Delete User"
                    message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
                    onConfirm={handleDeleteUser}
                    onCancel={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                    danger={true}
                />
            </div>
        </div>
    );
}

export default UsersPage;
