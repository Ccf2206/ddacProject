import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import { paymentsAPI, invoicesAPI } from '../../services/api';

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
        notes: ''
    });
    const [uploadingProof, setUploadingProof] = useState(null);

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
            await paymentsAPI.create(formData);
            setShowForm(false);
            setFormData({
                invoiceId: '',
                amount: '',
                paymentDate: new Date().toISOString().split('T')[0],
                method: 'Bank Transfer',
                notes: ''
            });
            fetchData();
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
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

    const columns = [
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
                    <a href={`http://localhost:5000${row.proofUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm">
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
            header: 'Notes',
            accessor: 'notes',
            render: (row) => <span className="text-sm text-gray-600">{row.notes || '-'}</span>
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                            INV-{String(inv.invoiceId).padStart(5, '0')} - {inv.lease?.tenant?.user?.name} - RM {inv.amount}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RM) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                                <input
                                    type="date"
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
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
                                    <option value="Check">Check</option>
                                    <option value="Online Payment">Online Payment</option>
                                </select>
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
                        <DataTable columns={columns} data={payments} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentsPage;
