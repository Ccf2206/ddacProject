import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { maintenanceAPI } from '../../services/api';
import axios from 'axios';
import { FaWrench, FaExclamationCircle } from 'react-icons/fa';

function MaintenancePage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreationForm, setShowCreationForm] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [units, setUnits] = useState([]);
    const [createForm, setCreateForm] = useState({
        tenantId: '',
        unitId: '',
        issueType: '',
        description: '',
        priority: 'Medium'
    });
    const [assignForm, setAssignForm] = useState({
        technicianId: ''
    });

    useEffect(() => {
        fetchRequests();
        fetchTechnicians();
        fetchTenants();
        fetchUnits();
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

    const fetchTechnicians = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/users?role=Technician', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('DEBUG: Fetched users (technicians):', response.data);
            setTechnicians(response.data);
        } catch (error) {
            console.error('Error fetching technicians:', error);
        }
    };

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/tenants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTenants(response.data);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/units', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnits(response.data);
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/maintenance', createForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Maintenance request created successfully!');
            setShowCreationForm(false);
            setCreateForm({
                tenantId: '',
                unitId: '',
                issueType: '',
                description: '',
                priority: 'Medium'
            });
            fetchRequests();
        } catch (error) {
            console.error('Error creating request:', error);
            alert('Error creating request: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAssignTechnician = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            console.log('DEBUG: assignForm state:', assignForm);
            console.log('DEBUG: assignForm.technicianId:', assignForm.technicianId, 'Type:', typeof assignForm.technicianId);

            const techId = parseInt(assignForm.technicianId);
            console.log('DEBUG: Parsed techId:', techId, 'Is NaN?:', isNaN(techId));

            if (isNaN(techId)) {
                alert('Please select a technician');
                return;
            }

            const payload = { TechnicianId: techId };
            console.log('DEBUG: Assigning technician with payload:', payload);

            await axios.put(
                `http://localhost:5000/api/maintenance/${selectedRequest.maintenanceRequestId}/assign`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Technician assigned successfully!');
            setShowAssignModal(false);
            setAssignForm({ technicianId: '' });
            fetchRequests();
        } catch (error) {
            console.error('Error assigning technician:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
            alert('Error assigning technician: ' + errorMsg);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            Pending: 'badge-warning',
            InProgress: 'badge-info',
            'In Progress': 'badge-info',
            Completed: 'badge-success',
            Cancelled: 'badge-danger',
        };
        return badges[status] || 'badge-info';
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            Low: 'badge-info',
            Medium: 'badge-warning',
            High: 'badge-danger',
            Urgent: 'bg-red-600 text-white',
        };
        return badges[priority] || 'badge-info';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><FaWrench /> Maintenance Requests</h2>
                    <button
                        onClick={() => setShowCreationForm(true)}
                        className="btn btn-primary"
                    >
                        + Create for Tenant
                    </button>
                </div>

                {loading ? (
                    <p>Loading maintenance requests...</p>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {requests.map((request) => (
                            <div key={request.maintenanceRequestId} className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800">#{request.maintenanceRequestId}</h3>
                                            <span className={`badge ${getStatusBadge(request.status)}`}>
                                                {request.status}
                                            </span>
                                            <span className={`badge ${getPriorityBadge(request.priority)}`}>
                                                {request.priority}
                                            </span>
                                            {request.isEscalated && (
                                                <span className="badge bg-red-100 text-red-800 flex items-center gap-1"><FaExclamationCircle /> Escalated</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            <strong>Issue Type:</strong> {request.issueType}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Unit:</strong> {request.unit?.unitNumber || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Tenant:</strong> {request.tenant?.user?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(request.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <p className="text-gray-700 mb-4">{request.description}</p>

                                {request.maintenanceAssignment ? (
                                    <div className="bg-green-50 border-l-4 border-green-500 p-3 text-sm mb-3">
                                        <p className="font-medium text-green-900">
                                            ✓ Assigned to: {request.maintenanceAssignment.technician?.user?.name || 'N/A'}
                                        </p>
                                        <p className="text-green-700 text-xs">
                                            {new Date(request.maintenanceAssignment.assignedDate).toLocaleString()}
                                        </p>
                                    </div>
                                ) : request.status !== 'Completed' && (
                                    <button
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setShowAssignModal(true);
                                        }}
                                        className="btn btn-primary btn-sm mb-3"
                                    >
                                        Assign Technician
                                    </button>
                                )}

                                {request.maintenanceUpdates && request.maintenanceUpdates.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <h4 className="font-semibold text-gray-700 text-sm">Updates:</h4>
                                        {request.maintenanceUpdates.map((update, idx) => (
                                            <div key={idx} className="bg-gray-50 p-3 rounded">
                                                <p className="text-sm text-gray-700">{update.notes}</p>
                                                {update.costOfParts && (
                                                    <p className="text-xs text-gray-600 mt-1">Cost: RM{update.costOfParts}</p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(update.updatedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {requests.length === 0 && !loading && (
                    <div className="card text-center py-12">
                        <p className="text-gray-500">No maintenance requests found</p>
                    </div>
                )}
            </div>

            {/* Create Request Modal */}
            {showCreationForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold">Create Maintenance Request</h3>
                                <button
                                    onClick={() => setShowCreationForm(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleCreateRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tenant *
                                    </label>
                                    <select
                                        value={createForm.tenantId}
                                        onChange={(e) => setCreateForm({ ...createForm, tenantId: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="">Select Tenant</option>
                                        {tenants.map((tenant) => (
                                            <option key={tenant.tenantId} value={tenant.tenantId}>
                                                {tenant.user?.name} - {tenant.user?.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit *
                                    </label>
                                    <select
                                        value={createForm.unitId}
                                        onChange={(e) => setCreateForm({ ...createForm, unitId: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map((unit) => (
                                            <option key={unit.unitId} value={unit.unitId}>
                                                {unit.unitNumber} - {unit.property?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Issue Type *
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.issueType}
                                        onChange={(e) => setCreateForm({ ...createForm, issueType: e.target.value })}
                                        className="input"
                                        placeholder="e.g., Plumbing, Electrical, HVAC"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority *
                                    </label>
                                    <select
                                        value={createForm.priority}
                                        onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                        className="input"
                                        rows="4"
                                        placeholder="Describe the issue in detail..."
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        Create Request
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreationForm(false)}
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

            {/* Assign Technician Modal */}
            {showAssignModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Assign Technician</h3>
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                Request #{selectedRequest.maintenanceRequestId} - {selectedRequest.issueType}
                            </p>

                            <form onSubmit={handleAssignTechnician} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Technician *
                                    </label>
                                    <select
                                        value={assignForm.technicianId}
                                        onChange={(e) => setAssignForm({ technicianId: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="">Choose a technician...</option>
                                        {technicians.filter(t => t.technician).map((tech) => (
                                            <option key={tech.userId} value={tech.technician.technicianId}>
                                                {tech.name} - {tech.technician.specialty || 'General'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        Assign
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
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
        </div>
    );
}

export default MaintenancePage;
