import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function TenantMaintenance() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [formData, setFormData] = useState({
        issueType: '',
        description: '',
        priority: 'Medium'
    });
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/maintenance', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching maintenance requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/maintenance', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const requestId = response.data.maintenanceRequestId;

            // Upload photos if any
            if (selectedPhotos.length > 0) {
                for (const photo of selectedPhotos) {
                    const photoFormData = new FormData();
                    photoFormData.append('file', photo);
                    photoFormData.append('type', 'Initial');

                    await axios.post(
                        `http://localhost:5000/api/maintenance/${requestId}/photos`,
                        photoFormData,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            }
                        }
                    );
                }
            }

            alert('Maintenance request submitted successfully!');
            setShowForm(false);
            setFormData({ issueType: '', description: '', priority: 'Medium' });
            setSelectedPhotos([]);
            setPhotoPreviews([]);
            fetchRequests();
        } catch (error) {
            console.error('Error submitting request:', error);
            const errorMessage = error.response?.data?.message || error.response?.data || error.message;
            alert('Error: ' + errorMessage);
        }
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedPhotos(files);

        // Create previews
        const previews = files.map(file => URL.createObjectURL(file));
        setPhotoPreviews(previews);
    };

    const removePhoto = (index) => {
        const newPhotos = selectedPhotos.filter((_, i) => i !== index);
        const newPreviews = photoPreviews.filter((_, i) => i !== index);
        setSelectedPhotos(newPhotos);
        setPhotoPreviews(newPreviews);
    };

    const viewDetails = async (request) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/maintenance/${request.maintenanceRequestId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedRequest(response.data);
            setShowDetails(true);
        } catch (error) {
            console.error('Error fetching request details:', error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return 'bg-red-100 text-red-800';
            case 'High': return 'bg-orange-100 text-orange-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Maintenance Requests</h1>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary"
                    >
                        + New Request
                    </button>
                </div>

                {loading ? (
                    <p>Loading requests...</p>
                ) : (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                                No maintenance requests yet. Click "New Request" to submit one.
                            </div>
                        ) : (
                            requests.map((request) => (
                                <div
                                    key={request.maintenanceRequestId}
                                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => viewDetails(request)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold">{request.issueType}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                                    {request.priority}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mb-3">{request.description}</p>
                                            <div className="flex gap-4 text-sm text-gray-500">
                                                <span>📅 Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                                                {request.updatedAt && (
                                                    <span>🔄 Updated: {new Date(request.updatedAt).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        {request.escalatedToStaff && (
                                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                                🚨 Escalated
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* New Request Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">New Maintenance Request</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Issue Type *
                                    </label>
                                    <select
                                        value={formData.issueType}
                                        onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="">Select issue type</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Air Conditioning">Air Conditioning</option>
                                        <option value="Appliances">Appliances</option>
                                        <option value="Structural">Structural</option>
                                        <option value="Pest Control">Pest Control</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="input"
                                        rows="4"
                                        placeholder="Please describe the issue in detail..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="input"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Photos (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png"
                                        multiple
                                        onChange={handlePhotoChange}
                                        className="input"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Max 5 photos, JPG/PNG only</p>

                                    {/* Photo Previews */}
                                    {photoPreviews.length > 0 && (
                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                            {photoPreviews.map((preview, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        Submit Request
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Request Details Modal */}
                {showDetails && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y- auto p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">Request Details</h2>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                                        {selectedRequest.priority} Priority
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                                        {selectedRequest.status}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Issue Type</h3>
                                    <p>{selectedRequest.issueType}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700">Description</h3>
                                    <p className="text-gray-600">{selectedRequest.description}</p>
                                </div>

                                {/* Photos */}
                                {selectedRequest.maintenancePhotos && selectedRequest.maintenancePhotos.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Photos</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedRequest.maintenancePhotos.map((photo, idx) => (
                                                <img
                                                    key={idx}
                                                    src={`http://localhost:5000${photo.photoUrl}`}
                                                    alt={`Photo ${idx + 1}`}
                                                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                                    onClick={() => window.open(`http://localhost:5000${photo.photoUrl}`, '_blank')}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-semibold text-gray-700">Timeline</h3>
                                    <div className="space-y-2 mt-2">
                                        <p className="text-sm">📅 Submitted: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                                        {selectedRequest.updatedAt && (
                                            <p className="text-sm">🔄 Last Updated: {new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>

                                {selectedRequest.updates && selectedRequest.updates.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Updates from Technician</h3>
                                        <div className="space-y-3">
                                            {selectedRequest.updates.map((update) => (
                                                <div key={update.maintenanceUpdateId} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50">
                                                    <p className="text-sm text-gray-600">{update.notes}</p>
                                                    {update.costOfParts && (
                                                        <p className="text-sm font-medium mt-1">Parts Cost: RM {update.costOfParts.toFixed(2)}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(update.updatedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
