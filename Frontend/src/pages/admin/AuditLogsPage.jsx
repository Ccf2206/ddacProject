import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import DataTable from '../../components/DataTable';
import SearchBar from '../../components/SearchBar';
import { auditLogsAPI, usersAPI } from '../../services/api';

function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        userId: '',
        actionType: '',
        tableName: '',
        startDate: '',
        endDate: '',
        page: 1,
        pageSize: 20
    });
    const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 0 });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await auditLogsAPI.getAll(filters);
            setLogs(response.data.data);
            setPagination({
                total: response.data.total,
                page: response.data.page,
                pageSize: response.data.pageSize,
                totalPages: response.data.totalPages
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'Timestamp',
            accessor: 'timestamp',
            render: (row) => (
                <div>
                    <div className="text-sm">{new Date(row.timestamp).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{new Date(row.timestamp).toLocaleTimeString()}</div>
                </div>
            )
        },
        { header: 'User', accessor: 'userName' },
        {
            header: 'Action',
            accessor: 'actionType',
            render: (row) => {
                const colors = {
                    CREATE: 'bg-green-100 text-green-800',
                    UPDATE: 'bg-blue-100 text-blue-800',
                    DELETE: 'bg-red-100 text-red-800'
                };
                return <span className={`text-xs px-2 py-1 rounded ${colors[row.actionType] || 'bg-gray-100'}`}>{row.actionType}</span>;
            }
        },
        { header: 'Table', accessor: 'tableName' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Audit Logs</h2>

                {/* Filters */}
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-4">Search & Filters</h3>
                    
                    <div className="mb-4">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search by user, action, table, or record ID..."
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                            <select
                                value={filters.userId}
                                onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
                                className="input"
                            >
                                <option value="">All Users</option>
                                {users.map((user) => (
                                    <option key={user.userId} value={user.userId}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                            <select
                                value={filters.actionType}
                                onChange={(e) => setFilters({ ...filters, actionType: e.target.value, page: 1 })}
                                className="input"
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                            <input
                                type="text"
                                value={filters.tableName}
                                onChange={(e) => setFilters({ ...filters, tableName: e.target.value, page: 1 })}
                                placeholder="e.g. Users"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                                className="input"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setFilters({ userId: '', actionType: '', tableName: '', startDate: '', endDate: '', page: 1, pageSize: 20 })}
                        className="mt-4 text-sm text-primary-600 hover:text-primary-800"
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Results */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-600">
                            Showing {logs.filter(log =>
                                log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                log.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                log.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                log.recordId?.toString().includes(searchTerm)
                            ).length} of {logs.length} logs (Total in database: {pagination.total})
                        </p>
                    </div>

                    {loading ? (
                        <p>Loading audit logs...</p>
                    ) : (
                        <>
                            <DataTable 
                                columns={columns} 
                                data={logs.filter(log =>
                                    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    log.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    log.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    log.recordId?.toString().includes(searchTerm)
                                )} 
                            />

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center items-center space-x-2 mt-6">
                                    <button
                                        onClick={() => setFilters({ ...filters, page: 1 })}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                                    <button
                                        onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                    <button
                                        onClick={() => setFilters({ ...filters, page: pagination.totalPages })}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        Last
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuditLogsPage;
