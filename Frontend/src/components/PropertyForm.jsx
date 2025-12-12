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
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        // Trim all inputs and validate
        const trimmedData = {
            name: formData.name.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            postcode: formData.postcode.trim(),
            description: formData.description.trim(),
            buildingCount: formData.buildingCount
        };

        // Validate property name
        if (!trimmedData.name) {
            setError('Property name cannot be empty or contain only spaces');
            setIsSubmitting(false);
            return;
        }

        // Validate address
        if (!trimmedData.address) {
            setError('Address cannot be empty or contain only spaces');
            setIsSubmitting(false);
            return;
        }

        // Validate city - text only
        if (!trimmedData.city) {
            setError('City cannot be empty or contain only spaces');
            setIsSubmitting(false);
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(trimmedData.city)) {
            setError('City should only contain letters and spaces');
            setIsSubmitting(false);
            return;
        }

        // Validate postcode - integers only
        if (!trimmedData.postcode) {
            setError('Postcode cannot be empty or contain only spaces');
            setIsSubmitting(false);
            return;
        }
        if (!/^\d+$/.test(trimmedData.postcode)) {
            setError('Postcode should only contain numbers');
            setIsSubmitting(false);
            return;
        }

        // Validate description if provided - cannot be only whitespace
        if (formData.description && !trimmedData.description) {
            setError('Description cannot contain only spaces');
            setIsSubmitting(false);
            return;
        }

        try {
            await onSubmit(trimmedData);
            // Form will close on success (handled by parent component)
        } catch (err) {
            // Display error inline
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {property ? 'Edit Property' : 'Create New Property'}
                    </h3>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

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
                                    disabled={isSubmitting}
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
                                    disabled={isSubmitting}
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
                                    disabled={isSubmitting}
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
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input"
                                    rows="3"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Buildings *</label>
                                <input
                                    type="number"
                                    min={property?.buildings?.length || 1}
                                    value={formData.buildingCount}
                                    onChange={(e) => setFormData({ ...formData, buildingCount: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                    disabled={isSubmitting}
                                />
                                {property && property.buildings && property.buildings.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Minimum: {property.buildings.length} (current number of existing buildings)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : property ? 'Update' : 'Create'} Property
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PropertyForm;
