import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import PermissionGuard from '../../components/PermissionGuard';
import { PERMISSIONS } from '../../utils/permissions';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        icNumber: '',
        dateOfBirth: '',
        emergencyContact: '',
        moveInDate: '',
        unitId: '',
        // Lease creation fields
        createLease: false,
        leaseStartDate: '',
        leaseEndDate: '',
        rentAmount: '',
        depositAmount: ''
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
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/units?availableForTenant=true', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Units that haven't reached max tenant capacity
            setUnits(response.data);
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
            unitId: '',
            createLease: false,
            leaseStartDate: '',
            leaseEndDate: '',
            rentAmount: '',
            depositAmount: ''
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
        
        // Trim all string inputs and check for whitespace-only inputs
        const trimmedData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: formData.phone.trim(),
            icNumber: formData.icNumber.trim(),
            dateOfBirth: formData.dateOfBirth,
            emergencyContact: formData.emergencyContact.trim(),
            moveInDate: formData.moveInDate,
            unitId: formData.unitId
        };

        // Validate name - text only (letters and spaces)
        if (!trimmedData.name || !/^[a-zA-Z\s]+$/.test(trimmedData.name)) {
            alert('Name should only contain letters and spaces');
            return;
        }

        // Validate password (only for new tenants)
        if (!isEditMode) {
            if (!trimmedData.password || trimmedData.password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }
            if (/\s/.test(trimmedData.password)) {
                alert('Password should not contain spaces');
                return;
            }
        }

        // Validate IC number - max 14 characters, integers and hyphens only
        if (!trimmedData.icNumber) {
            alert('IC Number is required');
            return;
        }
        if (!/^[0-9-]+$/.test(trimmedData.icNumber)) {
            alert('IC Number should only contain numbers and hyphens');
            return;
        }
        if (trimmedData.icNumber.length > 14) {
            alert('IC Number should not exceed 14 characters');
            return;
        }

        // Validate phone number - max 11 digits, integers only
        if (trimmedData.phone && !/^\d+$/.test(trimmedData.phone)) {
            alert('Phone number should only contain digits');
            return;
        }
        if (trimmedData.phone && trimmedData.phone.length > 11) {
            alert('Phone number should not exceed 11 digits');
            return;
        }

        // Validate date of birth - not future date
        if (trimmedData.dateOfBirth) {
            const dobDate = new Date(trimmedData.dateOfBirth);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dobDate > today) {
                alert('Date of birth cannot be a future date');
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');

            if (isEditMode) {
                // Check if any changes were made
                const originalUnitId = selectedTenant.currentUnitId ? selectedTenant.currentUnitId.toString() : '';
                const newUnitId = trimmedData.unitId.toString();
                
                const hasChanges = 
                    trimmedData.name !== (selectedTenant.user?.name || '') ||
                    trimmedData.email !== (selectedTenant.user?.email || '') ||
                    trimmedData.phone !== (selectedTenant.user?.phone || '') ||
                    trimmedData.icNumber !== (selectedTenant.icNumber || '') ||
                    trimmedData.dateOfBirth !== (selectedTenant.dateOfBirth?.split('T')[0] || '') ||
                    trimmedData.emergencyContact !== (selectedTenant.emergencyContact || '') ||
                    trimmedData.moveInDate !== (selectedTenant.moveInDate?.split('T')[0] || '') ||
                    newUnitId !== originalUnitId;

                if (!hasChanges) {
                    setShowFormModal(false);
                    return;
                }

                // Update existing tenant
                const updateData = {
                    name: trimmedData.name,
                    email: trimmedData.email,
                    phone: trimmedData.phone,
                    icNumber: trimmedData.icNumber,
                    dateOfBirth: trimmedData.dateOfBirth,
                    emergencyContact: trimmedData.emergencyContact,
                    moveInDate: trimmedData.moveInDate || null,
                    unitId: trimmedData.unitId ? parseInt(trimmedData.unitId) : null
                };

                await axios.put(
                    `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/tenants/${selectedTenant.tenantId}`,
                    updateData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                alert('Tenant updated successfully!');
            } else {
                // Create new tenant
                const createData = {
                    name: trimmedData.name,
                    email: trimmedData.email,
                    password: trimmedData.password,
                    phone: trimmedData.phone,
                    icNumber: trimmedData.icNumber,
                    dateOfBirth: trimmedData.dateOfBirth,
                    emergencyContact: trimmedData.emergencyContact,
                    moveInDate: trimmedData.moveInDate || null,
                    unitId: trimmedData.unitId ? parseInt(trimmedData.unitId) : null
                };
                
                // Add lease fields if creating lease
                if (formData.createLease && formData.unitId) {
                    if (!formData.leaseStartDate || !formData.leaseEndDate || !formData.rentAmount || !formData.depositAmount) {
                        alert('Please fill in all lease fields (Start Date, End Date, Rent Amount, Deposit Amount)');
                        return;
                    }
                    
                    // Validate lease duration is at least 30 days (1 month)
                    const startDate = new Date(formData.leaseStartDate);
                    const endDate = new Date(formData.leaseEndDate);
                    const daysDifference = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
                    
                    if (daysDifference < 30) {
                        alert('Lease duration must be at least 30 days (1 month)');
                        return;
                    }
                    
                    createData.leaseStartDate = formData.leaseStartDate;
                    createData.leaseEndDate = formData.leaseEndDate;
                    createData.rentAmount = parseFloat(formData.rentAmount);
                    createData.depositAmount = parseFloat(formData.depositAmount);
                }

                await axios.post(
                    'http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/tenants',
                    createData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                alert('Tenant created successfully!' + (formData.createLease ? ' Lease and monthly invoices generated automatically.' : ''));
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
                    <PermissionGuard permission={PERMISSIONS.TENANTS_EDIT}>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(row); }}
                            className="text-sm text-primary-600 hover:text-primary-800"
                        >
                            Edit
                        </button>
                    </PermissionGuard>
                    <PermissionGuard permission={PERMISSIONS.TENANTS_DELETE}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedTenant(row); setShowDeleteModal(true); }}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            Delete
                        </button>
                    </PermissionGuard>
                </div>
            )
        }
    ];

    // Filter tenants based on search term
    const filteredTenants = tenants.filter(tenant =>
        tenant.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.user?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.icNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.currentUnit?.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Tenant Management</h2>
                    <PermissionGuard permission={PERMISSIONS.TENANTS_CREATE}>
                        <button
                            onClick={handleOpenAddModal}
                            className="btn btn-primary"
                        >
                            + Add Tenant
                        </button>
                    </PermissionGuard>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search tenants by name, email, phone, IC number, or unit..."
                    />
                </div>

                <div className="card">
                    {loading ? (
                        <p>Loading tenants...</p>
                    ) : (
                        <>
                            <div className="mb-4 text-sm text-gray-600">
                                Showing {filteredTenants.length} of {tenants.length} tenants
                            </div>
                            <DataTable columns={columns} data={filteredTenants} />
                        </>
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
                                            pattern="[a-zA-Z\s]+"
                                            title="Name should only contain letters and spaces"
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
                                                minLength={6}
                                                title="Password must be at least 6 characters and should not contain spaces"
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
                                            pattern="\d{1,11}"
                                            maxLength={11}
                                            title="Phone number should only contain digits (max 11)"
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
                                            pattern="[0-9-]+"
                                            maxLength={14}
                                            title="IC Number should only contain numbers and hyphens (max 14 characters)"
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
                                            max={new Date().toISOString().split('T')[0]}
                                            title="Date of birth cannot be a future date"
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
                                            Only available units (not occupied or under active lease) are shown
                                        </p>
                                    </div>

                                    {/* Auto-create Lease Section */}
                                    {!isEditMode && formData.unitId && (
                                        <div className="border-t pt-4">
                                            <div className="flex items-center mb-3">
                                                <input
                                                    type="checkbox"
                                                    id="createLease"
                                                    checked={formData.createLease}
                                                    onChange={(e) => setFormData({ ...formData, createLease: e.target.checked })}
                                                    className="mr-2"
                                                />
                                                <label htmlFor="createLease" className="text-sm font-medium text-gray-700">
                                                    Automatically create lease for this tenant
                                                </label>
                                            </div>
                                            
                                            {formData.createLease && (
                                                <div className="space-y-3 bg-gray-50 p-4 rounded">
                                                    <p className="text-xs text-gray-600 mb-2">
                                                        Creating a lease will automatically generate monthly invoices
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Lease Start Date *
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={formData.leaseStartDate}
                                                                onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })}
                                                                className="input"
                                                                min={new Date().toISOString().split('T')[0]}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Lease End Date *
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={formData.leaseEndDate}
                                                                onChange={(e) => setFormData({ ...formData, leaseEndDate: e.target.value })}
                                                                className="input"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Monthly Rent Amount *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.rentAmount}
                                                                onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                                                                className="input"
                                                                placeholder="e.g., 1500.00"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Deposit Amount *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.depositAmount}
                                                                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                                                className="input"
                                                                placeholder="e.g., 3000.00"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

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
