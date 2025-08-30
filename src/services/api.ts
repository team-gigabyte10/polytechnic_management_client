import axios from 'axios';
import { CreateTeacherRequest, CreateStudentRequest, TeacherListParams, TeacherListResponse, UpdateTeacherRequest, UpdateStudentRequest } from '../types';
import { mockAuthAPI, mockDashboardAPI } from './mockApi';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

export const authAPI = {
  login: (email: string, password: string) => {
    // Use mock API for testing
    console.log('Using mock API for login');
    return mockAuthAPI.login(email, password);
  },
};

export const dashboardAPI = {
  getDashboardData: () => {
    // Use mock API for testing
    console.log('Using mock API for dashboard data');
    return mockDashboardAPI.getDashboardData();
  },
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  getByRole: (role: 'admin' | 'teacher' | 'student') => api.get(`/users`, { params: { role } }),
};

export const studentAPI = {
  getAll: () => api.get('/students'), // admin/teacher
  getById: (id: number) => api.get(`/students/${id}`),
  create: (studentData: any) => api.post('/students', { studentData }), // admin - matches your API format
  update: (id: number, data: UpdateStudentRequest) => api.put(`/students/${id}`, data), // admin/self
  delete: (id: number) => api.delete(`/students/${id}`), // admin
};

export const teacherAPI = {
  // List with optional filters/pagination
  getAll: (params?: TeacherListParams) => api.get<TeacherListResponse>('/teachers', { params }), // admin/teacher
  // Get by id (auth required)
  getById: (id: number) => api.get(`/teachers/${id}`),
  // Create user (role=teacher) + teacher profile (admin)
  create: (data: CreateTeacherRequest) => api.post('/teachers', data),
  // Update user and/or teacher fields (admin)
  update: (id: number, data: UpdateTeacherRequest) => api.put(`/teachers/${id}`, data),
  // Delete teacher and linked user (admin)
  delete: (id: number) => api.delete(`/teachers/${id}`),
};

export const guestTeacherAPI = {
  getAll: () => api.get('/guest-teachers'),
  getById: (id: number) => api.get(`/guest-teachers/${id}`),
  create: (data: any) => api.post('/guest-teachers', data),
  update: (id: number, data: any) => api.put(`/guest-teachers/${id}`, data),
  delete: (id: number) => api.delete(`/guest-teachers/${id}`),
};

export default api;