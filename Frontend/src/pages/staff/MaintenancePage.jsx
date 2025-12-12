import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import SearchBar from '../../components/SearchBar';
import { maintenanceAPI } from '../../services/api';
import axios from 'axios';
import { FaWrench, FaExclamationCircle } from 'react-icons/fa';

function MaintenancePage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreationForm, setShowCreationForm] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
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
            console.log('[DEBUG] fetchRequests: Starting fetch...');
            setLoading(true);
            const response = await maintenanceAPI.getAll({});
            console.log('[DEBUG] fetchRequests: Response received:', response.data);
            console.log('[DEBUG] fetchRequests: Number of requests:', response.data.length);
            setRequests(response.data);
        } catch (error) {
            console.error('[ERROR] fetchRequests:', error);
            console.error('[ERROR] fetchRequests response:', error.response?.data);
            console.error('[ERROR] fetchRequests status:', error.response?.status);
        } finally {
            setLoading(false);
            console.log('[DEBUG] fetchRequests: Loading complete');
        }
    };

    const fetchTechnicians = async () => {
        try {
            console.log('[DEBUG] fetchTechnicians: Starting fetch...');
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/users?role=Technician', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[DEBUG] fetchTechnicians: Response:', response.data);
            console.log('[DEBUG] fetchTechnicians: Number of technicians:', response.data.length);
            setTechnicians(response.data);
        } catch (error) {
            console.error('[ERROR] fetchTechnicians:', error);
            console.error('[ERROR] fetchTechnicians response:', error.response?.data);
        }
    };

    const fetchTenants = async () => {
        try {
            console.log('[DEBUG] fetchTenants: Starting fetch...');
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/tenants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[DEBUG] fetchTenants: Response:', response.data);
            console.log('[DEBUG] fetchTenants: Number of tenants:', response.data.length);
            setTenants(response.data);
        } catch (error) {
            console.error('[ERROR] fetchTenants:', error);
            console.error('[ERROR] fetchTenants response:', error.response?.data);
        }
    };

    const fetchUnits = async () => {
        try {
            console.log('[DEBUG] fetchUnits: Starting fetch...');
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/units', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[DEBUG] fetchUnits: Response:', response.data);
            console.log('[DEBUG] fetchUnits: Number of units:', response.data.length);
            // Store all units - we'll filter them based on selected tenant
            setUnits(response.data);
        } catch (error) {
            console.error('[ERROR] fetchUnits:', error);
            console.error('[ERROR] fetchUnits response:', error.response?.data);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        console.log('[DEBUG] handleCreateRequest: Form data:', createForm);

        // Trim and validate Issue Type
        const trimmedIssueType = createForm.issueType.trim();
        if (!trimmedIssueType) {
            console.warn('[WARN] handleCreateRequest: Issue type is empty');
            alert('Issue Type cannot be empty or contain only spaces');
            return;
        }

        // Trim and validate Description
        const trimmedDescription = createForm.description.trim();
        if (!trimmedDescription) {
            console.warn('[WARN] handleCreateRequest: Description is empty');
            alert('Description cannot be empty or contain only spaces');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const requestData = {
                ...createForm,
                issueType: trimmedIssueType,
                description: trimmedDescription
            };
            console.log('[DEBUG] handleCreateRequest: Sending request data:', requestData);

            const response = await axios.post('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance', requestData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[DEBUG] handleCreateRequest: Success response:', response.data);

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
            console.error('[ERROR] handleCreateRequest:', error);
            console.error('[ERROR] handleCreateRequest response:', error.response?.data);
            console.error('[ERROR] handleCreateRequest status:', error.response?.status);
            alert('Error creating request: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAssignTechnician = async (e) => {
        e.preventDefault();
        console.log('[DEBUG] handleAssignTechnician: Form data:', assignForm);
        console.log('[DEBUG] handleAssignTechnician: Selected request:', selectedRequest);
        try {
            const token = localStorage.getItem('token');

            const techId = parseInt(assignForm.technicianId);
            console.log('[DEBUG] handleAssignTechnician: Parsed technicianId:', techId);

            if (isNaN(techId)) {
                console.warn('[WARN] handleAssignTechnician: Invalid technician ID');
                alert('Please select a technician');
                return;
            }

            const payload = { TechnicianId: techId };
            console.log('[DEBUG] handleAssignTechnician: Payload:', payload);
            console.log('[DEBUG] handleAssignTechnician: Request ID:', selectedRequest.maintenanceRequestId);

            const response = await axios.put(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${selectedRequest.maintenanceRequestId}/assign`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('[DEBUG] handleAssignTechnician: Success response:', response.data);

            alert('Technician assigned successfully!');
            setShowAssignModal(false);
            setAssignForm({ technicianId: '' });
            fetchRequests();
        } catch (error) {
            console.error('[ERROR] handleAssignTechnician:', error);
            console.error('[ERROR] handleAssignTechnician response:', error.response?.data);
            console.error('[ERROR] handleAssignTechnician status:', error.response?.status);
            const errorMsg = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
            alert('Error assigning technician: ' + errorMsg);
        }
    };

    const handleDeleteRequest = async () => {
        if (!selectedRequest) {
            console.warn('[WARN] handleDeleteRequest: No request selected');
            return;
        }
        console.log('[DEBUG] handleDeleteRequest: Deleting request:', selectedRequest);
        try {
            const token = localStorage.getItem('token');
            console.log('[DEBUG] handleDeleteRequest: Request ID:', selectedRequest.maintenanceRequestId);
            const response = await axios.delete(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/maintenance/${selectedRequest.maintenanceRequestId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('[DEBUG] handleDeleteRequest: Success response:', response.data);

            alert('Maintenance request deleted successfully!');
            setShowDeleteModal(false);
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            console.error('[ERROR] handleDeleteRequest:', error);
            console.error('[ERROR] handleDeleteRequest response:', error.response?.data);
            console.error('[ERROR] handleDeleteRequest status:', error.response?.status);
            alert('Error deleting request: ' + (error.response?.data?.message || error.message));
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

    // Get units for selected tenant
    const getAvailableUnitsForTenant = () => {
        console.log('[DEBUG] getAvailableUnitsForTenant: Called with tenantId:', createForm.tenantId);
        if (!createForm.tenantId) {
            console.log('[DEBUG] getAvailableUnitsForTenant: No tenant selected');
            return [];
        }
        const selectedTenant = tenants.find(t => t.tenantId.toString() === createForm.tenantId.toString());
        console.log('[DEBUG] getAvailableUnitsForTenant: Selected tenant:', selectedTenant);
        if (!selectedTenant || !selectedTenant.currentUnitId) {
            console.log('[DEBUG] getAvailableUnitsForTenant: Tenant has no assigned unit');
            return [];
        }
        // Return only the unit assigned to this tenant (not all units)
        const availableUnits = units.filter(u => u.unitId === selectedTenant.currentUnitId);
        console.log('[DEBUG] getAvailableUnitsForTenant: Available units:', availableUnits);
        return availableUnits;
    };

    // Filter requests based on search term
    const filteredRequests = requests.filter(request =>
        request.issueType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.unit?.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.tenant?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.priority?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.maintenanceRequestId?.toString().includes(searchTerm)
    );
    console.log('[DEBUG] Filtering: Total requests:', requests.length);
    console.log('[DEBUG] Filtering: Filtered requests:', filteredRequests.length);
    console.log('[DEBUG] Filtering: Search term:', searchTerm);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><FaWrench /> Maintenance Requests</h2>
                    <button
                        onClick={() => setShowCreationForm(true)}
                        className="btn btn-primary"
                    >
                        + Create for Tenant
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search requests by ID, issue type, description, unit, tenant, status, or priority..."
                    />
                </div>

                {loading ? (
                    <p>Loading maintenance requests...</p>
                ) : (
                    <>
                        <div className="mb-4 text-sm text-gray-600">
                            Showing {filteredRequests.length} of {requests.length} requests
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {filteredRequests.map((request) => (
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
                                            {request.escalatedToStaff && (
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

                                {/* Display Escalation Notes */}
                                {request.escalatedToStaff && request.escalationNotes && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm mb-3">
                                        <p className="font-medium text-red-900 flex items-center gap-1">
                                            <FaExclamationCircle /> Escalation Reason:
                                        </p>
                                        <p className="text-red-700 mt-1">{request.escalationNotes}</p>
                                    </div>
                                )}

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

                                {/* Delete Button - Only for Admin/Staff and not completed requests */}
                                {request.status !== 'Completed' && (
                                    <button
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setShowDeleteModal(true);
                                        }}
                                        className="btn btn-danger btn-sm mb-3 ml-2"
                                    >
                                        Delete Request
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
                    </>
                )}

                {filteredRequests.length === 0 && !loading && requests.length > 0 && (
                    <div className="card text-center py-12">
                        <p className="text-gray-500">No maintenance requests match your search</p>
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
                                    onClick={() => {
                                        setShowCreationForm(false);
                                        setCreateForm({
                                            tenantId: '',
                                            unitId: '',
                                            issueType: '',
                                            description: '',
                                            priority: 'Medium'
                                        });
                                    }}
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
                                        onChange={(e) => {
                                            setCreateForm({ 
                                                ...createForm, 
                                                tenantId: e.target.value,
                                                unitId: '' // Reset unit selection when tenant changes
                                            });
                                        }}
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
                                        disabled={!createForm.tenantId}
                                    >
                                        <option value="">{!createForm.tenantId ? 'Select tenant first' : 'Select Unit'}</option>
                                        {getAvailableUnitsForTenant().map((unit) => (
                                            <option key={unit.unitId} value={unit.unitId}>
                                                {unit.unitNumber}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.tenantId && getAvailableUnitsForTenant().length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Selected tenant has no assigned unit
                                        </p>
                                    )}
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
                                        onClick={() => {
                                            setShowCreationForm(false);
                                            setCreateForm({
                                                tenantId: '',
                                                unitId: '',
                                                issueType: '',
                                                description: '',
                                                priority: 'Medium'
                                            });
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

            {/* Assign Technician Modal */}
            {showAssignModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Assign Technician</h3>
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setAssignForm({ technicianId: '' });
                                    }}
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
                                        onClick={() => {
                                            setShowAssignModal(false);
                                            setAssignForm({ technicianId: '' });
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete maintenance request #{selectedRequest.maintenanceRequestId}?
                                <br />
                                <span className="font-semibold">{selectedRequest.issueType}</span>
                                <br />
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteRequest}
                                    className="btn btn-danger flex-1"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedRequest(null);
                                    }}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MaintenancePage;
