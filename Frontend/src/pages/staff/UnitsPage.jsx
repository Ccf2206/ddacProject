import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import UnitForm from '../../components/UnitForm';
import ConfirmModal from '../../components/ConfirmModal';
import { unitsAPI } from '../../services/api';

function UnitsPage() {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
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

    const filteredUnits = units.filter(unit =>
        filter === '' || unit.status === filter
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Units Management</h2>
                    <button onClick={handleCreate} className="btn btn-primary">
                        + New Unit
                    </button>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setFilter('')}
                            className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            All ({units.length})
                        </button>
                        <button
                            onClick={() => setFilter('Available')}
                            className={`btn ${filter === 'Available' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            Available ({units.filter(u => u.status === 'Available').length})
                        </button>
                        <button
                            onClick={() => setFilter('Occupied')}
                            className={`btn ${filter === 'Occupied' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            Occupied ({units.filter(u => u.status === 'Occupied').length})
                        </button>
                    </div>
                </div>

                {/* Units Grid */}
                {loading ? (
                    <p>Loading units...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUnits.map((unit) => (
                            <div key={unit.unitId} className="card hover:shadow-xl transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-800">{unit.unitNumber}</h3>
                                        <p className="text-sm text-gray-600">{unit.type}</p>
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

                                <div className="mt-4 flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(unit)}
                                        className="flex-1 text-sm text-primary-600 hover:text-primary-800 border border-primary-600 rounded px-3 py-1"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { setDeletingUnit(unit); setShowDeleteModal(true); }}
                                        className="flex-1 text-sm text-red-600 hover:text-red-800 border border-red-600 rounded px-3 py-1"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredUnits.length === 0 && !loading && (
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
