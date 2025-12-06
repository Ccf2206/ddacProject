import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load notifications');
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/notifications/${notificationId}/read`,
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

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const unreadNotifications = notifications.filter(n => !n.isRead);

            await Promise.all(
                unreadNotifications.map(n =>
                    axios.put(
                        `http://localhost:5000/api/notifications/${n.notificationId}/read`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                )
            );

            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
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
                    <div className="text-xl">Loading notifications...</div>
                </div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-6 max-w-4xl mx-auto">
                {/* Back to Dashboard Button */}
                <button
                    onClick={() => navigate('/tenant/dashboard')}
                    className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition font-medium"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="btn btn-primary"
                        >
                            Mark All as Read ({unreadCount})
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {notifications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500 text-lg">No notifications yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.notificationId}
                                className={`bg-white rounded-lg shadow p-4 ${!notification.isRead ? 'border-l-4 border-blue-500' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {!notification.isRead && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            )}
                                            <span className={`px-2 py-1 rounded text-xs ${notification.type === 'MaintenanceEscalation' ? 'bg-red-100 text-red-800' :
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
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Mark Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification.notificationId)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
