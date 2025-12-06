import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { FaChartBar, FaDollarSign, FaHome, FaWrench, FaExclamationTriangle } from 'react-icons/fa';

function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [financialReport, setFinancialReport] = useState(null);
    const [occupancyReport, setOccupancyReport] = useState(null);
    const [maintenanceReport, setMaintenanceReport] = useState(null);

    // Helper to format date as YYYY-MM-DD in local time
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const [dateRange, setDateRange] = useState({
        startDate: formatLocalDate(lastMonth),
        endDate: formatLocalDate(today)
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const [financial, occupancy, maintenance] = await Promise.all([
                axios.get('http://localhost:5000/api/reports/financial', {
                    params: dateRange,
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/reports/occupancy', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/reports/maintenance', {
                    params: dateRange,
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setFinancialReport(financial.data);
            setOccupancyReport(occupancy.data);
            console.log('DEBUG: Maintenance report data:', maintenance.data);
            setMaintenanceReport(maintenance.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = () => {
        fetchReports();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p>Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2"><FaChartBar /> Reports Dashboard</h2>

                {/* Date Range Filter */}
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-4">Date Range</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleDateRangeChange} className="btn btn-primary w-full">
                                Update Reports
                            </button>
                        </div>
                    </div>
                </div>

                {/* Financial Report */}
                {financialReport && (
                    <div className="card mb-6">
                        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2"><FaDollarSign /> Financial Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                                <p className="text-3xl font-bold text-green-700">
                                    RM {financialReport.totalRevenue?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                                <p className="text-3xl font-bold text-red-700">
                                    RM {financialReport.totalExpenses?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Net Income</p>
                                <p className="text-3xl font-bold text-blue-700">
                                    RM {financialReport.netIncome?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-yellow-600 font-medium">Outstanding Amount</p>
                                <p className="text-3xl font-bold text-yellow-700">
                                    RM {financialReport.outstandingAmount?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600 font-medium">Collection Rate</p>
                                <p className="text-3xl font-bold text-purple-700">
                                    {financialReport.collectionRate?.toFixed(1) || '0.0'}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Occupancy Report */}
                {occupancyReport && (
                    <div className="card mb-6">
                        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2"><FaHome /> Occupancy Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Total Units</p>
                                <p className="text-3xl font-bold text-blue-700">
                                    {occupancyReport.totalUnits || 0}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Occupied</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {occupancyReport.occupiedUnits || 0}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 font-medium">Available</p>
                                <p className="text-3xl font-bold text-gray-700">
                                    {occupancyReport.availableUnits || 0}
                                </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-600 font-medium">Occupancy Rate</p>
                                <p className="text-3xl font-bold text-orange-700">
                                    {occupancyReport.occupancyRate?.toFixed(1) || '0.0'}%
                                </p>
                            </div>
                        </div>

                        {/* Expiring Leases */}
                        {occupancyReport.expiringLeases && occupancyReport.expiringLeases.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><FaExclamationTriangle /> Expiring Leases (Next 60 Days)</h4>
                                <div className="space-y-2">
                                    {occupancyReport.expiringLeases.slice(0, 5).map((lease) => (
                                        <div key={lease.leaseId} className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-200">
                                            <div>
                                                <p className="font-medium">{lease.tenantName}</p>
                                                <p className="text-sm text-gray-600">Unit {lease.unitNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">Expires</p>
                                                <p className="font-semibold text-red-600">
                                                    {new Date(lease.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Maintenance Report */}
                {maintenanceReport && (
                    <div className="card">
                        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2"><FaWrench /> Maintenance Trends</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-yellow-600 font-medium">Total Requests</p>
                                <p className="text-3xl font-bold text-yellow-700">
                                    {maintenanceReport.totalRequests || 0}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Completed</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {maintenanceReport.completedRequests || 0}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Average Resolution Time</p>
                                <p className="text-3xl font-bold text-blue-700">
                                    {maintenanceReport.averageResolutionDays?.toFixed(1) || '0.0'} days
                                </p>
                            </div>
                        </div>

                        {/* By Category */}
                        {maintenanceReport.byCategory && maintenanceReport.byCategory.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-semibold text-lg mb-3">By Category</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {maintenanceReport.byCategory.map((cat) => (
                                        <div key={cat.category} className="p-3 bg-gray-50 rounded">
                                            <p className="text-sm text-gray-600">{cat.category}</p>
                                            <p className="text-2xl font-bold text-gray-800">{cat.count}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsPage;
