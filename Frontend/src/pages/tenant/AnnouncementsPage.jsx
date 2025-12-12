import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messagesAPI } from '../../services/api';
import Navbar from '../../components/Navbar';

export default function AnnouncementsPage() {
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await messagesAPI.getAll();
            setMessages(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load announcements');
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const viewMessage = async (message) => {
        setSelectedMessage(message);
        
        // Mark as read when viewing
        if (!message.isRead) {
            try {
                await messagesAPI.markAsRead(message.messageId);
                // Update local state immediately
                setMessages(prevMessages => 
                    prevMessages.map(m =>
                        m.messageId === message.messageId ? { ...m, isRead: true } : m
                    )
                );
            } catch (err) {
                console.error('Error marking message as read:', err);
            }
        }
    };

    const markAllAsRead = async () => {
        try {
            await messagesAPI.markAllAsRead();
            // Update all messages to read status
            setMessages(prevMessages => 
                prevMessages.map(m => ({ ...m, isRead: true }))
            );
        } catch (err) {
            console.error('Error marking all messages as read:', err);
            alert('Failed to mark all messages as read');
        }
    };

    const closeModal = () => {
        setSelectedMessage(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex justify-center items-center pt-20">
                    <div className="text-xl">Loading announcements...</div>
                </div>
            </div>
        );
    }

    const unreadCount = messages.filter(m => !m.isRead).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-6 max-w-6xl mx-auto">
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
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
                        {unreadCount > 0 && (
                            <p className="text-gray-600 mt-1">
                                You have {unreadCount} unread {unreadCount === 1 ? 'announcement' : 'announcements'}
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark All as Read
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p className="text-gray-500 text-lg">No announcements yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((message) => (
                            <div
                                key={message.messageId}
                                onClick={() => viewMessage(message)}
                                className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition ${
                                    !message.isRead ? 'border-l-4 border-blue-500' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {!message.isRead && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            )}
                                            <h3 className={`text-lg ${!message.isRead ? 'font-bold' : 'font-semibold'} text-gray-800`}>
                                                {message.title}
                                            </h3>
                                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                                {message.recipientType}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                            {message.body}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                From: {message.senderName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(message.sentAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Message Detail Modal */}
                {selectedMessage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                            {selectedMessage.title}
                                        </h2>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                From: {selectedMessage.senderName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(selectedMessage.sentAt).toLocaleString()}
                                            </span>
                                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                                {selectedMessage.recipientType}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 transition"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.body}</p>
                                    </div>

                                    {selectedMessage.attachmentUrl && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Attachment:</p>
                                            <a
                                                href={selectedMessage.attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline"
                                            >
                                                View Attachment
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={closeModal}
                                        className="btn btn-primary"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
