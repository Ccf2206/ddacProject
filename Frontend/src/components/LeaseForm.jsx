import { useState, useEffect } from 'react';
import { tenantsAPI, unitsAPI } from '../services/api';

function LeaseForm({ lease, onSubmit, onCancel }) {
    const [tenants, setTenants] = useState([]);
    const [units, setUnits] = useState([]);
    const [formData, setFormData] = useState({
        tenantId: '',
        unitId: '',
        rentAmount: '',
        depositAmount: '',
        startDate: '',
        endDate: '',
        paymentCycle: 'Monthly',
        status: 'Active'
    });

    useEffect(() => {
        fetchData();
        if (lease) {
            setFormData({
                tenantId: lease.tenantId || '',
                unitId: lease.unitId || '',
                rentAmount: lease.rentAmount || '',
                depositAmount: lease.depositAmount || '',
                startDate: lease.startDate?.split('T')[0] || '',
                endDate: lease.endDate?.split('T')[0] || '',
                paymentCycle: lease.paymentCycle || 'Monthly',
                status: lease.status || 'Active'
            });
        }
    }, [lease]);

    const fetchData = async () => {
        try {
            const [tenantsRes, unitsRes] = await Promise.all([
                tenantsAPI.getAll(),
                unitsAPI.getAll()
            ]);
            setTenants(tenantsRes.data);
            setUnits(unitsRes.data.filter(u => u.status === 'Available' || lease?.unitId === u.unitId));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {lease ? 'Edit Lease' : 'Create New Lease'}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                                <select
                                    value={formData.tenantId}
                                    onChange={(e) => setFormData({ ...formData, tenantId: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                    disabled={!!lease}
                                >
                                    <option value="">Select Tenant</option>
                                    {tenants.map(t => (
                                        <option key={t.tenantId} value={t.tenantId}>
                                            {t.user?.name} - {t.user?.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                                <select
                                    value={formData.unitId}
                                    onChange={(e) => setFormData({ ...formData, unitId: parseInt(e.target.value) })}
                                    className="input"
                                    required
                                    disabled={!!lease}
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => (
                                        <option key={u.unitId} value={u.unitId}>
                                            {u.unitNumber} - {u.type} (RM {u.rentPrice}/month)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount (RM) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.rentAmount}
                                    onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (RM) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.depositAmount}
                                    onChange={(e) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Cycle *</label>
                                <select
                                    value={formData.paymentCycle}
                                    onChange={(e) => setFormData({ ...formData, paymentCycle: e.target.value })}
                                    className="input"
                                    required
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input"
                                    required
                                >
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Terminated">Terminated</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {lease ? 'Update' : 'Create'} Lease
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LeaseForm;
