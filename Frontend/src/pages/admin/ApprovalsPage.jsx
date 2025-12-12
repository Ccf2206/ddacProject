import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import SearchBar from '../../components/SearchBar';
import axios from 'axios';
import { FaCheckCircle, FaTimes, FaCheck } from 'react-icons/fa';

function ApprovalsPage() {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchApprovals();
    }, [filter]);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = filter !== 'All' ? { status: filter } : {};

            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/approvals', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setApprovals(response.data);
        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedApproval) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/approvals/${selectedApproval.approvalId}/approve`,
                { adminNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Action approved successfully!');
            setShowReviewModal(false);
            setAdminNotes('');
            setSelectedApproval(null);
            fetchApprovals();
        } catch (error) {
            console.error('Error approving:', error);
            alert('Error approving action: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleReject = async () => {
        if (!selectedApproval) return;
        if (!adminNotes.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/approvals/${selectedApproval.approvalId}/reject`,
                { adminNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Action rejected successfully!');
            setShowReviewModal(false);
            setAdminNotes('');
            setSelectedApproval(null);
            fetchApprovals();
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('Error rejecting action: ' + (error.response?.data?.message || error.message));
        }
    };

    const openReviewModal = (approval) => {
        setSelectedApproval(approval);
        setAdminNotes('');
        setShowReviewModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            Pending: 'bg-yellow-100 text-yellow-800',
            Approved: 'bg-green-100 text-green-800',
            Rejected: 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getActionTypeBadge = (actionType) => {
        const badges = {
            Create: 'bg-blue-100 text-blue-800',
            Update: 'bg-purple-100 text-purple-800',
            Delete: 'bg-red-100 text-red-800'
        };
        return badges[actionType] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><FaCheckCircle /> Staff Action Approvals</h2>

                    {/* Filter */}
                    <div className="flex gap-2">
                        {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded ${filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                        <p className="text-yellow-100 text-sm">Pending Review</p>
                        <p className="text-4xl font-bold mt-2">
                            {approvals.filter(a => a.status === 'Pending').length}
                        </p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-green-100 text-sm">Approved</p>
                        <p className="text-4xl font-bold mt-2">
                            {approvals.filter(a => a.status === 'Approved').length}
                        </p>
                    </div>
                    <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <p className="text-red-100 text-sm">Rejected</p>
                        <p className="text-4xl font-bold mt-2">
                            {approvals.filter(a => a.status === 'Rejected').length}
                        </p>
                    </div>
                </div>

                {/* Approvals List */}
                <div className="card">
                    <h3 className="text-xl font-semibold mb-4">
                        {filter === 'All' ? 'All Approvals' : `${filter} Approvals`}
                    </h3>

                    <div className="mb-4">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search by staff name, action type, table, or status..."
                        />
                        <p className="text-sm text-gray-600 mt-2">
                            Showing {approvals.filter(approval =>
                                (approval.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    approval.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    approval.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    approval.status?.toLowerCase().includes(searchTerm.toLowerCase()))
                            ).length} of {approvals.length} approvals
                        </p>
                    </div>

                    {loading ? (
                        <p>Loading approvals...</p>
                    ) : approvals.filter(approval =>
                        (approval.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            approval.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            approval.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            approval.status?.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).length > 0 ? (
                        <div className="space-y-4">
                            {approvals.filter(approval =>
                                (approval.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    approval.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    approval.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    approval.status?.toLowerCase().includes(searchTerm.toLowerCase()))
                            ).map((approval) => (
                                <div
                                    key={approval.approvalId}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`badge ${getStatusBadge(approval.status)}`}>
                                                    {approval.status}
                                                </span>
                                                <span className={`badge ${getActionTypeBadge(approval.actionType)}`}>
                                                    {approval.actionType}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {approval.tableName} #{approval.recordId}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                <strong>Staff:</strong> {approval.staffName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Submitted:</strong> {new Date(approval.submittedAt).toLocaleString()}
                                            </p>
                                        </div>

                                        {approval.status === 'Pending' && (
                                            <button
                                                onClick={() => openReviewModal(approval)}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Review
                                            </button>
                                        )}
                                    </div>

                                    {/* Action Data Preview */}
                                    {approval.actionData && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded">
                                            <p className="text-xs text-gray-600 mb-1">Action Data:</p>
                                            <pre className="text-xs overflow-x-auto">
                                                {JSON.stringify(JSON.parse(approval.actionData), null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Admin Review */}
                                    {approval.status !== 'Pending' && (
                                        <div className={`mt-3 p-3 rounded ${approval.status === 'Approved' ? 'bg-green-50' : 'bg-red-50'
                                            }`}>
                                            <p className="text-sm font-medium flex items-center gap-1">
                                                {approval.status === 'Approved' ? <><FaCheck /> Approved</> : <><FaTimes /> Rejected</>} by {approval.adminName || 'Admin'}
                                            </p>
                                            {approval.adminNotes && (
                                                <p className="text-sm text-gray-700 mt-1">
                                                    Notes: {approval.adminNotes}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(approval.reviewedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No approvals found</p>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedApproval && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold">Review Action</h3>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Approval Details */}
                            <div className="space-y-3 mb-4">
                                <div>
                                    <span className="font-medium">Staff:</span> {selectedApproval.staffName}
                                </div>
                                <div>
                                    <span className="font-medium">Action Type:</span>{' '}
                                    <span className={`badge ${getActionTypeBadge(selectedApproval.actionType)}`}>
                                        {selectedApproval.actionType}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Table:</span> {selectedApproval.tableName}
                                </div>
                                <div>
                                    <span className="font-medium">Record ID:</span> #{selectedApproval.recordId}
                                </div>
                                <div>
                                    <span className="font-medium">Submitted:</span>{' '}
                                    {new Date(selectedApproval.submittedAt).toLocaleString()}
                                </div>
                            </div>

                            {/* Action Data */}
                            {selectedApproval.actionData && (
                                <div className="mb-4">
                                    <p className="font-medium mb-2">Action Data:</p>
                                    <pre className="p-3 bg-gray-50 rounded text-sm overflow-x-auto">
                                        {JSON.stringify(JSON.parse(selectedApproval.actionData), null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Notes {selectedApproval.status === 'Pending' && '(Required for rejection)'}
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="input"
                                    rows="4"
                                    placeholder="Add your review notes..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleApprove}
                                    className="btn btn-success flex-1 flex items-center justify-center gap-1"
                                >
                                    <FaCheck /> Approve
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="btn btn-danger flex-1 flex items-center justify-center gap-1"
                                >
                                    <FaTimes /> Reject
                                </button>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="btn btn-secondary"
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

export default ApprovalsPage;
