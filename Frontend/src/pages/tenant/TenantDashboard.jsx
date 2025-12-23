import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { FaBullhorn, FaExclamationTriangle } from 'react-icons/fa';

export default function TenantDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboard();
        fetchNotifications();
        fetchMessages();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/tenant/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDashboardData(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard');
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Only get unread messages
            const unreadMessages = response.data.filter(m => !m.isRead);
            setMessages(unreadMessages);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotifications(notifications.map(n =>
                n.notificationId === notificationId ? { ...n, isRead: true } : n
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(notifications.filter(n => n.notificationId !== notificationId));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex justify-center items-center pt-20">
                    <div className="text-xl">Loading dashboard...</div>
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

    if (!dashboardData) {
        return null;
    }

    const { tenant, currentUnit, activeLease, upcomingRent, recentInvoices, openMaintenanceRequests } = dashboardData;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const unreadMessagesCount = messages.length;
    const totalUnreadCount = unreadCount + unreadMessagesCount;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Welcome, {tenant.name}!</h1>

                {/* Notifications Section */}
                {(notifications.length > 0 || messages.length > 0) && (
                    <div className="mb-6 bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Notifications {totalUnreadCount > 0 && (
                                    <span className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                                        {totalUnreadCount} new
                                    </span>
                                )}
                            </h2>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {/* Display Unread Messages/Announcements First */}
                            {messages.slice(0, 3).map((message) => (
                                <div
                                    key={`msg-${message.messageId}`}
                                    className="border rounded-lg p-4 border-l-4 border-green-500 bg-green-50"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    New!
                                                </span>
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                                                    <FaBullhorn /> Announcement
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(message.sentAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-800 font-semibold mb-1">
                                                {message.title}
                                            </p>
                                            <p className="text-gray-600 text-sm line-clamp-2">
                                                {message.body}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Display Regular Notifications */}
                            {notifications.slice(0, 5).map((notification) => (
                                <div
                                    key={notification.notificationId}
                                    className={`border rounded-lg p-4 ${!notification.isRead ? 'border-l-4 border-blue-500 bg-blue-50' : 'bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${notification.type === 'MaintenanceEscalation' ? 'bg-red-100 text-red-800' :
                                                    notification.type === 'PaymentReminder' ? 'bg-yellow-100 text-yellow-800' :
                                                        notification.type === 'LeaseExpiry' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {notification.type}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className={`text-gray-800 ${!notification.isRead ? 'font-semibold' : ''}`}>
                                                {notification.message}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => markAsRead(notification.notificationId)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.notificationId)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {/* Current Unit Card */}
                    {currentUnit && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Current Unit</h2>
                            <div className="space-y-2">
                                <p><span className="font-medium">Unit:</span> {currentUnit.unitNumber}</p>
                                <p><span className="font-medium">Floor:</span> {currentUnit.floor}</p>
                                <p><span className="font-medium">Building:</span> {currentUnit.building}</p>
                                <p><span className="font-medium">Property:</span> {currentUnit.property}</p>
                                {currentUnit.size && <p><span className="font-medium">Size:</span> {currentUnit.size} sqft</p>}
                            </div>
                        </div>
                    )}

                    {/* Active Lease Card */}
                    {activeLease && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Active Lease</h2>
                            <div className="space-y-2">
                                <p><span className="font-medium">Start Date:</span> {new Date(activeLease.startDate).toLocaleDateString()}</p>
                                <p><span className="font-medium">End Date:</span> {new Date(activeLease.endDate).toLocaleDateString()}</p>
                                <p><span className="font-medium">Rent:</span> RM{activeLease.rentAmount.toFixed(2)}</p>
                                <p><span className="font-medium">Deposit:</span> RM{activeLease.depositAmount.toFixed(2)}</p>
                                <p className={`font-semibold ${activeLease.daysUntilExpiry < 60 ? 'text-red-600' : 'text-green-600'}`}>
                                    {activeLease.daysUntilExpiry} days until expiry
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Upcoming Rent Card */}
                    {upcomingRent && (
                        <div className={`bg-white rounded-lg shadow p-6 ${upcomingRent.isOverdue ? 'border-2 border-red-500' : ''}`}>
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">
                                {upcomingRent.isOverdue ? 'Overdue Payment' : 'Upcoming Rent'}
                            </h2>
                            <div className="space-y-2">
                                <p className="text-2xl font-bold text-gray-900">RM{upcomingRent.amount.toFixed(2)}</p>
                                <p><span className="font-medium">Due Date:</span> {new Date(upcomingRent.dueDate).toLocaleDateString()}</p>
                                <p><span className="font-medium">Status:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-sm ${upcomingRent.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                        upcomingRent.isOverdue ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {upcomingRent.status}
                                    </span>
                                </p>
                                {upcomingRent.isOverdue && (
                                    <p className="text-red-600 font-semibold mt-2 flex items-center gap-2"><FaExclamationTriangle /> Payment is overdue!</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Open Maintenance Requests */}
                {openMaintenanceRequests && openMaintenanceRequests.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Open Maintenance Requests</h2>
                        <div className="space-y-4">
                            {openMaintenanceRequests.map((request) => (
                                <div key={request.maintenanceRequestId} className="border-l-4 border-blue-500 pl-4 py-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{request.issueType}</p>
                                            <p className="text-gray-600 text-sm">{request.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Submitted: {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded text-sm font-medium ${request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {request.status}
                                            </span>
                                            <p className={`text-xs mt-1 ${request.priority === 'Urgent' ? 'text-red-600' :
                                                request.priority === 'High' ? 'text-orange-600' :
                                                    'text-gray-600'
                                                }`}>
                                                {request.priority} Priority
                                            </p>
                                            {request.isEscalated && (
                                                <p className="text-xs text-red-600 font-semibold mt-1">🚨 Escalated</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Invoices */}
                {recentInvoices && recentInvoices.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Recent Invoices</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentInvoices.map((invoice) => (
                                        <tr key={invoice.invoiceId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">#{invoice.invoiceId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">RM{invoice.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                    invoice.isOverdue ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {invoice.status}
                                                    {invoice.isOverdue && ' (Overdue)'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
