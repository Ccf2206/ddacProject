import { useState, useEffect } from 'react';
import { propertiesAPI } from '../services/api';

function UnitForm({ unit, onSubmit, onCancel }) {
    const [properties, setProperties] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [formData, setFormData] = useState({
        floorId: '',
        unitNumber: '',
        size: '',
        type: '',
        rentPrice: '',
        depositAmount: '',
        maxTenants: 1,
        status: 'Available',
        notes: ''
    });

    useEffect(() => {
        fetchProperties();
        if (unit) {
            setFormData({
                floorId: unit.floorId || '',
                unitNumber: unit.unitNumber || '',
                size: unit.size || '',
                type: unit.type || '',
                rentPrice: unit.rentPrice || '',
                depositAmount: unit.depositAmount || '',
                maxTenants: unit.maxTenants || 1,
                status: unit.status || 'Available',
                notes: unit.notes || ''
            });
        }
    }, [unit]);

    const fetchProperties = async () => {
        try {
            const response = await propertiesAPI.getAll();
            setProperties(response.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handlePropertyChange = (propertyId) => {
        const property = properties.find(p => p.propertyId === parseInt(propertyId));
        setBuildings(property?.buildings || []);
        setFloors([]);
    };

    const handleBuildingChange = (buildingId) => {
        const building = buildings.find(b => b.buildingId === parseInt(buildingId));
        setFloors(building?.floors || []);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Trim notes to treat whitespace-only as empty
        const submissionData = {
            ...formData,
            notes: formData.notes?.trim() || null
        };
        onSubmit(submissionData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {unit ? 'Edit Unit' : 'Create New Unit'}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            {unit && (
                                <div className="col-span-2 bg-gray-50 p-3 rounded border border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Property:</span> {unit.floor?.building?.property?.name || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Building:</span> {unit.floor?.building?.name || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Floor:</span> {unit.floor?.floorNumber || 'N/A'}
                                    </p>
                                </div>
                            )}

                            {!unit && (
                                <>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                                        <select onChange={(e) => handlePropertyChange(e.target.value)} className="input" required>
                                            <option value="">Select Property</option>
                                            {properties.map(p => (
                                                <option key={p.propertyId} value={p.propertyId}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Building *</label>
                                        <select onChange={(e) => handleBuildingChange(e.target.value)} className="input" required disabled={!buildings.length}>
                                            <option value="">Select Building</option>
                                            {buildings.map(b => (
                                                <option key={b.buildingId} value={b.buildingId}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                                        <select
                                            value={formData.floorId}
                                            onChange={(e) => setFormData({ ...formData, floorId: parseInt(e.target.value) })}
                                            className="input"
                                            required
                                            disabled={!floors.length}
                                        >
                                            <option value="">Select Floor</option>
                                            {floors.map(f => (
                                                <option key={f.floorId} value={f.floorId}>Floor {f.floorNumber}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                                <input
                                    type="text"
                                    value={formData.unitNumber}
                                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                                    className="input"
                                    placeholder="e.g., A-1-01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="input"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="Studio">Studio</option>
                                    <option value="1BR">1 Bedroom</option>
                                    <option value="2BR">2 Bedrooms</option>
                                    <option value="3BR">3 Bedrooms</option>
                                    <option value="4BR">4 Bedrooms</option>
                                    <option value="Penthouse">Penthouse</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size (sq ft) *</label>
                                <input
                                    type="number"
                                    value={formData.size}
                                    onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rent Price (RM) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.rentPrice}
                                    onChange={(e) => setFormData({ ...formData, rentPrice: parseFloat(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (RM) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.depositAmount}
                                    onChange={(e) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Tenants *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.maxTenants}
                                    onChange={(e) => setFormData({ ...formData, maxTenants: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input"
                                    required
                                >
                                    <option value="Available">Available</option>
                                    <option value="Occupied">Occupied</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Reserved">Reserved</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="input"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {unit ? 'Update' : 'Create'} Unit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UnitForm;
