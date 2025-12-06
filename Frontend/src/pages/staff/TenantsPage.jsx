import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import { tenantsAPI } from '../../services/api';
import axios from 'axios';

function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        icNumber: '',
        dateOfBirth: '',
        emergencyContact: '',
        moveInDate: '',
        unitId: ''
    });

    useEffect(() => {
        fetchTenants();
        fetchUnits();
    }, []);

    const fetchTenants = async () => {
        try {
            const response = await tenantsAPI.getAll();
            setTenants(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tenants:', error);
            setLoading(false);
        }
    };

    const fetchUnits = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/units', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter for available units
            const availableUnits = response.data.filter(u => u.status === 'Available');
            setUnits(availableUnits);
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditMode(false);
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            icNumber: '',
            dateOfBirth: '',
            emergencyContact: '',
            moveInDate: '',
            unitId: ''
        });
        setShowFormModal(true);
    };

    const handleOpenEditModal = (tenant) => {
        setIsEditMode(true);
        setSelectedTenant(tenant);
        setFormData({
            name: tenant.user?.name || '',
            email: tenant.user?.email || '',
            password: '', // Don't pre-fill password
            phone: tenant.user?.phone || '',
            icNumber: tenant.icNumber || '',
            dateOfBirth: tenant.dateOfBirth?.split('T')[0] || '',
            emergencyContact: tenant.emergencyContact || '',
            moveInDate: tenant.moveInDate?.split('T')[0] || '',
            unitId: tenant.currentUnitId || ''
        });
        setShowFormModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (isEditMode) {
                // Update existing tenant
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    icNumber: formData.icNumber,
                    dateOfBirth: formData.dateOfBirth,
                    emergencyContact: formData.emergencyContact,
                    moveInDate: formData.moveInDate || null,
                    unitId: formData.unitId ? parseInt(formData.unitId) : null
                };

                await axios.put(
                    `http://localhost:5000/api/tenants/${selectedTenant.tenantId}`,
                    updateData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                alert('Tenant updated successfully!');
            } else {
                // Create new tenant
                const createData = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    icNumber: formData.icNumber,
                    dateOfBirth: formData.dateOfBirth,
                    emergencyContact: formData.emergencyContact,
                    moveInDate: formData.moveInDate || null,
                    unitId: formData.unitId ? parseInt(formData.unitId) : null
                };

                await axios.post(
                    'http://localhost:5000/api/tenants',
                    createData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                alert('Tenant created successfully!');
            }

            setShowFormModal(false);
            fetchTenants();
            fetchUnits(); // Refresh units to update availability
        } catch (error) {
            console.error('Error saving tenant:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteTenant = async () => {
        if (!selectedTenant) return;
        try {
            await tenantsAPI.delete(selectedTenant.tenantId);
            setShowDeleteModal(false);
            setSelectedTenant(null);
            fetchTenants();
            fetchUnits(); // Refresh units
        } catch (error) {
            console.error('Error deleting tenant:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const columns = [
        {
            header: 'Name',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.user?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{row.user?.email}</div>
                </div>
            )
        },
        { header: 'IC Number', accessor: 'icNumber' },
        { header: 'Phone', accessor: 'user', render: (row) => row.user?.phone || 'N/A' },
        {
            header: 'Current Unit',
            render: (row) => row.currentUnit?.unitNumber ? (
                <span className="badge badge-success">{row.currentUnit.unitNumber}</span>
            ) : (
                <span className="text-gray-500">No unit</span>
            )
        },
        {
            header: 'Move In Date',
            accessor: 'moveInDate',
            render: (row) => row.moveInDate ? new Date(row.moveInDate).toLocaleDateString() : 'N/A'
        },
        {
            header: 'Emergency Contact',
            accessor: 'emergencyContact',
            render: (row) => (
                <div className="text-sm text-gray-600">{row.emergencyContact || 'N/A'}</div>
            )
        },
        {
            header: 'Actions',
            render: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(row); }}
                        className="text-sm text-primary-600 hover:text-primary-800"
                    >
                        Edit
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTenant(row); setShowDeleteModal(true); }}
                        className="text-sm text-red-600 hover:text-red-800"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Tenant Management</h2>
                    <button
                        onClick={handleOpenAddModal}
                        className="btn btn-primary"
                    >
                        + Add Tenant
                    </button>
                </div>

                <div className="card">
                    {loading ? (
                        <p>Loading tenants...</p>
                    ) : (
                        <DataTable columns={columns} data={tenants} />
                    )}
                </div>

                {/* Add/Edit Modal */}
                {showFormModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold">
                                        {isEditMode ? 'Edit Tenant' : 'Add New Tenant'}
                                    </h3>
                                    <button
                                        onClick={() => setShowFormModal(false)}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>

                                    {/* Password (only for new tenants) */}
                                    {!isEditMode && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="input"
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="input"
                                        />
                                    </div>

                                    {/* IC Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            IC Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.icNumber}
                                            onChange={(e) => setFormData({ ...formData, icNumber: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>

                                    {/* Date of Birth */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date of Birth *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>

                                    {/* Emergency Contact */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Emergency Contact
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.emergencyContact}
                                            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                            className="input"
                                            placeholder="Name: Phone"
                                        />
                                    </div>

                                    {/* Move In Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Move In Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.moveInDate}
                                            onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                                            className="input"
                                        />
                                    </div>

                                    {/* Unit Assignment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Assign Unit
                                        </label>
                                        <select
                                            value={formData.unitId}
                                            onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                                            className="input"
                                        >
                                            <option value="">No unit assigned</option>
                                            {units.map((unit) => (
                                                <option key={unit.unitId} value={unit.unitId}>
                                                    {unit.unitNumber} - RM {unit.rentPrice}/month
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Only available units are shown
                                        </p>
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button type="submit" className="btn btn-primary flex-1">
                                            {isEditMode ? 'Update Tenant' : 'Create Tenant'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowFormModal(false)}
                                            className="btn btn-secondary flex-1"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    isOpen={showDeleteModal}
                    title="Delete Tenant"
                    message={`Are you sure you want to delete ${selectedTenant?.user?.name}? This action cannot be undone.`}
                    onConfirm={handleDeleteTenant}
                    onCancel={() => { setShowDeleteModal(false); setSelectedTenant(null); }}
                    danger={true}
                />
            </div>
        </div>
    );
}

export default TenantsPage;
