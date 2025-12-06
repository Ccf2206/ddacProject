import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { leasesAPI } from '../../services/api';

function LeasesPage() {
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeases();
    }, []);

    const fetchLeases = async () => {
        try {
            const response = await leasesAPI.getAll({});
            setLeases(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching leases:', error);
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            Active: 'badge-success',
            Expired: 'badge-warning',
            Terminated: 'badge-danger',
        };
        return badges[status] || 'badge-info';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Leases Management</h2>

                {loading ? (
                    <p>Loading leases...</p>
                ) : (
                    <div className="card overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leases.map((lease) => (
                                    <tr key={lease.leaseId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {lease.tenant?.user?.name || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {lease.tenant?.user?.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {lease.unit?.unitNumber || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                                            RM{lease.rentAmount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(lease.startDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(lease.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${getStatusBadge(lease.status)}`}>
                                                {lease.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {leases.length === 0 && !loading && (
                    <div className="card text-center py-12">
                        <p className="text-gray-500">No leases found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LeasesPage;
