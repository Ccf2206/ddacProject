import { useState } from 'react';

function BuildingForm({ propertyId, building, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        PropertyId: propertyId,
        Name: building?.Name || '',
        TotalFloors: building?.TotalFloors || 1
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {building ? 'Edit Building' : 'Add New Building'}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name *</label>
                                <input
                                    type="text"
                                    value={formData.Name}
                                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Block A, Tower 1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors *</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.TotalFloors}
                                    onChange={(e) => setFormData({ ...formData, TotalFloors: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Number of floors in this building</p>
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
                                {building ? 'Update' : 'Add'} Building
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BuildingForm;
