import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token
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

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// WebSocket singleton
let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(WS_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Auth API
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data)
};

// Projection API
export const projectionAPI = {
    generate: (params) => api.post('/projections/generate', params),
    monteCarlo: (params) => api.post('/projections/monte-carlo', params),
    getScenarios: () => api.get('/projections/scenarios'),
    getHistory: () => api.get('/projections/history'),
    getAssumptions: () => api.get('/projections/assumptions'),
    
    // New feature endpoints
    goalPlanning: (params) => api.post('/projections/goal-planning', params),
    familyProtection: (params) => api.post('/projections/family-protection', params),
    salarySimulation: (params) => api.post('/projections/salary-simulation', params),
    pensionSimulator: (params) => api.post('/projections/pension-simulator', params),
    timeline: (params) => api.post('/projections/timeline', params),
    gapDetector: (params) => api.post('/projections/gap-detector', params),
    realityShock: (params) => api.post('/projections/reality-shock', params)
};

// AI Coach API
export const aiCoachAPI = {
    chat: (message, sessionId) => api.post('/ai-coach/chat', { message, sessionId }),
    getInsights: () => api.get('/ai-coach/insights'),
    getChatHistory: (sessionId = 'default') => api.get(`/ai-coach/history/${sessionId}`)
};

export default api;
