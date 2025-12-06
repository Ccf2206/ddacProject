import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { propertiesAPI, unitsAPI } from '../services/api';

function Dashboard() {
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalUnits: 0,
        availableUnits: 0,
        occupiedUnits: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [propertiesRes, unitsRes] = await Promise.all([
                propertiesAPI.getAll(),
                unitsAPI.getAll({}),
            ]);

            const units = unitsRes.data;
            setStats({
                totalProperties: propertiesRes.data.length,
                totalUnits: units.length,
                availableUnits: units.filter(u => u.status === 'Available').length,
                occupiedUnits: units.filter(u => u.status === 'Occupied').length,
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Properties</p>
                                <p className="text-4xl font-bold mt-2">{stats.totalProperties}</p>
                            </div>
                            <div className="text-5xl opacity-25">🏢</div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Total Units</p>
                                <p className="text-4xl font-bold mt-2">{stats.totalUnits}</p>
                            </div>
                            <div className="text-5xl opacity-25">🏠</div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Available Units</p>
                                <p className="text-4xl font-bold mt-2">{stats.availableUnits}</p>
                            </div>
                            <div className="text-5xl opacity-25">✓</div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm">Occupied Units</p>
                                <p className="text-4xl font-bold mt-2">{stats.occupiedUnits}</p>
                            </div>
                            <div className="text-5xl opacity-25">👥</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="btn btn-primary text-left p-4" onClick={() => window.location.href = '/staff/properties'}>
                            <div className="text-2xl mb-2">🏢</div>
                            <div className="font-semibold">Manage Properties</div>
                            <div className="text-sm opacity-75">View and manage all properties</div>
                        </button>

                        <button className="btn btn-primary text-left p-4" onClick={() => window.location.href = '/staff/units'}>
                            <div className="text-2xl mb-2">🏠</div>
                            <div className="font-semibold">Manage Units</div>
                            <div className="text-sm opacity-75">View and manage rental units</div>
                        </button>

                        <button className="btn btn-primary text-left p-4" onClick={() => window.location.href = '/staff/leases'}>
                            <div className="text-2xl mb-2">📄</div>
                            <div className="font-semibold">Manage Leases</div>
                            <div className="text-sm opacity-75">View and create leases</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
