import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Get the request URL from the error
            const requestUrl = error.config?.url || '';
            
            // Don't redirect for auth-related endpoints (login, register, checkAuth)
            // to avoid redirect loops and let the calling code handle the error
            const isAuthEndpoint = requestUrl.includes('/auth/');

            if (!isAuthEndpoint) {
                // Unauthorized - clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Prevent multiple redirects
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// API endpoints
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

export const propertiesAPI = {
    getAll: () => api.get('/properties'),
    getById: (id) => api.get(`/properties/${id}`),
    create: (data) => api.post('/properties', data),
    update: (id, data) => api.put(`/properties/${id}`, data),
    delete: (id) => api.delete(`/properties/${id}`),
};

export const unitsAPI = {
    getAll: (params) => api.get('/units', { params }),
    getById: (id) => api.get(`/units/${id}`),
    create: (data) => api.post('/units', data),
    update: (id, data) => api.put(`/units/${id}`, data),
    delete: (id) => api.delete(`/units/${id}`),
    updateStatus: (id, status) => api.put(`/units/${id}/status`, { status }),
    uploadPhoto: (id, file, isPrimary) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isPrimary', isPrimary);
        return api.post(`/units/${id}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    deletePhoto: (unitId, photoId) => api.delete(`/units/${unitId}/photos/${photoId}`),
};

export const leasesAPI = {
    getAll: (params) => api.get('/leases', { params }),
    getById: (id) => api.get(`/leases/${id}`),
    create: (data) => api.post('/leases', data),
    update: (id, data) => api.put(`/leases/${id}`, data),
    terminate: (id) => api.put(`/leases/${id}/terminate`),
    uploadSignedCopy: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/leases/${id}/signed-copy`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const invoicesAPI = {
    getAll: (params) => api.get('/invoices', { params }),
    getById: (id) => api.get(`/invoices/${id}`),
    create: (data) => api.post('/invoices', data),
    updateStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
    cleanupTerminated: () => api.delete('/invoices/cleanup-terminated'),
};

export const paymentsAPI = {
    getAll: () => api.get('/payments'),
    getById: (id) => api.get(`/payments/${id}`),
    create: (data) => api.post('/payments', data),
    createTenant: (data) => api.post('/payments/tenant', data),
    approve: (id, approved, reasonofReject = null) => api.put(`/payments/${id}/approve`, { approved, reasonofReject }),
    uploadProof: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/payments/${id}/proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const maintenanceAPI = {
    getAll: (params) => api.get('/maintenance', { params }),
    getById: (id) => api.get(`/maintenance/${id}`),
    create: (data) => api.post('/maintenance', data),
    assign: (id, technicianId) => api.put(`/maintenance/${id}/assign`, { technicianId }),
    addUpdate: (id, data) => api.post(`/maintenance/${id}/update`, data),
    uploadPhoto: (id, file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        return api.post(`/maintenance/${id}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
};

export const usersAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    changeRole: (id, roleId) => api.put(`/users/${id}/role`, { roleId }),
    changeStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
    delete: (id) => api.delete(`/users/${id}`),
};

export const rolesAPI = {
    getAll: () => api.get('/roles'),
    getById: (id) => api.get(`/roles/${id}`),
    create: (data) => api.post('/roles', data),
    update: (id, data) => api.put(`/roles/${id}`, data),
    delete: (id) => api.delete(`/roles/${id}`),
};

export const tenantsAPI = {
    getAll: () => api.get('/tenants'),
    getById: (id) => api.get(`/tenants/${id}`),
    create: (data) => api.post('/tenants', data),
    update: (id, data) => api.put(`/tenants/${id}`, data),
    delete: (id) => api.delete(`/tenants/${id}`),
};

export const auditLogsAPI = {
    getAll: (params) => api.get('/auditlogs', { params }),
    getById: (id) => api.get(`/auditlogs/${id}`),
};

export const buildingsAPI = {
    getById: (id) => api.get(`/buildings/${id}`),
    create: (data) => api.post('/buildings', data),
    update: (id, data) => api.put(`/buildings/${id}`, data),
    delete: (id) => api.delete(`/buildings/${id}`),
};

export const expensesAPI = {
    getAll: (params) => api.get('/expenses', { params }),
    getById: (id) => api.get(`/expenses/${id}`),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
};

export const messagesAPI = {
    getAll: () => api.get('/messages'),
    getById: (id) => api.get(`/messages/${id}`),
    create: (data) => api.post('/messages', data),
    markAsRead: (id) => api.put(`/messages/${id}/read`),
    markAllAsRead: () => api.put('/messages/mark-all-read'),
    delete: (id) => api.delete(`/messages/${id}`),
};
