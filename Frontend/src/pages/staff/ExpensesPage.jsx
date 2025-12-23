import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import { propertiesAPI, expensesAPI } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import { PERMISSIONS } from '../../utils/permissions';

function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        PropertyId: '',
        Category: 'Maintenance',
        Amount: '',
        Description: '',
        Date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [expensesRes, propertiesRes] = await Promise.all([
                expensesAPI.getAll(),
                propertiesAPI.getAll()
            ]);
            setExpenses(expensesRes.data);
            setProperties(propertiesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await expensesAPI.create(formData);
            setShowForm(false);
            setFormData({
                PropertyId: '',
                Category: 'Maintenance',
                Amount: '',
                Description: '',
                Date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            console.error('Error creating expense:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const columns = [
        {
            header: 'Date',
            accessor: 'date',
            render: (row) => new Date(row.date).toLocaleDateString()
        },
        {
            header: 'Property',
            render: (row) => row.property?.name || 'N/A'
        },
        {
            header: 'Category',
            accessor: 'category',
            render: (row) => <span className="badge badge-info">{row.category}</span>
        },
        {
            header: 'Description',
            accessor: 'description'
        },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (row) => <span className="font-semibold text-red-600">RM {row.amount.toFixed(2)}</span>
        }
    ];

    // Filter expenses based on search term
    const filteredExpenses = expenses.filter(expense =>
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount?.toString().includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Expenses Management</h2>
                    <PermissionGuard permission={PERMISSIONS.EXPENSES_CREATE}>
                        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                            {showForm ? 'Cancel' : '+ Record Expense'}
                        </button>
                    </PermissionGuard>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search expenses by category, description, property, or amount..."
                    />
                </div>

                {showForm && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4">Record New Expense</h3>
                        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                                <select
                                    value={formData.PropertyId}
                                    onChange={(e) => setFormData({ ...formData, PropertyId: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                >
                                    <option value="">Select Property</option>
                                    {properties.map(p => (
                                        <option key={p.propertyId} value={p.propertyId}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    value={formData.Category}
                                    onChange={(e) => setFormData({ ...formData, Category: e.target.value })}
                                    className="input"
                                    required
                                >
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Repairs">Repairs</option>
                                    <option value="Insurance">Insurance</option>
                                    <option value="Taxes">Taxes</option>
                                    <option value="Management">Management</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RM) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.Amount}
                                    onChange={(e) => setFormData({ ...formData, Amount: parseFloat(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    value={formData.Date}
                                    onChange={(e) => setFormData({ ...formData, Date: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                <textarea
                                    value={formData.Description}
                                    onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                                    className="input"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <button type="submit" className="btn btn-primary">Record Expense</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card">
                    {loading ? (
                        <p>Loading expenses...</p>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">No expenses recorded yet</p>
                            <button onClick={() => setShowForm(true)} className="btn btn-primary">
                                Record Your First Expense
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 text-sm text-gray-600">
                                Showing {filteredExpenses.length} of {expenses.length} expenses
                            </div>
                            <DataTable columns={columns} data={filteredExpenses} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ExpensesPage;
