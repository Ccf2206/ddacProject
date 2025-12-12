import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import { paymentsAPI, invoicesAPI } from '../../services/api';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

// function PaymentsPage() {
//     const [payments, setPayments] = useState([]);
//     const [invoices, setInvoices] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [showForm, setShowForm] = useState(false);
//     const [formData, setFormData] = useState({
//         invoiceId: '',
//         amount: '',
//         paymentDate: new Date().toISOString().split('T')[0],
//         method: 'Bank Transfer',
//         notes: ''
//     });

//     const [uploadingProof, setUploadingProof] = useState(null);
// const [expandedRows, setExpandedRows] = useState({});
//     setPayments(paymentsRes.data);
//     setInvoices(invoicesRes.data.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue'));
// };
// import DataTable from '../../components/DataTable';
// import { paymentsAPI, invoicesAPI } from '../../services/api';

function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        invoiceId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        method: 'Bank Transfer',
        notes: '',
        proofFile: null
    });
    const [uploadingProof, setUploadingProof] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [paymentsRes, invoicesRes] = await Promise.all([
                paymentsAPI.getAll(),
                invoicesAPI.getAll()
            ]);
            setPayments(paymentsRes.data);
            setInvoices(invoicesRes.data.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };


    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            // Create payment without file first
            const paymentData = {
                invoiceId: formData.invoiceId,
                amount: formData.amount,
                paymentDate: formData.paymentDate,
                method: formData.method,
                notes: formData.notes
            };

            const response = await paymentsAPI.create(paymentData);

            // Upload proof file if provided
            if (formData.proofFile && response.data?.paymentId) {
                await paymentsAPI.uploadProof(response.data.paymentId, formData.proofFile);
            }

            setAlert({ show: true, message: 'Payment recorded successfully!', type: 'success' });
            setShowForm(false);
            setFormData({
                invoiceId: '',
                amount: '',
                paymentDate: new Date().toISOString().split('T')[0],
                method: 'Bank Transfer',
                notes: '',
                proofFile: null
            });
            fetchData();
        } catch (error) {
            console.error('Error recording payment:', error);
            setAlert({ show: true, message: error.response?.data?.message || error.message, type: 'error' });
        }
    };

    const handleUploadProof = async (paymentId, file) => {
        try {
            await paymentsAPI.uploadProof(paymentId, file);
            setUploadingProof(null);
            fetchData();
        } catch (error) {
            console.error('Error uploading proof:', error);
            alert('Error uploading proof');
        }
    };

    const toggleRowExpansion = (paymentId) => {
        setExpandedRows(prev => ({
            ...prev,
            [paymentId]: !prev[paymentId]
        }));
    };

    const handleApprovePayment = (paymentId, approved) => {
        setConfirmAction({
            paymentId,
            approved,
            action: approved ? 'approve' : 'reject'
        });
        setRejectionReason('');
        setShowConfirmModal(true);
    };

    const confirmApproval = async () => {
        if (!confirmAction) return;

        // Validate rejection reason if rejecting
        if (!confirmAction.approved && !rejectionReason.trim()) {
            setAlert({ show: true, message: 'Rejection reason is required', type: 'error' });
            return;
        }

        try {
            await paymentsAPI.approve(
                confirmAction.paymentId,
                confirmAction.approved,
                confirmAction.approved ? null : rejectionReason
            );
            const paymentIdFormatted = `PAY-${String(confirmAction.paymentId).padStart(5, '0')}`;
            setAlert({
                show: true,
                message: `Payment ${paymentIdFormatted} ${confirmAction.approved ? 'approved' : 'rejected'} successfully!`,
                type: 'success'
            });
            setShowConfirmModal(false);
            setConfirmAction(null);
            setRejectionReason('');
            fetchData();
        } catch (error) {
            console.error('Error approving payment:', error);
            setAlert({ show: true, message: error.response?.data?.message || error.message, type: 'error' });
            setShowConfirmModal(false);
            setConfirmAction(null);
            setRejectionReason('');
        }
    };

    const columns = [
        {
            header: '',
            render: (row) => (
                <button
                    onClick={() => toggleRowExpansion(row.paymentId)}
                    className="text-gray-600 hover:text-gray-800"
                >
                    {expandedRows[row.paymentId] ? <FaChevronDown /> : <FaChevronRight />}
                </button>
            )
        },
        {
            header: 'Payment #',
            accessor: 'paymentId',
            render: (row) => <span className="font-mono text-sm">PAY-{String(row.paymentId).padStart(5, '0')}</span>
        },
        {
            header: 'Invoice',
            render: (row) => (
                <div>
                    <div className="font-medium">INV-{String(row.invoiceId).padStart(5, '0')}</div>
                    <div className="text-sm text-gray-500">{row.invoice?.lease?.tenant?.user?.name}</div>
                </div>
            )
        },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (row) => <span className="font-semibold text-green-600">RM {row.amount.toFixed(2)}</span>
        },
        {
            header: 'Date',
            accessor: 'paymentDate',
            render: (row) => new Date(row.paymentDate).toLocaleDateString()
        },
        {
            header: 'Method',
            accessor: 'method'
        },
        {
            header: 'Proof',
            render: (row) => (
                row.proofUrl ? (
                    <a href={`http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com${row.proofUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm">
                        View
                    </a>
                ) : (
                    <label className="text-sm text-gray-500 cursor-pointer hover:text-primary-600">
                        Upload
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={(e) => e.target.files[0] && handleUploadProof(row.paymentId, e.target.files[0])}
                        />
                    </label>
                )
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const colors = {
                    Pending: 'bg-yellow-100 text-yellow-800',
                    Approved: 'bg-green-100 text-green-800',
                    Rejected: 'bg-red-100 text-red-800'
                };
                return (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[row.status] || 'bg-gray-100 text-gray-800'}`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            header: 'Actions',
            render: (row) => (
                row.status === 'Pending' ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleApprovePayment(row.paymentId, true)}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-medium"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleApprovePayment(row.paymentId, false)}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-medium"
                        >
                            Reject
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-gray-500">-</span>
                )
            )
        },
        // {
        //     header: 'Notes',
        //     accessor: 'notes',
        //     render: (row) => <span className="text-sm text-gray-600">{row.notes || '-'}</span>
        // }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Alert Panel */}
                {alert.show && (
                    <div className={`mb-6 p-4 rounded-lg flex justify-between items-center ${alert.type === 'success' ? 'bg-green-100 border border-green-400 text-green-800' :
                        alert.type === 'error' ? 'bg-red-100 border border-red-400 text-red-800' :
                            'bg-blue-100 border border-blue-400 text-blue-800'
                        }`}>
                        <span className="font-medium">{alert.message}</span>
                        <button
                            onClick={() => setAlert({ show: false, message: '', type: '' })}
                            className="text-xl font-bold hover:opacity-70"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Payments Management</h2>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        {showForm ? 'Cancel' : '+ Record Payment'}
                    </button>
                </div>

                {showForm && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4">Record New Payment</h3>
                        <form onSubmit={handleRecordPayment} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice *</label>
                                <select
                                    value={formData.invoiceId}
                                    onChange={(e) => setFormData({ ...formData, invoiceId: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                >
                                    <option value="">Select Unpaid Invoice</option>
                                    {invoices.map(inv => (
                                        <option key={inv.invoiceId} value={inv.invoiceId}>
                                            ({inv.invoiceId}) - {inv.lease?.tenant?.user?.name} - RM {(inv.amount - inv.paidAmount).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RM) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="input"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Must be greater than RM 0.00</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                                <input
                                    type="date"
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Method *</label>
                                <select
                                    value={formData.method}
                                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                    className="input"
                                    required
                                >
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Online Payment">Online Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Proof *</label>
                                {formData.proofFile ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-700 flex-1">{formData.proofFile.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, proofFile: null })}
                                            className="text-red-600 hover:text-red-800 font-bold text-xl"
                                            title="Remove file"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setFormData({ ...formData, proofFile: e.target.files[0] })}
                                        className="input"
                                        required
                                    />
                                )}
                                <p className="text-xs text-gray-500 mt-1">Upload receipt or proof of payment (Required)</p>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="input"
                                    rows="2"
                                />
                            </div>
                            <div className="col-span-2">
                                <button type="submit" className="btn btn-primary">Record Payment</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card">
                    {loading ? (
                        <p>Loading payments...</p>
                    ) : (
                        <div>
                            {/* Pagination Controls - Top */}
                            {payments.length > 10 && (
                                <div className="flex justify-between items-center mb-4 px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-700">Show</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                        <span className="text-sm text-gray-700">entries</span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, payments.length)} of {payments.length} entries
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {columns.map((col, idx) => (
                                                <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {col.header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((payment) => (
                                            <>
                                                <tr key={payment.paymentId} className="hover:bg-gray-50">
                                                    {columns.map((col, idx) => (
                                                        <td key={idx} className="px-6 py-4 whitespace-nowrap">
                                                            {col.render ? col.render(payment) : payment[col.accessor]}
                                                        </td>
                                                    ))}
                                                </tr>
                                                {expandedRows[payment.paymentId] && (
                                                    <tr key={`${payment.paymentId}-expanded`} className="bg-gray-50">
                                                        <td colSpan={columns.length} className="px-6 py-4">
                                                            <div className="space-y-2">
                                                                <div className="text-sm text-gray-700">
                                                                    <span className="font-semibold">Notes: </span>
                                                                    {payment.notes?.trim() ? payment.notes : <span className="italic text-gray-500">Empty.</span>}
                                                                </div>
                                                                {payment.status === 'Rejected' && payment.reasonofReject && (
                                                                    <div className="text-sm text-red-600">
                                                                        <span className="font-semibold">Reason of Reject: </span>
                                                                        {payment.reasonofReject}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls - Bottom */}
                            {Math.ceil(payments.length / itemsPerPage) > 1 && (
                                <div className="flex justify-center items-center mt-4 gap-2">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>

                                    {Array.from({ length: Math.ceil(payments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 border rounded text-sm ${currentPage === page
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === Math.ceil(payments.length / itemsPerPage)}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Confirmation Modal */}
                {showConfirmModal && confirmAction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                            <h3 className="text-lg font-bold mb-4">
                                Confirm {confirmAction.action === 'approve' ? 'Approval' : 'Rejection'}
                            </h3>
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to {confirmAction.action} payment <span className="font-semibold">PAY-{String(confirmAction.paymentId).padStart(5, '0')}</span>?
                            </p>

                            {!confirmAction.approved && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Rejection <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Please provide a reason for rejecting this payment..."
                                        required
                                    />
                                    {!rejectionReason.trim() && (
                                        <p className="text-xs text-red-500 mt-1">This field is required</p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setConfirmAction(null);
                                        setRejectionReason('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmApproval}
                                    className={`px-4 py-2 rounded-lg text-white font-medium ${confirmAction.action === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentsPage;
