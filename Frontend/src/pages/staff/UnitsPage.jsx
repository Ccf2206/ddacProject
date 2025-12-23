import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import SearchBar from '../../components/SearchBar';
import UnitForm from '../../components/UnitForm';
import ConfirmModal from '../../components/ConfirmModal';
import PermissionGuard from '../../components/PermissionGuard';
import { PERMISSIONS } from '../../utils/permissions';
import { unitsAPI } from '../../services/api';

function UnitsPage() {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [showForm, setShowForm] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState(null);

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        try {
            const response = await unitsAPI.getAll({});
            setUnits(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching units:', error);
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingUnit(null);
        setShowForm(true);
    };

    const handleEdit = (unit) => {
        setEditingUnit(unit);
        setShowForm(true);
    };

    const handleSubmit = async (formData) => {
        try {
            if (editingUnit) {
                await unitsAPI.update(editingUnit.unitId, formData);
            } else {
                await unitsAPI.create(formData);
            }
            setShowForm(false);
            setEditingUnit(null);
            fetchUnits();
        } catch (error) {
            console.error('Error saving unit:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async () => {
        if (!deletingUnit) return;
        try {
            await unitsAPI.delete(deletingUnit.unitId);
            setShowDeleteModal(false);
            setDeletingUnit(null);
            fetchUnits();
        } catch (error) {
            console.error('Error deleting unit:', error);
            alert('Error deleting unit');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            Available: 'badge-success',
            Occupied: 'badge-danger',
            Reserved: 'badge-warning',
            Maintenance: 'badge-info',
        };
        return badges[status] || 'badge-info';
    };

    // Apply search and status filter
    const filteredUnits = units.filter(unit => {
        const matchesSearch = 
            unit.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.floor?.building?.buildingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.floor?.building?.property?.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.status?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filter === '' || unit.status === filter;
        
        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUnits = filteredUnits.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Units Management</h2>
                    <PermissionGuard permission={PERMISSIONS.UNITS_CREATE}>
                        <button onClick={handleCreate} className="btn btn-primary">
                            + New Unit
                        </button>
                    </PermissionGuard>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="mb-4">
                        <SearchBar
                            value={searchTerm}
                            onChange={(value) => {
                                setSearchTerm(value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by unit number, type, building, property, or status..."
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { setFilter(''); setCurrentPage(1); }}
                            className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            All ({units.length})
                        </button>
                        {Array.from(new Set(units.map(u => u.status))).sort().map(status => (
                            <button
                                key={status}
                                onClick={() => { setFilter(status); setCurrentPage(1); }}
                                className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                {status} ({units.filter(u => u.status === status).length})
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        Showing {currentUnits.length} of {filteredUnits.length} units (Page {currentPage} of {totalPages || 1})
                    </p>
                </div>

                {/* Units Grid */}
                {loading ? (
                    <p>Loading units...</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentUnits.map((unit) => (
                            <div key={unit.unitId} className="card hover:shadow-xl transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-800">{unit.unitNumber}</h3>
                                        <p className="text-sm text-gray-600">{unit.type}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {unit.floor?.building?.property?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`badge ${getStatusBadge(unit.status)}`}>
                                        {unit.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Size:</span>
                                        <span className="font-medium">{unit.size} sq ft</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Rent:</span>
                                        <span className="font-medium text-primary-600">RM{unit.rentPrice}/mo</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Deposit:</span>
                                        <span className="font-medium">RM{unit.depositAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Max Tenants:</span>
                                        <span className="font-medium">{unit.maxTenants}</span>
                                    </div>
                                </div>

                                {unit.notes && (
                                    <p className="mt-4 text-sm text-gray-600 border-t pt-4">
                                        {unit.notes}
                                    </p>
                                )}
                                {!unit.notes && (
                                    <p className="mt-4 text-sm text-gray-400 italic border-t pt-4">
                                        No note
                                    </p>
                                )}

                                <div className="mt-4 flex space-x-2">
                                    <PermissionGuard permission={PERMISSIONS.UNITS_EDIT}>
                                        <button
                                            onClick={() => handleEdit(unit)}
                                            className="flex-1 text-sm text-primary-600 border border-primary-600 rounded px-3 py-1 hover:bg-primary-600 hover:text-white transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard permission={PERMISSIONS.UNITS_DELETE}>
                                        <button
                                            onClick={() => { setDeletingUnit(unit); setShowDeleteModal(true); }}
                                            className="flex-1 text-sm text-red-600 border border-red-600 rounded px-3 py-1 hover:bg-red-600 hover:text-white transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                            ))}
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
                )}                {filteredUnits.length === 0 && !loading && (
                    <div className="card text-center py-12">
                        <p className="text-gray-500 mb-4">No units found</p>
                        <button onClick={handleCreate} className="btn btn-primary">
                            Create Your First Unit
                        </button>
                    </div>
                )}
            </div>

            {showForm && (
                <UnitForm
                    unit={editingUnit}
                    onSubmit={handleSubmit}
                    onCancel={() => { setShowForm(false); setEditingUnit(null); }}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Unit"
                message={`Are you sure you want to delete unit ${deletingUnit?.unitNumber}?`}
                onConfirm={handleDelete}
                onCancel={() => { setShowDeleteModal(false); setDeletingUnit(null); }}
                danger={true}
            />
        </div>
    );
}

export default UnitsPage;
