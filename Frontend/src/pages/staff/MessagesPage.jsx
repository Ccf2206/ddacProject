import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';

function MessagesPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [messageForm, setMessageForm] = useState({
        recipientType: 'Individual',
        recipientId: '',
        propertyId: '',
        buildingId: '',
        subject: '',
        body: ''
    });

    useEffect(() => {
        fetchMessages();
        fetchTenants();
        fetchProperties();
    }, []);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/tenants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTenants(response.data);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const fetchProperties = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            const payload = {
                title: messageForm.subject,
                body: messageForm.body,
                recipientType: messageForm.recipientType
            };

            // Add appropriate recipient ID based on type
            if (messageForm.recipientType === 'Individual') {
                payload.recipientId = parseInt(messageForm.recipientId);
            } else if (messageForm.recipientType === 'Property') {
                payload.propertyId = parseInt(messageForm.propertyId);
            } else if (messageForm.recipientType === 'Building') {
                payload.buildingId = parseInt(messageForm.buildingId);
            }

            // All messages use the same endpoint
            await axios.post('http://localhost:5000/api/messages', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Message sent successfully!');
            setShowComposeModal(false);
            setMessageForm({
                recipientType: 'Individual',
                recipientId: '',
                propertyId: '',
                buildingId: '',
                subject: '',
                body: ''
            });
            fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><FaEnvelope /> Messages & Notices</h2>
                    <button
                        onClick={() => setShowComposeModal(true)}
                        className="btn btn-primary"
                    >
                        + Compose Message
                    </button>
                </div>

                {/* Sent Messages */}
                <div className="card">
                    <h3 className="text-xl font-semibold mb-4">Sent Messages</h3>
                    {loading ? (
                        <p>Loading messages...</p>
                    ) : messages.length > 0 ? (
                        <div className="space-y-3">
                            {messages.map((message) => (
                                <div key={message.messageId} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{message.subject}</h4>
                                            <p className="text-sm text-gray-600">
                                                To: {message.recipientType}
                                                {message.recipient && ` - ${message.recipient.name}`}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(message.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700">{message.body}</p>
                                    {message.isRead && (
                                        <span className="text-xs text-green-600 mt-2 inline-block">✓ Read</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No messages sent yet</p>
                    )}
                </div>
            </div>

            {/* Compose Message Modal */}
            {showComposeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold">Compose Message</h3>
                                <button
                                    onClick={() => setShowComposeModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSendMessage} className="space-y-4">
                                {/* Recipient Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Recipient Type *
                                    </label>
                                    <select
                                        value={messageForm.recipientType}
                                        onChange={(e) => setMessageForm({ ...messageForm, recipientType: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="Individual">Individual Tenant</option>
                                        <option value="Broadcast">All Tenants (Broadcast)</option>
                                        <option value="Property">All Tenants in Property</option>
                                        <option value="Building">All Tenants in Building</option>
                                    </select>
                                </div>

                                {/* Individual Tenant Selection */}
                                {messageForm.recipientType === 'Individual' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Tenant *
                                        </label>
                                        <select
                                            value={messageForm.recipientId}
                                            onChange={(e) => setMessageForm({ ...messageForm, recipientId: e.target.value })}
                                            className="input"
                                            required
                                        >
                                            <option value="">Choose a tenant...</option>
                                            {tenants.map((tenant) => (
                                                <option key={tenant.tenantId} value={tenant.user?.userId}>
                                                    {tenant.user?.name} - {tenant.user?.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Property Selection */}
                                {messageForm.recipientType === 'Property' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Property *
                                        </label>
                                        <select
                                            value={messageForm.propertyId}
                                            onChange={(e) => setMessageForm({ ...messageForm, propertyId: e.target.value })}
                                            className="input"
                                            required
                                        >
                                            <option value="">Choose a property...</option>
                                            {properties.map((property) => (
                                                <option key={property.propertyId} value={property.propertyId}>
                                                    {property.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        value={messageForm.subject}
                                        onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                                        className="input"
                                        placeholder="Enter message subject"
                                        required
                                    />
                                </div>

                                {/* Message Body */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message *
                                    </label>
                                    <textarea
                                        value={messageForm.body}
                                        onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })}
                                        className="input"
                                        rows="6"
                                        placeholder="Type your message here..."
                                        required
                                    />
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        Send Message
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowComposeModal(false)}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MessagesPage;
