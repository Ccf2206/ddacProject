import { useState, useEffect } from 'react';

function PropertyForm({ property, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        postcode: '',
        description: '',
        buildingCount: 1
    });

    useEffect(() => {
        if (property) {
            setFormData({
                name: property.name || '',
                address: property.address || '',
                city: property.city || '',
                postcode: property.postcode || '',
                description: property.description || '',
                buildingCount: property.buildingCount || 1
            });
        }
    }, [property]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {property ? 'Edit Property' : 'Create New Property'}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
                                <input
                                    type="text"
                                    value={formData.postcode}
                                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input"
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Buildings *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.buildingCount}
                                    onChange={(e) => setFormData({ ...formData, buildingCount: parseInt(e.target.value) })}
                                    className="input"
                                    required
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
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                {property ? 'Update' : 'Create'} Property
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PropertyForm;
