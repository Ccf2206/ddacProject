import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function TenantPayments() {
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/invoices', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewDetails = async (invoice) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/invoices/${invoice.invoiceId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedInvoice(response.data);
            setShowDetails(true);
        } catch (error) {
            console.error('Error fetching invoice details:', error);
        }
    };

    const handlePayInvoice = async (invoiceId) => {
        if (!confirm('Confirm payment for this invoice?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:5000/api/invoices/${invoiceId}/pay`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Payment successful!');
            setShowDetails(false);
            fetchInvoices();
        } catch (error) {
            console.error('Error paying invoice:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const getStatusColor = (status, isOverdue) => {
        if (isOverdue) return 'bg-red-100 text-red-800';
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        if (filter === 'All') return true;
        if (filter === 'Paid') return invoice.status === 'Paid';
        if (filter === 'Pending') return invoice.status === 'Pending' && !invoice.isOverdue;
        if (filter === 'Overdue') return invoice.isOverdue;
        return true;
    });

    const totalPaid = invoices
        .filter(i => i.status === 'Paid')
        .reduce((sum, i) => sum + i.amount, 0);

    const totalPending = invoices
        .filter(i => i.status === 'Pending')
        .reduce((sum, i) => sum + i.amount, 0);

    const totalOverdue = invoices
        .filter(i => i.isOverdue)
        .reduce((sum, i) => sum + i.amount, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Invoices & Payments</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Paid</h3>
                        <p className="text-2xl font-bold text-green-600">RM {totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Pending</h3>
                        <p className="text-2xl font-bold text-yellow-600">RM {totalPending.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Overdue</h3>
                        <p className="text-2xl font-bold text-red-600">RM {totalOverdue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex gap-2 flex-wrap">
                        {['All', 'Paid', 'Pending', 'Overdue'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Invoices List */}
                {loading ? (
                    <p>Loading invoices...</p>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                No invoices found for this filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map((invoice) => (
                                            <tr key={invoice.invoiceId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    #{invoice.invoiceId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                                    RM {invoice.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {new Date(invoice.issueDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(invoice.status, invoice.isOverdue)}`}>
                                                        {invoice.isOverdue ? 'Overdue' : invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => viewDetails(invoice)}
                                                            className="text-primary-600 hover:text-primary-800 font-medium"
                                                        >
                                                            View Details
                                                        </button>
                                                        {(invoice.status === 'Pending' || invoice.status === 'Unpaid') && (
                                                            <button
                                                                onClick={() => handlePayInvoice(invoice.invoiceId)}
                                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium"
                                                            >
                                                                Pay Now
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Invoice Details Modal */}
                {showDetails && selectedInvoice && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Invoice Details</h2>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Invoice Number</p>
                                        <p className="font-semibold">#{selectedInvoice.invoiceId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(selectedInvoice.status, selectedInvoice.isOverdue)}`}>
                                            {selectedInvoice.isOverdue ? 'Overdue' : selectedInvoice.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Issue Date</p>
                                        <p className="font-semibold">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Due Date</p>
                                        <p className="font-semibold">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-lg font-medium">Total Amount</p>
                                        <p className="text-2xl font-bold text-primary-600">
                                            RM {selectedInvoice.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold mb-3">Payment History</h3>
                                        <div className="space-y-3">
                                            {selectedInvoice.payments.map((payment) => (
                                                <div key={payment.paymentId} className="bg-gray-50 p-3 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">RM {payment.amount.toFixed(2)}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-sm text-gray-500">Method: {payment.paymentMethod || payment.method}</p>
                                                        </div>
                                                        {payment.proofUrl && (
                                                            <a
                                                                href={`http://localhost:5000${payment.proofUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                                                            >
                                                                View Receipt
                                                            </a>
                                                        )}
                                                    </div>
                                                    {payment.notes && (
                                                        <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedInvoice.isOverdue && selectedInvoice.overdueReminderCount > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-800 font-medium">
                                            ⚠️ {selectedInvoice.overdueReminderCount} reminder(s) sent
                                        </p>
                                        {selectedInvoice.lastReminderSentAt && (
                                            <p className="text-red-600 text-sm mt-1">
                                                Last reminder: {new Date(selectedInvoice.lastReminderSentAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Pay Now Button */}
                                {(selectedInvoice.status === 'Pending' || selectedInvoice.status === 'Unpaid') && (
                                    <div className="pt-4 border-t">
                                        <button
                                            onClick={() => handlePayInvoice(selectedInvoice.invoiceId)}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
                                        >
                                            💳 Pay Now - RM {selectedInvoice.amount.toFixed(2)}
                                        </button>
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
