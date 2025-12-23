import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import { maintenanceAPI } from '../../services/api';
import axios from 'axios';
import { FaWrench, FaEdit, FaCheck, FaExclamationTriangle, FaClipboardList, FaCheckCircle } from 'react-icons/fa';

function TechnicianDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [requestDetails, setRequestDetails] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [updateForm, setUpdateForm] = useState({
        notes: '',
        costOfParts: '',
        status: ''
    });
    const [beforePhoto, setBeforePhoto] = useState(null);
    const [afterPhoto, setAfterPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const beforePhotoRef = useRef(null);
    const afterPhotoRef = useRef(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await maintenanceAPI.getAll({});
            setRequests(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching maintenance requests:', error);
            setLoading(false);
        }
    };

    const handleOpenUpdateModal = async (task) => {
        setSelectedTask(task);
        
        // Fetch full details to get updates
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${task.maintenanceRequestId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const details = response.data;
            const latestUpdate = details.maintenanceUpdates && details.maintenanceUpdates.length > 0 
                ? details.maintenanceUpdates[details.maintenanceUpdates.length - 1] 
                : null;
            
            setUpdateForm({
                notes: latestUpdate?.notes || '',
                costOfParts: latestUpdate?.costOfParts || '',
                status: task.status
            });
        } catch (error) {
            console.error('Error fetching task details:', error);
            setUpdateForm({
                notes: '',
                costOfParts: '',
                status: task.status
            });
        }
        
        setShowUpdateModal(true);
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        
        // Validate cost of parts
        const cost = parseFloat(updateForm.costOfParts) || 0;
        if (cost < 0) {
            alert('Cost of parts cannot be negative. Please enter 0 or a positive value.');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            // 1. Submit the update
            await axios.post(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${selectedTask.maintenanceRequestId}/update`,
                {
                    notes: updateForm.notes,
                    costOfParts: cost,
                    status: updateForm.status
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 2. Upload before photo if selected
            if (beforePhoto) {
                const formData = new FormData();
                formData.append('file', beforePhoto);
                formData.append('type', 'Initial');

                await axios.post(
                    `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${selectedTask.maintenanceRequestId}/photos`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
            }

            // 3. Upload after photo if selected
            if (afterPhoto) {
                const formData = new FormData();
                formData.append('file', afterPhoto);
                formData.append('type', 'Completed');

                await axios.post(
                    `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${selectedTask.maintenanceRequestId}/photos`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
            }

            alert('Task updated successfully!');
            setShowUpdateModal(false);
            setBeforePhoto(null);
            setAfterPhoto(null);
            if (beforePhotoRef.current) beforePhotoRef.current.value = '';
            if (afterPhotoRef.current) afterPhotoRef.current.value = '';
            fetchRequests();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Error updating task: ' + (error.response?.data?.message || error.message));
        }
    };

    const handlePhotoUpload = async (taskId, file, type) => {
        try {
            setUploading(true);
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            await axios.post(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${taskId}/photos`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert(`${type} photo uploaded successfully!`);
            if (type === 'Initial') setBeforePhoto(null);
            if (type === 'Completed') setAfterPhoto(null);
            fetchRequests();
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo');
        } finally {
            setUploading(false);
        }
    };

    const handleEscalate = async (taskId) => {
        const reason = prompt('Enter escalation reason:');
        if (!reason) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${taskId}/escalate`,
                { Notes: reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Task escalated successfully!');
            fetchRequests();
        } catch (error) {
            console.error('Error escalating task:', error);
            alert('Error escalating task');
        }
    };

    const handleMarkComplete = async (task) => {
        if (!window.confirm('Mark this task as completed?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${task.maintenanceRequestId}/update`,
                {
                    notes: 'Task completed',
                    costOfParts: 0,
                    status: 'Completed'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Task marked as completed!');
            fetchRequests();
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Error completing task');
        }
    };

    const handleViewDetails = async (request) => {
        console.log('[DEBUG] handleViewDetails: Viewing request:', request);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${request.maintenanceRequestId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('[DEBUG] handleViewDetails: Success response:', response.data);
            setRequestDetails(response.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('[ERROR] handleViewDetails:', error);
            console.error('[ERROR] handleViewDetails response:', error.response?.data);
            alert('Error fetching request details: ' + (error.response?.data?.message || error.message));
        }
    };

    const handlePhotoClick = (photoUrl) => {
        // Extract filename from URL and use API endpoint
        const filename = photoUrl.split('/').pop();
        const fullPhotoUrl = `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/photo/${filename}`;
        setSelectedPhoto(fullPhotoUrl);
        setShowPhotoModal(true);
    };

    const getPriorityColor = (priority) => {
        const colors = {
            Low: 'bg-blue-100 text-blue-800',
            Medium: 'bg-yellow-100 text-yellow-800',
            High: 'bg-orange-100 text-orange-800',
            Urgent: 'bg-red-100 text-red-800',
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    };

    const getStatusColor = (status) => {
        const colors = {
            Pending: 'bg-yellow-100 text-yellow-800',
            InProgress: 'bg-blue-100 text-blue-800',
            'In Progress': 'bg-blue-100 text-blue-800',
            Completed: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const pendingRequests = requests.filter(r => r.status === 'Pending' || r.status === 'InProgress' || r.status === 'In Progress');
    const completedRequests = requests.filter(r => r.status === 'Completed');

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2"><FaWrench /> Technician Dashboard</h2>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <p className="text-orange-100 text-sm">Assigned Tasks</p>
                        <p className="text-4xl font-bold mt-2">{pendingRequests.length}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-green-100 text-sm">Completed</p>
                        <p className="text-4xl font-bold mt-2">{completedRequests.length}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <p className="text-blue-100 text-sm">Total Tasks</p>
                        <p className="text-4xl font-bold mt-2">{requests.length}</p>
                    </div>
                </div>

                {/* Pending Tasks */}
                <div className="card mb-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaClipboardList /> Active Tasks</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : pendingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {pendingRequests.map((request) => (
                                <div key={request.maintenanceRequestId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-xl mb-2">{request.issueType}</h4>
                                            <p className="text-gray-700 text-sm mb-3">
                                                {request.description && request.description.trim() ? request.description : <span className="italic text-gray-400">None</span>}
                                            </p>
                                            <div className="flex gap-4 text-sm text-gray-600">
                                                <p><strong>Tenant:</strong> {request.tenant?.user?.name || 'N/A'}</p>
                                                <p><strong>Unit:</strong> {request.unit?.unitNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-4">
                                            <span className={`badge ${getPriorityColor(request.priority)}`}>
                                                {request.priority}
                                            </span>
                                            <span className={`badge ${getStatusColor(request.status)}`}>
                                                {request.status}
                                            </span>
                                            {request.escalatedToStaff && (
                                                <span className="badge bg-red-100 text-red-800">🚨 Escalated</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-500">
                                            📅 Reported: {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={() => handleViewDetails(request)}
                                                className="btn btn-info btn-sm"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleOpenUpdateModal(request)}
                                                className="btn btn-primary btn-sm flex items-center gap-1"
                                            >
                                                <FaEdit /> Update
                                            </button>
                                            {request.status !== 'Completed' && (
                                                <button
                                                    onClick={() => handleMarkComplete(request)}
                                                    className="btn btn-success btn-sm"
                                                >
                                                    ✅ Complete
                                                </button>
                                            )}
                                            {!request.escalatedToStaff && (
                                                <button
                                                    onClick={() => handleEscalate(request.maintenanceRequestId)}
                                                    className="btn btn-warning btn-sm"
                                                >
                                                    ⚠️ Escalate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No active tasks assigned</p>
                    )}
                </div>

                {/* Completed Tasks */}
                <div className="card">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaCheckCircle /> Completed Tasks</h3>
                    {completedRequests.length > 0 ? (
                        <div className="space-y-3">
                            {completedRequests.map((request) => (
                                <div key={request.maintenanceRequestId} className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-xl mb-2">{request.issueType}</h4>
                                            <p className="text-gray-700 text-sm mb-3">
                                                {request.description && request.description.trim() ? request.description : <span className="italic text-gray-400">None</span>}
                                            </p>
                                            <div className="flex gap-4 text-sm text-gray-600 mb-2">
                                                <p><strong>Tenant:</strong> {request.tenant?.user?.name || 'N/A'}</p>
                                                <p><strong>Unit:</strong> {request.unit?.unitNumber || 'N/A'}</p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Completed: {new Date(request.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => handleViewDetails(request)}
                                                className="btn btn-info btn-sm"
                                            >
                                                View Details
                                            </button>
                                            <span className="badge badge-success flex items-center gap-1"><FaCheck /> Completed</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No completed tasks yet</p>
                    )}
                </div>
            </div>

            {/* Update Task Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold">Update Task: {selectedTask.issueType}</h3>
                                <button
                                    onClick={() => setShowUpdateModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleUpdateTask} className="space-y-4">
                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        value={updateForm.status}
                                        onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="InProgress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Repair Notes *
                                    </label>
                                    <textarea
                                        value={updateForm.notes}
                                        onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                                        className="input"
                                        rows="4"
                                        placeholder="Describe the work done, parts replaced, etc."
                                        required
                                    />
                                </div>

                                {/* Cost of Parts */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cost of Parts (RM)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={updateForm.costOfParts}
                                        onChange={(e) => setUpdateForm({ ...updateForm, costOfParts: e.target.value })}
                                        className="input"
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Enter 0 or positive value only</p>
                                </div>

                                {/* Photo Uploads */}
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">📸 Upload Photos</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Before Photo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Before Photo
                                            </label>
                                            <input
                                                ref={beforePhotoRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setBeforePhoto(e.target.files[0])}
                                                className="input text-sm"
                                            />
                                        </div>

                                        {/* After Photo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                After Photo
                                            </label>
                                            <input
                                                ref={afterPhotoRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setAfterPhoto(e.target.files[0])}
                                                className="input text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        Save Update
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUpdateModal(false);
                                            setBeforePhoto(null);
                                            setAfterPhoto(null);
                                            if (beforePhotoRef.current) beforePhotoRef.current.value = '';
                                            if (afterPhotoRef.current) afterPhotoRef.current.value = '';
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

            {/* View Details Modal */}
            {showDetailsModal && requestDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold">Maintenance Request Details</h3>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setRequestDetails(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Request ID and Status */}
                                <div className="flex items-center gap-3">
                                    <h4 className="text-xl font-semibold">Request #{requestDetails.maintenanceRequestId}</h4>
                                    <span className={`badge ${getStatusColor(requestDetails.status)}`}>
                                        {requestDetails.status}
                                    </span>
                                    <span className={`badge ${getPriorityColor(requestDetails.priority)}`}>
                                        {requestDetails.priority} Priority
                                    </span>
                                    {requestDetails.escalatedToStaff && (
                                        <span className="badge bg-red-100 text-red-800">🚨 Escalated</span>
                                    )}
                                </div>

                                {/* Property & Building Info */}
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Property</p>
                                        <p className="text-gray-800">{requestDetails.unit?.floor?.building?.property?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Building</p>
                                        <p className="text-gray-800">{requestDetails.unit?.floor?.building?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Floor</p>
                                        <p className="text-gray-800">{requestDetails.unit?.floor?.floorNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Unit</p>
                                        <p className="text-gray-800">{requestDetails.unit?.unitNumber || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Tenant Info */}
                                <div className="bg-blue-50 p-4 rounded">
                                    <p className="text-sm text-gray-600 font-medium mb-2">Tenant Information</p>
                                    <p className="text-gray-800"><strong>Name:</strong> {requestDetails.tenant?.user?.name || 'N/A'}</p>
                                    <p className="text-gray-800"><strong>Email:</strong> {requestDetails.tenant?.user?.email || 'N/A'}</p>
                                    <p className="text-gray-800"><strong>Phone:</strong> {requestDetails.tenant?.user?.phoneNumber || 'N/A'}</p>
                                </div>

                                {/* Issue Details */}
                                <div>
                                    <p className="text-sm text-gray-600 font-medium mb-1">Issue Type</p>
                                    <p className="text-gray-800 text-lg font-semibold">{requestDetails.issueType}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 font-medium mb-1">Description</p>
                                    {requestDetails.description && requestDetails.description.trim() ? (
                                        <p className="text-gray-800 whitespace-pre-wrap">{requestDetails.description}</p>
                                    ) : (
                                        <p className="text-gray-400 italic">None</p>
                                    )}
                                </div>

                                {/* Escalation Info */}
                                {requestDetails.escalatedToStaff && requestDetails.escalationNotes && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                        <p className="font-medium text-red-900 mb-2">🚨 Escalation Notes</p>
                                        <p className="text-red-700">{requestDetails.escalationNotes}</p>
                                    </div>
                                )}

                                {/* Photos - Clickable Links */}
                                <div>
                                    <p className="text-sm text-gray-600 font-medium mb-3">📸 Photos (Click to view)</p>
                                    {requestDetails.maintenancePhotos && requestDetails.maintenancePhotos.length > 0 ? (
                                        <div className="space-y-2">
                                            {requestDetails.maintenancePhotos.map((photo, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                                                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                                                        {photo.photoType === 'Initial' ? '📷 Before:' : '✅ After:'}
                                                    </span>
                                                    <button
                                                        onClick={() => handlePhotoClick(photo.photoUrl)}
                                                        className="text-blue-600 hover:text-blue-800 underline text-sm flex-1 text-left"
                                                    >
                                                        {photo.photoUrl.split('/').pop() || 'View Photo'}
                                                    </button>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(photo.uploadedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">None</p>
                                    )}
                                </div>

                                {/* Updates */}
                                {requestDetails.maintenanceUpdates && requestDetails.maintenanceUpdates.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium mb-2">📝 Maintenance Updates</p>
                                        <div className="space-y-3">
                                            {requestDetails.maintenanceUpdates.map((update, idx) => (
                                                <div key={idx} className="bg-gray-50 p-4 rounded border-l-4 border-blue-400">
                                                    <p className="text-gray-800 mb-2">{update.notes}</p>
                                                    {update.costOfParts && update.costOfParts > 0 && (
                                                        <p className="text-sm text-gray-600">
                                                            <strong>Cost of Parts:</strong> RM{update.costOfParts.toFixed(2)}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Updated on: {new Date(update.updatedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timestamps */}
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t pt-4">
                                    <div>
                                        <p className="font-medium">Created At</p>
                                        <p>{new Date(requestDetails.createdAt).toLocaleString()}</p>
                                    </div>
                                    {requestDetails.completedDate && (
                                        <div>
                                            <p className="font-medium">Completed At</p>
                                            <p>{new Date(requestDetails.completedDate).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setRequestDetails(null);
                                    }}
                                    className="btn btn-secondary w-full"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Viewer Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
                    <div className="relative max-w-6xl w-full">
                        <button
                            onClick={() => {
                                setShowPhotoModal(false);
                                setSelectedPhoto(null);
                            }}
                            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center text-2xl z-10"
                        >
                            ×
                        </button>
                        <img
                            src={selectedPhoto}
                            alt="Maintenance photo"
                            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                        />
                        <div className="text-center mt-4">
                            <a
                                href={selectedPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white underline hover:text-blue-300"
                            >
                                Open in new tab
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TechnicianDashboard;
