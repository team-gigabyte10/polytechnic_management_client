import axios, { AxiosResponse, AxiosError } from 'axios';
import { CreateTeacherRequest, TeacherListParams, TeacherListResponse, UpdateTeacherRequest, UpdateStudentRequest, CreateClassScheduleRequest, UpdateClassScheduleRequest, ClassScheduleListParams, ClassScheduleListResponse, WeeklyScheduleResponse, CreateGuestTeacherRequest, UpdateGuestTeacherRequest, GuestTeacherListParams, GuestTeacherListResponse, CreateSubjectRequest, UpdateSubjectRequest, SubjectListParams, SubjectListResponse, AttendanceMarkRequest, AttendanceListParams, AttendanceListResponse, AttendanceReportResponse, AttendanceSummaryResponse, AttendanceStatisticsResponse, AttendanceRewardFineResponse, AttendanceCalendarResponse } from '../types';

const API_BASE_URL = '/api';

// Rate limiting and retry configuration
const RATE_LIMIT_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryDelayMultiplier: 2,
  maxConcurrentRequests: 5,
  requestTimeout: 30000, // 30 seconds
};

// Request queue and throttling
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  async add<T>(requestFn: () => Promise<T>, cacheKey?: string, ttl: number = 300000): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++;
          const result = await requestFn();
          
          // Cache successful responses
          if (cacheKey) {
            this.requestCache.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
              ttl
            });
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });
      
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.activeRequests < RATE_LIMIT_CONFIG.maxConcurrentRequests && this.queue.length > 0) {
      const nextRequest = this.queue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  clearCache() {
    this.requestCache.clear();
  }
}

const requestQueue = new RequestQueue();

// Retry mechanism with exponential backoff
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retryCount = 0
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error: any) {
    const isRateLimited = error?.response?.status === 429;
    const isServerError = error?.response?.status >= 500;
    const shouldRetry = (isRateLimited || isServerError) && retryCount < RATE_LIMIT_CONFIG.maxRetries;

    if (shouldRetry) {
      const delay = Math.min(
        RATE_LIMIT_CONFIG.baseDelay * Math.pow(RATE_LIMIT_CONFIG.retryDelayMultiplier, retryCount),
        RATE_LIMIT_CONFIG.maxDelay
      );

      console.warn(`Request failed (attempt ${retryCount + 1}/${RATE_LIMIT_CONFIG.maxRetries + 1}), retrying in ${delay}ms...`, {
        status: error?.response?.status,
        message: error?.response?.data?.message || error.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }

    throw error;
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: RATE_LIMIT_CONFIG.requestTimeout,
});

// Request interceptor to add token and request ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and rate limiting
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message || error.message;

    // Handle rate limiting specifically
    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_CONFIG.baseDelay;
      
      console.error('Rate limit exceeded:', {
        message,
        retryAfter: retryDelay,
        url: error.config?.url,
        method: error.config?.method
      });

      // Create a more informative error
      const rateLimitError = new Error(
        `Too many requests. Please wait ${Math.ceil(retryDelay / 1000)} seconds before trying again.`
      );
      (rateLimitError as any).isRateLimited = true;
      (rateLimitError as any).retryAfter = retryDelay;
      (rateLimitError as any).originalError = error;
      
      return Promise.reject(rateLimitError);
    }

    // Handle other HTTP errors
    if (status && status >= 400) {
      console.error('API Error:', {
        status,
        message,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data
      });
    }

    return Promise.reject(error);
  }
);

// Enhanced API wrapper with retry and queuing
const createApiRequest = <T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  cacheKey?: string,
  ttl?: number
): Promise<AxiosResponse<T>> => {
  return requestQueue.add(
    () => retryRequest(requestFn),
    cacheKey,
    ttl
  );
};

export const authAPI = {
  login: (email: string, password: string) => {
    // Use real API for login - no caching for auth requests
    return createApiRequest(() => api.post('/auth/login', { email, password }));
  },
};

export const dashboardAPI = {
  getDashboardData: () => {
    // Cache dashboard data for 5 minutes
    return createApiRequest(
      () => api.get('/dashboard'),
      'dashboard_data',
      300000 // 5 minutes
    );
  },
};

export const usersAPI = {
  getAll: () => createApiRequest(() => api.get('/users'), 'users_all', 300000), // 5 min cache
  getById: (id: number) => createApiRequest(() => api.get(`/users/${id}`), `user_${id}`, 300000),
  getByRole: (role: 'admin' | 'teacher' | 'student') => 
    createApiRequest(() => api.get(`/users`, { params: { role } }), `users_${role}`, 300000),
};

export const studentAPI = {
  getAll: () => createApiRequest(() => api.get('/students'), 'students_all', 300000), // admin/teacher
  getById: (id: number) => createApiRequest(() => api.get(`/students/${id}`), `student_${id}`, 300000),
  create: (data: any) => {
    // Clear cache after creating
    requestQueue.clearCache();
    return createApiRequest(() => api.post('/students', data)); // admin - matches your API format
  },
  update: (id: number, data: UpdateStudentRequest) => {
    // Clear cache after updating
    requestQueue.clearCache();
    return createApiRequest(() => api.put(`/students/${id}`, data)); // admin/self
  },
  delete: (id: number) => {
    // Clear cache after deleting
    requestQueue.clearCache();
    return createApiRequest(() => api.delete(`/students/${id}`)); // admin
  },
};

export const teacherAPI = {
  // List with optional filters/pagination
  getAll: (params?: TeacherListParams) => {
    const cacheKey = params ? `teachers_${JSON.stringify(params)}` : 'teachers_all';
    return createApiRequest(() => api.get<TeacherListResponse>('/teachers', { params }), cacheKey, 300000);
  },
  // Get by id (auth required)
  getById: (id: number) => createApiRequest(() => api.get(`/teachers/${id}`), `teacher_${id}`, 300000),
  // Create user (role=teacher) + teacher profile (admin)
  create: (data: CreateTeacherRequest) => {
    // Use the exact format specified by the backend
    const payload = {
      userData: {
        name: data.userData.name,
        email: data.userData.email,
        password: data.userData.password,
      },
      teacherData: {
        employeeId: data.teacherData.employeeId,
        departmentId: data.teacherData.departmentId,
        designation: data.teacherData.designation,
        qualification: data.teacherData.qualification,
        experienceYears: data.teacherData.experienceYears,
        salary: data.teacherData.salary,
        joiningDate: data.teacherData.joiningDate,
        phone: data.teacherData.phone,
        address: data.teacherData.address,
      },
    };
    // Clear cache after creating
    requestQueue.clearCache();
    return createApiRequest(() => api.post('/teachers', payload));
  },
  // Update user and/or teacher fields (admin)
  update: (id: number, data: UpdateTeacherRequest) => {
    console.log('Teacher API Update - ID:', id, 'Data:', data);
    // Use the exact format specified by the backend
    const payload = {
      userData: data.userData ? {
        ...(data.userData.name && { name: data.userData.name }),
        ...(data.userData.email && { email: data.userData.email }),
        ...(data.userData.password && { password: data.userData.password }),
      } : undefined,
      teacherData: data.teacherData ? {
        ...(data.teacherData.employeeId && { employeeId: data.teacherData.employeeId }),
        ...(data.teacherData.departmentId && { departmentId: data.teacherData.departmentId }),
        ...(data.teacherData.designation && { designation: data.teacherData.designation }),
        ...(data.teacherData.qualification && { qualification: data.teacherData.qualification }),
        ...(data.teacherData.experienceYears && { experienceYears: data.teacherData.experienceYears }),
        ...(data.teacherData.salary && { salary: data.teacherData.salary }),
        ...(data.teacherData.joiningDate && { joiningDate: data.teacherData.joiningDate }),
        ...(data.teacherData.phone && { phone: data.teacherData.phone }),
        ...(data.teacherData.address && { address: data.teacherData.address }),
      } : undefined,
    };
    
    // Remove undefined properties
    if (!payload.userData || Object.keys(payload.userData).length === 0) {
      delete payload.userData;
    }
    if (!payload.teacherData || Object.keys(payload.teacherData).length === 0) {
      delete payload.teacherData;
    }
    
    console.log('Teacher API Update - Final payload:', payload);
    console.log('Teacher API Update - URL:', `/teachers/${id}`);
    // Clear cache after updating
    requestQueue.clearCache();
    return createApiRequest(() => api.put(`/teachers/${id}`, payload));
  },
  // Delete teacher and linked user (admin)
  delete: (id: number) => {
    console.log('Teacher API Delete - ID:', id);
    console.log('Teacher API Delete - URL:', `/teachers/${id}`);
    // Clear cache after deleting
    requestQueue.clearCache();
    return createApiRequest(() => api.delete(`/teachers/${id}`));
  },
};

export const guestTeacherAPI = {
  // Get all guest teachers with filtering and pagination
  getAll: (params?: GuestTeacherListParams) => {
    const cacheKey = params ? `guest_teachers_${JSON.stringify(params)}` : 'guest_teachers_all';
    return createApiRequest(
      () => api.get<GuestTeacherListResponse>('/guest-teachers', { params }),
      cacheKey,
      300000
    );
  },
  // Get specific guest teacher by ID
  getById: (id: number) => createApiRequest(() => api.get(`/guest-teachers/${id}`), `guest_teacher_${id}`, 300000),
  // Create new guest teacher
  create: (data: CreateGuestTeacherRequest) => {
    const payload = {
      userData: {
        name: data.userData.name,
        email: data.userData.email,
        password: data.userData.password,
      },
      guestTeacherData: {
        employeeId: data.guestTeacherData.employeeId,
        departmentId: data.guestTeacherData.departmentId,
        paymentType: data.guestTeacherData.paymentType,
        rate: data.guestTeacherData.rate,
        qualification: data.guestTeacherData.qualification,
        phone: data.guestTeacherData.phone,
        address: data.guestTeacherData.address,
      },
    };
    // Clear cache after creating
    requestQueue.clearCache();
    return createApiRequest(() => api.post('/guest-teachers', payload));
  },
  // Update guest teacher
  update: (id: number, data: UpdateGuestTeacherRequest) => {
    const payload = {
      userData: data.userData ? {
        ...(data.userData.name && { name: data.userData.name }),
        ...(data.userData.email && { email: data.userData.email }),
        ...(data.userData.password && { password: data.userData.password }),
      } : undefined,
      guestTeacherData: data.guestTeacherData ? {
        ...(data.guestTeacherData.employeeId && { employeeId: data.guestTeacherData.employeeId }),
        ...(data.guestTeacherData.departmentId && { departmentId: data.guestTeacherData.departmentId }),
        ...(data.guestTeacherData.paymentType && { paymentType: data.guestTeacherData.paymentType }),
        ...(data.guestTeacherData.rate && { rate: data.guestTeacherData.rate }),
        ...(data.guestTeacherData.qualification && { qualification: data.guestTeacherData.qualification }),
        ...(data.guestTeacherData.phone && { phone: data.guestTeacherData.phone }),
        ...(data.guestTeacherData.address && { address: data.guestTeacherData.address }),
      } : undefined,
    };
    
    // Remove undefined properties
    if (!payload.userData || Object.keys(payload.userData).length === 0) {
      delete payload.userData;
    }
    if (!payload.guestTeacherData || Object.keys(payload.guestTeacherData).length === 0) {
      delete payload.guestTeacherData;
    }
    
    // Clear cache after updating
    requestQueue.clearCache();
    return createApiRequest(() => api.put(`/guest-teachers/${id}`, payload));
  },
  // Delete guest teacher
  delete: (id: number) => {
    // Clear cache after deleting
    requestQueue.clearCache();
    return createApiRequest(() => api.delete(`/guest-teachers/${id}`));
  },
  // Get guest teacher's classes
  getClasses: (id: number) => createApiRequest(() => api.get(`/guest-teachers/${id}/classes`), `guest_teacher_classes_${id}`, 300000),
  // Get salary history
  getSalaryHistory: (id: number, params?: { page?: number; perPage?: number; period?: string }) => {
    const cacheKey = `guest_teacher_salary_${id}_${JSON.stringify(params || {})}`;
    return createApiRequest(() => api.get(`/guest-teachers/${id}/salary-history`, { params }), cacheKey, 300000);
  },
  // Get teaching sessions
  getTeachingSessions: (id: number, params?: { page?: number; perPage?: number; startDate?: string; endDate?: string }) => {
    const cacheKey = `guest_teacher_sessions_${id}_${JSON.stringify(params || {})}`;
    return createApiRequest(() => api.get(`/guest-teachers/${id}/teaching-sessions`, { params }), cacheKey, 300000);
  },
  // Update statistics
  updateStats: (id: number) => {
    // Clear cache after updating stats
    requestQueue.clearCache();
    return createApiRequest(() => api.put(`/guest-teachers/${id}/update-stats`));
  },
};

export const departmentAPI = {
  getAll: () => {
    return createApiRequest(
      async () => {
        console.log('Making request to /departments');
        try {
          // First try with authentication
          const response = await api.get('/departments');
          console.log('Departments API success with auth:', response);
          return response;
        } catch (error: any) {
          console.log('Departments API failed with auth:', error?.response?.status);
          // If it's a 401/403, try without auth (in case it's public)
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            console.log('Trying departments API without auth...');
            try {
              const response = await axios.get('/api/departments');
              console.log('Departments API success without auth:', response);
              return response;
            } catch (noAuthError) {
              console.log('Departments API failed without auth too:', noAuthError);
              throw error; // Throw the original error
            }
          }
          throw error;
        }
      },
      'departments_all',
      300000 // 5 minutes cache
    );
  },
  getById: (id: number) => createApiRequest(() => api.get(`/departments/${id}`), `department_${id}`, 300000),
  create: (data: { name: string; code: string; headId?: number }) => {
    // Clear cache after creating
    requestQueue.clearCache();
    return createApiRequest(() => api.post('/departments', data));
  },
  update: (id: number, data: { name?: string; code?: string; headId?: number }) => {
    // Clear cache after updating
    requestQueue.clearCache();
    return createApiRequest(() => api.put(`/departments/${id}`, data));
  },
  delete: (id: number) => {
    // Clear cache after deleting
    requestQueue.clearCache();
    return createApiRequest(() => api.delete(`/departments/${id}`));
  },
};

export const subjectAPI = {
  // Get all subjects with filtering and pagination
  getAll: (params?: SubjectListParams) => {
    const cacheKey = params ? `subjects_${JSON.stringify(params)}` : 'subjects_all';
    return createApiRequest(() => api.get<SubjectListResponse>('/subjects', { params }), cacheKey, 300000);
  },
  // Get specific subject by ID
  getById: (id: number) => createApiRequest(() => api.get(`/subjects/${id}`), `subject_${id}`, 300000),
  // Get subjects by department
  getByDepartment: (departmentId: number) => 
    createApiRequest(() => api.get(`/subjects/department/${departmentId}`), `subjects_dept_${departmentId}`, 300000),
  // Create new subject
  create: (data: CreateSubjectRequest) => {
    // Send camelCase as backend validator expects departmentId
    const payload = {
      name: data.name,
      code: data.code,
      departmentId: data.departmentId,
      semester: data.semester,
      credits: data.credits,
      theoryHours: data.theoryHours,
      practicalHours: data.practicalHours,
    };
    // Clear cache after creating
    requestQueue.clearCache();
    return createApiRequest(() => api.post('/subjects', payload));
  },
  // Update subject
  update: (id: number, data: UpdateSubjectRequest) => {
    // Send only provided fields in camelCase
    const payload: any = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      ...(data.semester !== undefined ? { semester: data.semester } : {}),
      ...(data.credits !== undefined ? { credits: data.credits } : {}),
      ...(data.theoryHours !== undefined ? { theoryHours: data.theoryHours } : {}),
      ...(data.practicalHours !== undefined ? { practicalHours: data.practicalHours } : {}),
    };
    // Clear cache after updating
    requestQueue.clearCache();
    return createApiRequest(() => api.put(`/subjects/${id}`, payload));
  },
  // Delete subject
  delete: (id: number) => {
    // Clear cache after deleting
    requestQueue.clearCache();
    return createApiRequest(() => api.delete(`/subjects/${id}`));
  },
};

export const classScheduleAPI = {
  // Get all schedules with filtering
  getAll: (params?: ClassScheduleListParams) => {
    const cacheKey = params ? `class_schedules_${JSON.stringify(params)}` : 'class_schedules_all';
    return createApiRequest(() => api.get<ClassScheduleListResponse>('/class-schedules', { params }), cacheKey, 300000);
  },
  // Get weekly view
  getWeeklySchedule: (params?: { department?: number; course?: number; academicYear?: string; semester?: number }) => {
    const cacheKey = `weekly_schedule_${JSON.stringify(params || {})}`;
    return createApiRequest(() => api.get<WeeklyScheduleResponse>('/class-schedules/weekly-schedule', { params }), cacheKey, 300000);
  },
  // Get by academic period
  getByAcademicPeriod: (year: string, semester: number) => 
    createApiRequest(() => api.get(`/class-schedules/academic-period/${year}/${semester}`), `schedules_${year}_${semester}`, 300000),
  // Get specific schedule by ID
  getById: (id: number) => createApiRequest(() => api.get(`/class-schedules/${id}`), `schedule_${id}`, 300000),
  // Create new schedule
  create: (data: CreateClassScheduleRequest) => {
    // Clear cache after creating
    requestQueue.clearCache();
    return createApiRequest(() => api.post('/class-schedules', data));
  },
  // Update schedule
  update: (id: number, data: UpdateClassScheduleRequest) => {
    // Clear cache after updating
    requestQueue.clearCache();
    return createApiRequest(() => api.put(`/class-schedules/${id}`, data));
  },
  // Delete schedule
  delete: (id: number) => {
    // Clear cache after deleting
    requestQueue.clearCache();
    return createApiRequest(() => api.delete(`/class-schedules/${id}`));
  },
  // Get schedules by teacher
  getByTeacher: (id: number) => createApiRequest(() => api.get(`/class-schedules/teacher/${id}`), `schedules_teacher_${id}`, 300000),
  // Get schedules by guest teacher
  getByGuestTeacher: (id: number) => createApiRequest(() => api.get(`/class-schedules/guest-teacher/${id}`), `schedules_guest_teacher_${id}`, 300000),
  // Get schedules by subject
  getBySubject: (id: number) => createApiRequest(() => api.get(`/class-schedules/subject/${id}`), `schedules_subject_${id}`, 300000),
  // Get schedules by room
  getByRoom: (roomNumber: string) => createApiRequest(() => api.get(`/class-schedules/room/${encodeURIComponent(roomNumber)}`), `schedules_room_${roomNumber}`, 300000),
  // Test endpoint
  test: () => createApiRequest(() => api.get('/class-schedules/test')),
};

export const attendanceAPI = {
  // Core Attendance Operations
  markAttendance: (data: AttendanceMarkRequest) => {
    // Clear cache after marking attendance
    requestQueue.clearCache();
    return createApiRequest(() => api.post('/attendance/mark', data));
  },
  getClassAttendance: (classScheduleId: number, date: string) => 
    createApiRequest(() => api.get(`/attendance/class/${classScheduleId}`, { params: { date } }), `attendance_class_${classScheduleId}_${date}`, 60000), // 1 minute cache
  getStudentReport: (studentId: number, params?: { startDate?: string; endDate?: string; page?: number; perPage?: number }) => {
    const cacheKey = `student_report_${studentId}_${JSON.stringify(params || {})}`;
    return createApiRequest(() => api.get<AttendanceReportResponse>(`/attendance/student/${studentId}/report`, { params }), cacheKey, 300000);
  },
  getClassSummary: (classId: number, params?: { startDate?: string; endDate?: string; page?: number; perPage?: number }) => {
    const cacheKey = `class_summary_${classId}_${JSON.stringify(params || {})}`;
    return createApiRequest(() => api.get<AttendanceSummaryResponse>(`/attendance/class/${classId}/summary`, { params }), cacheKey, 300000);
  },
  
  // Advanced Operations
  getRewardsFines: (params?: { page?: number; perPage?: number; type?: 'reward' | 'fine'; isProcessed?: boolean }) => {
    const cacheKey = `rewards_fines_${JSON.stringify(params || {})}`;
    return createApiRequest(() => api.get<AttendanceRewardFineResponse>('/attendance/rewards-fines', { params }), cacheKey, 300000);
  },
  getStatistics: () => createApiRequest(() => api.get<AttendanceStatisticsResponse>('/attendance/statistics'), 'attendance_statistics', 300000),
  updateAttendance: (attendanceId: number, data: { status: 'present' | 'absent' | 'late' }) => {
    // Clear cache after updating attendance
    requestQueue.clearCache();
    return createApiRequest(() => api.put(`/attendance/${attendanceId}`, data));
  },
  deleteAttendance: (attendanceId: number) => {
    // Clear cache after deleting attendance
    requestQueue.clearCache();
    return createApiRequest(() => api.delete(`/attendance/${attendanceId}`));
  },
  getClassCalendar: (classId: number, params?: { month?: string; year?: number }) => {
    const cacheKey = `class_calendar_${classId}_${JSON.stringify(params || {})}`;
    return createApiRequest(() => api.get<AttendanceCalendarResponse>(`/attendance/class/${classId}/calendar`, { params }), cacheKey, 300000);
  },
  bulkUpdateAttendance: (data: Array<{ id: number; status: 'present' | 'absent' | 'late' }>) => {
    // Clear cache after bulk update
    requestQueue.clearCache();
    return createApiRequest(() => api.put('/attendance/bulk-update', { attendanceList: data }));
  },
  
  // General attendance listing
  getAll: (params?: AttendanceListParams) => {
    const cacheKey = `attendance_all_${JSON.stringify(params || {})}`;
    return createApiRequest(() => api.get<AttendanceListResponse>('/attendance', { params }), cacheKey, 300000);
  },
};

// Export utilities for cache management
export const clearApiCache = () => {
  requestQueue.clearCache();
};

// Export the request queue for advanced usage
export { requestQueue };

export default api;
