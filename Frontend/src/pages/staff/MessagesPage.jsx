import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import SearchBar from '../../components/SearchBar';
import axios from 'axios';
import { FaEnvelope, FaPaperPlane, FaInfoCircle } from 'react-icons/fa';

function MessagesPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [messageDetails, setMessageDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
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
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Fetch additional data to enrich message display
            const tenantsResponse = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/tenants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const tenantsMap = {};
            tenantsResponse.data.forEach(t => {
                if (t.user) {
                    tenantsMap[t.user.userId] = t.user.name;
                }
            });
            
            // Enrich messages with tenant names
            const enrichedMessages = response.data.map(msg => ({
                ...msg,
                recipientName: tenantsMap[msg.recipientId] || null
            }));
            
            setMessages(enrichedMessages);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/tenants', {
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
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const fetchBuildings = async (propertyId) => {
        if (!propertyId) {
            setBuildings([]);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/properties/${propertyId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBuildings(response.data.buildings || []);
        } catch (error) {
            console.error('Error fetching buildings:', error);
        }
    };

    const fetchMessageDetails = async (messageId) => {
        try {
            setLoadingDetails(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/messages/${messageId}/details`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessageDetails(response.data);
            setShowDetailsModal(true);
        } catch (error) {
            alert('Error fetching message details: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        // Trim and validate Subject
        const trimmedSubject = messageForm.subject.trim();
        if (!trimmedSubject) {
            alert('Subject cannot be empty or contain only spaces');
            return;
        }

        // Trim and validate Message Body
        const trimmedBody = messageForm.body.trim();
        if (!trimmedBody) {
            alert('Message cannot be empty or contain only spaces');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const payload = {
                title: trimmedSubject,
                body: trimmedBody,
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
            await axios.post('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/messages', payload, {
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

    // Filter messages based on search
    const filteredMessages = messages.filter(msg =>
        msg.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.recipientType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.recipientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMessages = filteredMessages.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
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
                    
                    <div className="mb-4">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search by subject, message, type, or recipient..."
                        />
                        <p className="text-sm text-gray-600 mt-2">
                            Showing {currentMessages.length} of {filteredMessages.length} messages (Page {currentPage} of {totalPages})
                        </p>
                    </div>

                    {loading ? (
                        <p>Loading messages...</p>
                    ) : currentMessages.length > 0 ? (
                        <div className="space-y-3">
                            {(() => {
                                // Group messages by title and approximate sent time to avoid showing duplicates for broadcasts
                                const grouped = {};
                                currentMessages.forEach(msg => {
                                    // Create a key using title and rounded timestamp (to 1 minute)
                                    const timeKey = new Date(msg.sentAt).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
                                    const key = `${msg.title}_${timeKey}`;
                                    if (!grouped[key]) {
                                        grouped[key] = { ...msg, recipients: [] };
                                    }
                                    // Track individual recipients for display purposes
                                    if (msg.recipientId) {
                                        grouped[key].recipients.push(msg.recipientId);
                                    }
                                });
                                
                                return Object.values(grouped).map((message) => (
                                    <div key={`${message.messageId}_${message.sentAt}`} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                                        {message.recipientType}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Sent: {new Date(message.sentAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-gray-800 mb-2">
                                                    Subject: {message.title}
                                                </h4>
                                            </div>
                                            <button
                                                onClick={() => fetchMessageDetails(message.messageId)}
                                                className="btn btn-sm btn-primary flex items-center gap-1"
                                                disabled={loadingDetails}
                                            >
                                                <FaInfoCircle /> View Details
                                            </button>
                                        </div>
                                        
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="font-medium">Description:</span>
                                            </p>
                                            <p className="text-gray-700 pl-2">{message.body}</p>
                                        </div>

                                        <div className="text-sm text-gray-600 border-t pt-2">
                                            <span className="font-medium">To: </span>
                                            {(() => {
                                                const count = message.recipients.length;
                                                // For individual messages, show the recipient name
                                                if (count === 1 && message.recipientName) {
                                                    return <span>Individual Tenant - {message.recipientName}</span>;
                                                }
                                                // For broadcast/multiple recipients
                                                if (count > 1) {
                                                    return <span>Multiple Recipients ({count} tenant{count !== 1 ? 's' : ''})</span>;
                                                }
                                                // Fallback
                                                return <span>{message.recipientType}</span>;
                                            })()}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    ) : (
                        <p className="text-gray-500">No messages sent yet</p>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-6">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                            >
                                First
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                            >
                                Previous
                            </button>
                            <span className="text-sm">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                            >
                                Next
                            </button>
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                            >
                                Last
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Details Modal */}
            {showDetailsModal && messageDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <FaInfoCircle /> Message Details
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setMessageDetails(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Message Info */}
                                <div className="border-b pb-4">
                                    <div className="mb-2">
                                        <span className="font-semibold">Type:</span>
                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                                            {messageDetails.recipientType}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Subject:</span>
                                        <span className="ml-2">{messageDetails.title}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Sent By:</span>
                                        <span className="ml-2">{messageDetails.senderName}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-semibold">Sent At:</span>
                                        <span className="ml-2">{new Date(messageDetails.sentAt).toLocaleString()}</span>
                                    </div>
                                    {messageDetails.propertyName && (
                                        <div className="mb-2">
                                            <span className="font-semibold">Property:</span>
                                            <span className="ml-2">{messageDetails.propertyName}</span>
                                        </div>
                                    )}
                                    {messageDetails.buildingName && (
                                        <div className="mb-2">
                                            <span className="font-semibold">Building:</span>
                                            <span className="ml-2">{messageDetails.buildingName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Message Body */}
                                <div className="border-b pb-4">
                                    <h4 className="font-semibold mb-2">Message:</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{messageDetails.body}</p>
                                </div>

                                {/* Recipients List */}
                                <div>
                                    <h4 className="font-semibold mb-3">Recipients ({messageDetails.recipients.length}):</h4>
                                    <div className="max-h-60 overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Tenant Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Email
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Unit
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {messageDetails.recipients.map((recipient, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-sm">{recipient.tenantName}</td>
                                                        <td className="px-4 py-2 text-sm">{recipient.tenantEmail}</td>
                                                        <td className="px-4 py-2 text-sm">{recipient.unitNumber}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setMessageDetails(null);
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Compose Message Modal */}
            {showComposeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold">Compose Message</h3>
                                <button
                                    onClick={() => {
                                        setShowComposeModal(false);
                                        setMessageForm({
                                            recipientType: 'Individual',
                                            recipientId: '',
                                            propertyId: '',
                                            buildingId: '',
                                            subject: '',
                                            body: ''
                                        });
                                    }}
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

                                {/* Building Selection */}
                                {messageForm.recipientType === 'Building' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Select Property *
                                            </label>
                                            <select
                                                value={messageForm.propertyId}
                                                onChange={(e) => {
                                                    const propId = e.target.value;
                                                    setMessageForm({ ...messageForm, propertyId: propId, buildingId: '' });
                                                    fetchBuildings(propId);
                                                }}
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Select Building *
                                            </label>
                                            <select
                                                value={messageForm.buildingId}
                                                onChange={(e) => setMessageForm({ ...messageForm, buildingId: e.target.value })}
                                                className="input"
                                                required
                                                disabled={!messageForm.propertyId}
                                            >
                                                <option value="">Choose a building...</option>
                                                {buildings.map((building) => (
                                                    <option key={building.buildingId} value={building.buildingId}>
                                                        {building.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {!messageForm.propertyId && (
                                                <p className="text-xs text-gray-500 mt-1">Please select a property first</p>
                                            )}
                                        </div>
                                    </>
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
                                        onClick={() => {
                                            setShowComposeModal(false);
                                            setMessageForm({
                                                recipientType: 'Individual',
                                                recipientId: '',
                                                propertyId: '',
                                                buildingId: '',
                                                subject: '',
                                                body: ''
                                            });
                                        }}
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
