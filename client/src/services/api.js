import axios from "axios";

// Create axios instance
const api = axios.create({
    baseURL: '/api/v1',
    headers:{
        'Content-Type': 'application/json',
    }
});

// Request Interceptor (runs on every request)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config
});

// Response Interceptor (unwraps response and catches 401 globally)
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if(error.response?.status === 401){
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth:unauthorized'));
        }

        const message = 
            error.response?.data?.message
            || error.message
            || 'Request failed';

        return Promise.reject(new Error(message));
    }
);

// Endpoint helpers
export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

export const eventService = {
    getAll: (params) => api.get('/events', {params}),
    create: (eventData) => api.post('/events', eventData),
};

export const insightService = {
    getAll: (params) => api.get('/insights', {params}),
    getById: (id) => api.get(`/insights/${id}`),
};

export default api;