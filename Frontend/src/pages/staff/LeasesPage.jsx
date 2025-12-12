import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import SearchBar from '../../components/SearchBar';
import ConfirmModal from '../../components/ConfirmModal';
import { leasesAPI, tenantsAPI, unitsAPI } from '../../services/api';
import { FaFileContract, FaPlus, FaSync, FaBan } from 'react-icons/fa';

function LeasesPage() {
    const [leases, setLeases] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [selectedLease, setSelectedLease] = useState(null);
    const [formData, setFormData] = useState({
        tenantId: '',
        unitId: '',
        rentAmount: '',
        depositAmount: '',
        startDate: '',
        endDate: '',
        paymentCycle: 'Monthly'
    });

    useEffect(() => {
        fetchLeases();
        fetchTenants();
        fetchUnits();
    }, []);

    const fetchLeases = async () => {
        try {
            const response = await leasesAPI.getAll({});
            setLeases(response.data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const response = await tenantsAPI.getAll();
            setTenants(response.data);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await unitsAPI.getAll({});
            setUnits(response.data);
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const handleCreateLease = async (e) => {
        e.preventDefault();
        
        // Validate lease duration is at least 30 days (1 month)
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const daysDifference = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference < 30) {
            alert('Lease duration must be at least 30 days (1 month)');
            return;
        }
        
        try {
            await leasesAPI.create({
                ...formData,
                tenantId: parseInt(formData.tenantId),
                unitId: parseInt(formData.unitId),
                rentAmount: parseFloat(formData.rentAmount),
                depositAmount: parseFloat(formData.depositAmount)
            });
            alert('Lease created successfully!');
            setShowCreateModal(false);
            resetForm();
            fetchLeases();
        } catch (error) {
            alert('Error creating lease: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleRenewLease = async (e) => {
        e.preventDefault();
        if (!selectedLease) return;
        
        // Validate lease duration is at least 30 days (1 month)
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const daysDifference = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference < 30) {
            alert('Lease duration must be at least 30 days (1 month)');
            return;
        }
        
        try {
            await leasesAPI.create({
                tenantId: selectedLease.tenantId,
                unitId: selectedLease.unitId,
                rentAmount: parseFloat(formData.rentAmount || selectedLease.rentAmount),
                depositAmount: parseFloat(formData.depositAmount || selectedLease.depositAmount),
                startDate: formData.startDate,
                endDate: formData.endDate,
                paymentCycle: formData.paymentCycle || selectedLease.paymentCycle
            });
            alert('Lease renewed successfully!');
            setShowRenewModal(false);
            setSelectedLease(null);
            resetForm();
            fetchLeases();
        } catch (error) {
            alert('Error renewing lease: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleTerminateLease = async () => {
        if (!selectedLease) return;
        
        try {
            await leasesAPI.terminate(selectedLease.leaseId);
            alert('Lease terminated successfully!');
            setShowTerminateModal(false);
            setSelectedLease(null);
            fetchLeases();
        } catch (error) {
            alert('Error terminating lease: ' + (error.response?.data?.message || error.message));
        }
    };

    const resetForm = () => {
        setFormData({
            tenantId: '',
            unitId: '',
            rentAmount: '',
            depositAmount: '',
            startDate: '',
            endDate: '',
            paymentCycle: 'Monthly'
        });
    };

    const openRenewModal = (lease) => {
        setSelectedLease(lease);
        const today = new Date().toISOString().split('T')[0];
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        
        setFormData({
            rentAmount: lease.rentAmount,
            depositAmount: lease.depositAmount,
            startDate: today,
            endDate: oneYearLater.toISOString().split('T')[0],
            paymentCycle: lease.paymentCycle
        });
        setShowRenewModal(true);
    };

    const getAvailableUnits = () => {
        return units.filter(u => u.status === 'Available' || u.status === 'Reserved');
    };

    const getStatusBadge = (status) => {
        const badges = {
            Active: 'badge-success',
            Expired: 'badge-warning',
            Terminated: 'badge-danger',
        };
        return badges[status] || 'badge-info';
    };

    // Filter and search leases
    const filteredLeases = leases.filter(lease => {
        const matchesSearch = 
            lease.tenant?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lease.tenant?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lease.unit?.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filter === '' || lease.status === filter;
        
        return matchesSearch && matchesFilter;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLeases = filteredLeases.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLeases.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FaFileContract /> Leases Management
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <FaPlus /> Create Lease
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="card mb-6">
                    <div className="mb-4">
                        <SearchBar
                            value={searchTerm}
                            onChange={(value) => {
                                setSearchTerm(value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by tenant name, email, or unit number..."
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { setFilter(''); setCurrentPage(1); }}
                            className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            All ({leases.length})
                        </button>
                        {['Active', 'Expired', 'Terminated'].map(status => (
                            <button
                                key={status}
                                onClick={() => { setFilter(status); setCurrentPage(1); }}
                                className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                {status} ({leases.filter(l => l.status === status).length})
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        Showing {currentLeases.length} of {filteredLeases.length} leases (Page {currentPage} of {totalPages || 1})
                    </p>
                </div>

                {/* Leases Table */}
                {loading ? (
                    <p>Loading leases...</p>
                ) : (
                    <>
                        <div className="card overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentLeases.map((lease) => (
                                        <tr key={lease.leaseId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {lease.tenant?.user?.name || 'N/A'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {lease.tenant?.user?.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {lease.unit?.unitNumber || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                                                RM{lease.rentAmount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(lease.startDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(lease.endDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`badge ${getStatusBadge(lease.status)}`}>
                                                    {lease.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    {lease.status === 'Active' && (
                                                        <>
                                                            <button
                                                                onClick={() => openRenewModal(lease)}
                                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                                title="Renew Lease"
                                                            >
                                                                <FaSync /> Renew
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedLease(lease);
                                                                    setShowTerminateModal(true);
                                                                }}
                                                                className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                                                title="Terminate Lease"
                                                            >
                                                                <FaBan /> Terminate
                                                            </button>
                                                        </>
                                                    )}
                                                    {lease.status !== 'Active' && (
                                                        <span className="text-gray-400">No actions</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-2 mt-6">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Previous
                                </button>
                                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Last
                                </button>
                            </div>
                        )}
                    </>
                )}

                {filteredLeases.length === 0 && !loading && (
                    <div className="card text-center py-12">
                        <p className="text-gray-500 mb-4">No leases found</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            Create Your First Lease
                        </button>
                    </div>
                )}
            </div>

            {/* Create Lease Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-2xl font-bold mb-4">Create New Lease</h3>
                            <form onSubmit={handleCreateLease} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                                        <select
                                            value={formData.tenantId}
                                            onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                            className="input"
                                            required
                                        >
                                            <option value="">Select Tenant</option>
                                            {tenants.map(tenant => (
                                                <option key={tenant.tenantId} value={tenant.tenantId}>
                                                    {tenant.user?.name} - {tenant.user?.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                                        <select
                                            value={formData.unitId}
                                            onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                                            className="input"
                                            required
                                        >
                                            <option value="">Select Unit</option>
                                            {getAvailableUnits().map(unit => (
                                                <option key={unit.unitId} value={unit.unitId}>
                                                    {unit.unitNumber} - RM{unit.rentPrice}/mo ({unit.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.rentAmount}
                                            onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.depositAmount}
                                            onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="input"
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Cycle *</label>
                                    <select
                                        value={formData.paymentCycle}
                                        onChange={(e) => setFormData({ ...formData, paymentCycle: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">Create Lease</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            resetForm();
                                        }}
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

            {/* Renew Lease Modal */}
            {showRenewModal && selectedLease && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-2xl font-bold mb-4">Renew Lease</h3>
                            <div className="mb-4 p-4 bg-blue-50 rounded">
                                <p className="text-sm text-gray-700">
                                    <strong>Tenant:</strong> {selectedLease.tenant?.user?.name}<br/>
                                    <strong>Unit:</strong> {selectedLease.unit?.unitNumber}<br/>
                                    <strong>Current End Date:</strong> {new Date(selectedLease.endDate).toLocaleDateString()}
                                </p>
                            </div>
                            <form onSubmit={handleRenewLease} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Rent Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.rentAmount}
                                            onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Deposit Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.depositAmount}
                                            onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Start Date *</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="input"
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New End Date *</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Cycle *</label>
                                    <select
                                        value={formData.paymentCycle}
                                        onChange={(e) => setFormData({ ...formData, paymentCycle: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>
                                <p className="text-xs text-gray-600">
                                    Note: This will create a new lease record. The old lease will remain for historical purposes.
                                </p>
                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">Renew Lease</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowRenewModal(false);
                                            setSelectedLease(null);
                                            resetForm();
                                        }}
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

            {/* Terminate Lease Modal */}
            <ConfirmModal
                isOpen={showTerminateModal}
                title="Terminate Lease"
                message={`Are you sure you want to terminate the lease for ${selectedLease?.tenant?.user?.name} at unit ${selectedLease?.unit?.unitNumber}? This will: Mark the lease as Terminated, Set the unit status to Available, Remove the tenant from the unit, Keep the lease history for records.`}
                onConfirm={handleTerminateLease}
                onCancel={() => {
                    setShowTerminateModal(false);
                    setSelectedLease(null);
                }}
                danger={true}
            />
        </div>
    );
}

export default LeasesPage;
