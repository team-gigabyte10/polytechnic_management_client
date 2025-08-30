export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  isActive: boolean;
  created_at: string;
  updated_at: string;
  studentProfile?: any;
  teacherProfile?: any;
  guestTeacherProfile?: any;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface DashboardData {
  success: boolean;
  data: {
    counts: {
      students: number;
      teachers: number;
      guestTeachers: number;
      departments: number;
      courses: number;
    };
    financials: {
      salaries: {
        total: number;
        paid: number;
        pending: number;
      };
      expenses: number;
      studentPayments: number;
    };
    attendance: {
      total: number;
      present: number;
      absent: number;
      late: number;
    };
    filters: Record<string, any>;
  };
}

export interface Student {
  id: number;
  name: string;
  email: string;
  rollNumber: string;
  departmentId: number;
  courseId: number;
  semester: number;
  admissionYear: number;
  guardianName: string;
  guardianPhone: string;
  address: string;
  isActive: boolean;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  department?: string;
  specialization?: string;
  phoneNumber?: string;
  salary?: number;
  joiningDate?: string;
  isActive: boolean;
}

export interface GuestTeacher {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  ratePerHour: number;
  subjects: string[];
  classes: string[];
  isActive: boolean;
}

// Admin create payloads
export interface CreateTeacherRequest {
  userData: {
    name: string;
    email: string;
    password: string;
    role?: 'teacher';
  };
  teacherData: {
    employeeId: string;
    departmentId: number;
    designation: string;
    qualification: string;
    experienceYears: number;
    salary: number;
    joiningDate: string; // YYYY-MM-DD
    phone: string;
    address: string;
  };
}

export interface CreateStudentRequest {
  userData: {
    name: string;
    email: string;
    password: string;
  };
  studentData: {
    rollNumber: string;
    departmentId: number;
    courseId: number;
    semester: number;
    admissionYear: number;
    guardianName: string;
    guardianPhone: string;
    address: string;
  };
}

// Teacher listing/filter/pagination
export interface PaginationMeta {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

export interface TeacherListParams {
  page?: number;
  perPage?: number;
  departmentId?: number;
  search?: string;
}

export interface TeacherListResponse {
  success: boolean;
  data: {
    teachers: any[];
    pagination: PaginationMeta;
  };
}

export interface UpdateTeacherRequest {
  userData?: {
    name?: string;
    email?: string;
    password?: string;
  };
  teacherData?: {
    employeeId?: string;
    departmentId?: number;
    designation?: string;
    qualification?: string;
    experienceYears?: number;
    salary?: number;
    joiningDate?: string;
    phone?: string;
    address?: string;
  };
}

export interface UpdateStudentRequest {
  userData?: {
    name?: string;
    email?: string;
    password?: string;
  };
  studentData?: {
    rollNumber?: string;
    departmentId?: number;
    courseId?: number;
    semester?: number;
    admissionYear?: number;
    guardianName?: string;
    guardianPhone?: string;
    address?: string;
  };
}