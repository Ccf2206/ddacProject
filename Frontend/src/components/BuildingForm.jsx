import { useState, useEffect } from 'react';

function BuildingForm({ propertyId, building, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        PropertyId: propertyId,
        name: '',
        totalFloors: 1
    });
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (building) {
            setFormData({
                PropertyId: propertyId,
                name: building.name || '',
                totalFloors: building.totalFloors || 1
            });
        } else {
            setFormData({
                PropertyId: propertyId,
                name: '',
                totalFloors: 1
            });
        }
    }, [building, propertyId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        // Trim building name and validate
        const trimmedName = formData.name.trim();
        
        if (!trimmedName) {
            setError('Building name cannot be empty or contain only spaces');
            setIsSubmitting(false);
            return;
        }

        const submitData = {
            ...formData,
            name: trimmedName
        };

        try {
            await onSubmit(submitData);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'An error occurred';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {building ? 'Edit Building' : 'Add New Building'}
                    </h3>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Block A, Tower 1"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors *</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.totalFloors}
                                    onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-gray-500 mt-1">Number of floors in this building (can be adjusted to any value)</p>
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
                                {isSubmitting ? 'Saving...' : building ? 'Update' : 'Add'} Building
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BuildingForm;
