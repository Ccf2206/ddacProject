import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import PropertyForm from '../../components/PropertyForm';
import BuildingForm from '../../components/BuildingForm';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';
import { propertiesAPI, buildingsAPI } from '../../services/api';

function PropertiesPage() {
    const { canCreate, canEdit, canDelete } = usePermissions();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPropertyForm, setShowPropertyForm] = useState(false);
    const [showBuildingForm, setShowBuildingForm] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [editingBuilding, setEditingBuilding] = useState(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await propertiesAPI.getAll();
            setProperties(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching properties:', error);
            setLoading(false);
        }
    };

    const handleCreateProperty = () => {
        setEditingProperty(null);
        setShowPropertyForm(true);
    };

    const handleEditProperty = (property) => {
        setEditingProperty(property);
        setShowPropertyForm(true);
    };

    const handlePropertySubmit = async (formData) => {
        try {
            if (editingProperty) {
                await propertiesAPI.update(editingProperty.propertyId, formData);
            } else {
                await propertiesAPI.create(formData);
            }
            setShowPropertyForm(false);
            setEditingProperty(null);
            fetchProperties();
        } catch (error) {
            console.error('Error saving property:', error);
            // Re-throw so PropertyForm can display the error inline
            throw error;
        }
    };

    const handleAddBuilding = (propertyId) => {
        setSelectedPropertyId(propertyId);
        setEditingBuilding(null);
        setShowBuildingForm(true);
    };

    const handleEditBuilding = (building, propertyId) => {
        setSelectedPropertyId(propertyId);
        setEditingBuilding(building);
        setShowBuildingForm(true);
    };

    const handleBuildingSubmit = async (formData) => {
        try {
            console.log('=== Submitting Building Data ===');
            console.log('Form Data:', JSON.stringify(formData, null, 2));

            if (editingBuilding) {
                await buildingsAPI.update(editingBuilding.buildingId, formData);
            } else {
                const response = await buildingsAPI.create(formData);
                console.log('Create Response:', response);
            }
            setShowBuildingForm(false);
            setEditingBuilding(null);
            setSelectedPropertyId(null);
            fetchProperties();
        } catch (error) {
            console.error('Error saving building:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            alert('Error: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        try {
            if (deletingItem.type === 'property') {
                await propertiesAPI.delete(deletingItem.id);
            } else {
                await buildingsAPI.delete(deletingItem.id);
            }
            setShowDeleteModal(false);
            setDeletingItem(null);
            fetchProperties();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    // Filter properties based on search term
    const filteredProperties = properties.filter(property =>
        property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.postcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Properties Management</h2>
                    <PermissionGuard permission={PERMISSIONS.PROPERTIES_CREATE}>
                        <button onClick={handleCreateProperty} className="btn btn-primary">
                            + New Property
                        </button>
                    </PermissionGuard>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search properties by name, address, city, or postcode..."
                    />
                </div>

                {loading ? (
                    <p>Loading properties...</p>
                ) : (
                    <>
                        {filteredProperties.length > 0 ? (
                            <>
                                <div className="mb-4 text-sm text-gray-600">
                                    Showing {filteredProperties.length} of {properties.length} properties
                                </div>
                                <div className="space-y-6">
                                    {filteredProperties.map((property) => (
                            <div key={property.propertyId} className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800">{property.name}</h3>
                                        <p className="text-gray-600 mt-1">
                                            📍 {property.address}, {property.city} {property.postcode}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="badge badge-info">{property.buildingCount} Buildings</span>
                                        <PermissionGuard permission={PERMISSIONS.PROPERTIES_EDIT}>
                                            <button
                                                onClick={() => handleEditProperty(property)}
                                                className="text-sm text-primary-600 hover:text-primary-800"
                                            >
                                                Edit
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard permission={PERMISSIONS.PROPERTIES_DELETE}>
                                            <button
                                                onClick={() => { setDeletingItem({ type: 'property', id: property.propertyId, name: property.name }); setShowDeleteModal(true); }}
                                                className="text-sm text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </div>

                                {property.description && (
                                    <p className="text-gray-700 mb-4">{property.description}</p>
                                )}

                                {/* Buildings Section */}
                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold text-gray-700">
                                            Buildings: {property.buildings?.length || 0} / {property.buildingCount}
                                        </h4>
                                        {property.buildings?.length >= property.buildingCount ? (
                                            <span className="text-sm text-orange-600">
                                                Building limit reached
                                            </span>
                                        ) : (
                                            <PermissionGuard permission={PERMISSIONS.PROPERTIES_EDIT}>
                                                <button
                                                    onClick={() => handleAddBuilding(property.propertyId)}
                                                    className="text-sm text-primary-600 hover:text-primary-800"
                                                >
                                                    + Add Building
                                                </button>
                                            </PermissionGuard>
                                        )}
                                    </div>

                                    {property.buildings && property.buildings.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {property.buildings.map((building) => (
                                                <div key={building.buildingId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-2xl">🏢</span>
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{building.name}</p>
                                                                    <p className="text-sm text-gray-600">{building.totalFloors} Floors</p>
                                                                </div>
                                                            </div>
                                                            {building.floors && (
                                                                <div className="mt-2 text-xs text-gray-600">
                                                                    {building.floors.reduce((sum, floor) => sum + (floor.units?.length || 0), 0)} Units Total
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col space-y-1">
                                                            <PermissionGuard permission={PERMISSIONS.PROPERTIES_EDIT}>
                                                                <button
                                                                    onClick={() => handleEditBuilding(building, property.propertyId)}
                                                                    className="text-xs text-primary-600 hover:text-primary-800"
                                                                >
                                                                    Edit
                                                                </button>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission={PERMISSIONS.PROPERTIES_DELETE}>
                                                                <button
                                                                    onClick={() => { setDeletingItem({ type: 'building', id: building.buildingId, name: building.name }); setShowDeleteModal(true); }}
                                                                    className="text-xs text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </PermissionGuard>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            <p className="text-gray-500 mb-2">No buildings added yet</p>
                                            <button
                                                onClick={() => handleAddBuilding(property.propertyId)}
                                                className="text-sm text-primary-600 hover:text-primary-800"
                                            >
                                                + Add Your First Building
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                            </>
                        ) : (
                            <div className="card text-center py-12">
                                <p className="text-gray-500">No properties match your search</p>
                            </div>
                        )}
                    </>
                )}

                {properties.length === 0 && !loading && (
                    <div className="card text-center py-12">
                        <p className="text-gray-500 mb-4">No properties found</p>
                        <button onClick={handleCreateProperty} className="btn btn-primary">
                            Create Your First Property
                        </button>
                    </div>
                )}
            </div>

            {showPropertyForm && (
                <PropertyForm
                    property={editingProperty}
                    onSubmit={handlePropertySubmit}
                    onCancel={() => { setShowPropertyForm(false); setEditingProperty(null); }}
                />
            )}

            {showBuildingForm && (
                <BuildingForm
                    propertyId={selectedPropertyId}
                    building={editingBuilding}
                    onSubmit={handleBuildingSubmit}
                    onCancel={() => { setShowBuildingForm(false); setEditingBuilding(null); setSelectedPropertyId(null); }}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                title={`Delete ${deletingItem?.type === 'property' ? 'Property' : 'Building'}`}
                message={`Are you sure you want to delete ${deletingItem?.name}? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => { setShowDeleteModal(false); setDeletingItem(null); }}
                danger={true}
            />
        </div>
    );
}

export default PropertiesPage;
