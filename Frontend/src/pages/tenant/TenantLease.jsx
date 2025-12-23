import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function TenantLease() {
    const [lease, setLease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLease();
    }, []);

    const fetchLease = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/leases', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Get the active lease for the tenant
            const activeLease = response.data.find(lease => lease.status === 'Active');
            setLease(activeLease);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load lease information');
            console.error('Error fetching lease:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysUntilExpiry = () => {
        if (!lease?.endDate) return null;
        const today = new Date();
        const endDate = new Date(lease.endDate);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysUntilExpiry = getDaysUntilExpiry();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex justify-center items-center pt-20">
                    <div className="text-xl">Loading lease information...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="p-6 max-w-7xl mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="p-6 max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-600 text-lg">No active lease found</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Lease Agreement</h1>

                {/* Expiry Warning */}
                {daysUntilExpiry !== null && daysUntilExpiry < 60 && daysUntilExpiry > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 font-medium flex items-center gap-2">
                            <FaExclamationTriangle /> Your lease will expire in {daysUntilExpiry} days. Please contact management for renewal.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Lease Details */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-semibold mb-6">Lease Details</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Lease ID</h3>
                                <p className="text-lg font-semibold">#{lease.leaseId}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${lease.status === 'Active' ? 'bg-green-100 text-green-800' :
                                    lease.status === 'Expired' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {lease.status}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Unit Number</h3>
                                <p className="text-lg font-semibold">{lease.unit?.unitNumber || 'N/A'}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Unit Type</h3>
                                <p className="text-lg">{lease.unit?.type || 'N/A'}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                                <p className="text-lg">{new Date(lease.startDate).toLocaleDateString()}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                                <p className="text-lg">{new Date(lease.endDate).toLocaleDateString()}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Monthly Rent</h3>
                                <p className="text-2xl font-bold text-primary-600">RM {lease.rentAmount?.toFixed(2)}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Deposit Paid</h3>
                                <p className="text-2xl font-bold text-gray-800">RM {lease.depositAmount?.toFixed(2)}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Cycle</h3>
                                <p className="text-lg">{lease.paymentCycle || 'Monthly'}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Signed On</h3>
                                <p className="text-lg">{new Date(lease.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {lease.signedCopyUrl && (
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-lg font-semibold mb-4">Lease Document</h3>
                                <a
                                    href={lease.signedCopyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 btn btn-primary"
                                >
                                    📄 Download Signed Lease
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Property Information Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Property Information</h2>
                            <div className="space-y-3">
                                {lease.unit?.floor?.building?.property && (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-500">Property</p>
                                            <p className="font-medium">{lease.unit.floor.building.property.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Address</p>
                                            <p className="font-medium">{lease.unit.floor.building.property.address}</p>
                                            <p className="text-sm text-gray-600">
                                                {lease.unit.floor.building.property.city}, {lease.unit.floor.building.property.postcode}
                                            </p>
                                        </div>
                                    </>
                                )}
                                {lease.unit?.floor?.building && (
                                    <div>
                                        <p className="text-sm text-gray-500">Building</p>
                                        <p className="font-medium">{lease.unit.floor.building.name}</p>
                                    </div>
                                )}
                                {lease.unit?.floor && (
                                    <div>
                                        <p className="text-sm text-gray-500">Floor</p>
                                        <p className="font-medium">Floor {lease.unit.floor.floorNumber}</p>
                                    </div>
                                )}
                                {lease.unit?.size && (
                                    <div>
                                        <p className="text-sm text-gray-500">Unit Size</p>
                                        <p className="font-medium">{lease.unit.size} sq ft</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {daysUntilExpiry !== null && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Lease Duration</h2>
                                <div className="text-center">
                                    <p className={`text-4xl font-bold ${daysUntilExpiry < 60 ? 'text-red-600' : 'text-green-600'}`}>
                                        {daysUntilExpiry > 0 ? daysUntilExpiry : 0}
                                    </p>
                                    <p className="text-gray-600 mt-2">
                                        {daysUntilExpiry > 0 ? 'days until expiry' : 'lease has expired'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
