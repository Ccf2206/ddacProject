import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import { invoicesAPI, leasesAPI } from '../../services/api';
import { FaEnvelope } from 'react-icons/fa';

function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ leaseId: '', amount: '', issueDate: '', dueDate: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [invoicesRes, leasesRes] = await Promise.all([
                invoicesAPI.getAll(),
                leasesAPI.getAll()
            ]);
            setInvoices(invoicesRes.data);
            setLeases(leasesRes.data.filter(l => l.status === 'Active'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        try {
            await invoicesAPI.create(formData);
            setShowForm(false);
            setFormData({ leaseId: '', amount: '', issueDate: '', dueDate: '' });
            fetchData();
        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleStatusChange = async (invoiceId, status) => {
        try {
            await invoicesAPI.updateStatus(invoiceId, status);
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSendReminder = async (invoiceId) => {
        if (!window.confirm('Send payment reminder to tenant?')) return;

        try {
            const token = localStorage.getItem('token');
            const axios = (await import('axios')).default;
            await axios.post(
                `http://localhost:5000/api/invoices/${invoiceId}/send-reminder`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Reminder sent successfully!');
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Error sending reminder');
        }
    };

    const columns = [
        {
            header: 'Invoice #',
            accessor: 'invoiceId',
            render: (row) => <span className="font-mono text-sm">INV-{String(row.invoiceId).padStart(5, '0')}</span>
        },
        {
            header: 'Tenant',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.lease?.tenant?.user?.name}</div>
                    <div className="text-sm text-gray-500">{row.lease?.unit?.unitNumber}</div>
                </div>
            )
        },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (row) => <span className="font-semibold">RM {row.amount.toFixed(2)}</span>
        },
        {
            header: 'Issue Date',
            accessor: 'issueDate',
            render: (row) => new Date(row.issueDate).toLocaleDateString()
        },
        {
            header: 'Due Date',
            accessor: 'dueDate',
            render: (row) => new Date(row.dueDate).toLocaleDateString()
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => {
                const colors = {
                    Paid: 'badge-success',
                    Unpaid: 'badge-warning',
                    Overdue: 'badge-danger'
                };
                return <span className={`badge ${colors[row.status]}`}>{row.status}</span>;
            }
        },
        {
            header: 'Actions',
            render: (row) => (
                <div className="flex gap-2">
                    <select
                        value={row.status}
                        onChange={(e) => handleStatusChange(row.invoiceId, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                    >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                    {(row.status === 'Overdue' || row.status === 'Unpaid') && (
                        <button
                            onClick={() => handleSendReminder(row.invoiceId)}
                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 flex items-center gap-1"
                            title="Send payment reminder"
                        >
                            <FaEnvelope /> Remind
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Invoices Management</h2>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        {showForm ? 'Cancel' : '+ Generate Invoice'}
                    </button>
                </div>

                {showForm && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4">Generate New Invoice</h3>
                        <form onSubmit={handleGenerate} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lease *</label>
                                <select
                                    value={formData.leaseId}
                                    onChange={(e) => setFormData({ ...formData, leaseId: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                >
                                    <option value="">Select Lease</option>
                                    {leases.map(lease => (
                                        <option key={lease.leaseId} value={lease.leaseId}>
                                            {lease.tenant?.user?.name} - {lease.unit?.unitNumber} (RM {lease.rentAmount})
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                                <input
                                    type="date"
                                    value={formData.issueDate}
                                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <button type="submit" className="btn btn-primary">Generate Invoice</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card">
                    {loading ? (
                        <p>Loading invoices...</p>
                    ) : (
                        <DataTable columns={columns} data={invoices} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default InvoicesPage;
