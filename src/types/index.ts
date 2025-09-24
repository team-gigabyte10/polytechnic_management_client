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
  employeeId: string;
  departmentId: number;
  courseId: number;
  semester: number;
  admissionYear: number;
  guardianName: string;
  guardianPhone: string;
  phone?: string;
  additionalPhone?: string;
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
  departmentId?: number;
  employeeId: string;
  paymentType: 'hourly' | 'per_class' | 'per_session' | 'monthly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  department?: Department;
  statistics?: GuestTeacherStatistics;
}

export interface GuestTeacherStatistics {
  totalHours: number;
  totalSessions: number;
  totalEarnings: number;
  averageSessionDuration: number;
  lastTeachingDate?: string;
  currentMonthHours: number;
  currentMonthEarnings: number;
}

export interface TeachingSession {
  id: number;
  guestTeacherId: number;
  classId: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  rate: number;
  amount: number;
  status: 'completed' | 'cancelled' | 'pending';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  guestTeacher?: GuestTeacher;
  class?: ClassSchedule;
}

export interface SalaryHistory {
  id: number;
  guestTeacherId: number;
  paymentDate: string;
  amount: number;
  paymentType: 'hourly' | 'per_class' | 'per_session' | 'monthly';
  period: string; // e.g., "2024-01" for monthly, or specific date range
  hours?: number;
  sessions?: number;
  rate?: number;
  status: 'paid' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  guestTeacher?: GuestTeacher;
}

export interface CreateGuestTeacherRequest {
  userData: {
    name: string;
    email: string;
    password: string;
  };
  guestTeacherData: {
    employeeId: string;
    departmentId?: number;
    paymentType: 'hourly' | 'per_class' | 'per_session' | 'monthly';
    rate: number;
    qualification: string;
    phone: string;
    address: string;
  };
}

export interface UpdateGuestTeacherRequest {
  userData?: {
    name?: string;
    email?: string;
    password?: string;
  };
  guestTeacherData?: {
    employeeId?: string;
    departmentId?: number;
    paymentType?: 'hourly' | 'per_class' | 'per_session' | 'monthly';
    rate?: number;
    qualification?: string;
    phone?: string;
    address?: string;
  };
}

export interface GuestTeacherListParams {
  page?: number;
  perPage?: number;
  departmentId?: number;
  paymentType?: string;
  isActive?: boolean;
  search?: string;
}

export interface GuestTeacherListResponse {
  success: boolean;
  data: {
    guestTeachers: GuestTeacher[];
    pagination: PaginationMeta;
  };
}

// Admin create payloads
export interface Department {
  id: number;
  name: string;
  code: string;
  headId?: number;
  createdAt?: string;
  updatedAt?: string;
  head?: {
    id: number;
    employeeId: string;
    name?: string;
    email?: string;
  };
}

export interface Course {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  duration: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
    employeeId?: string; // Optional - will be auto-generated if not provided
    departmentId: number;
    courseId: number;
    semester: number;
    admissionYear: number;
    phone: string;
    additionalPhone?: string;
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
    employeeId?: string;
    departmentId?: number;
    courseId?: number;
    semester?: number;
    admissionYear?: number;
    phone?: string;
    additionalPhone?: string;
    guardianName?: string;
    guardianPhone?: string;
    address?: string;
  };
}

// Schedule/Class related interfaces
export interface Subject {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  department_id?: number; // Snake case from API
  semester: number;
  credits: number;
  theoryHours: number;
  practicalHours: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  department?: Department;
}

export interface CreateSubjectRequest {
  name: string;
  code: string;
  departmentId: number;
  semester: number;
  credits: number;
  theoryHours: number;
  practicalHours: number;
}

export interface UpdateSubjectRequest {
  name?: string;
  code?: string;
  departmentId?: number;
  semester?: number;
  credits?: number;
  theoryHours?: number;
  practicalHours?: number;
}

export interface SubjectListParams {
  page?: number;
  perPage?: number;
  departmentId?: number;
  semester?: number;
  search?: string;
}

export interface SubjectListResponse {
  success: boolean;
  data: {
    subjects: Subject[];
    pagination: PaginationMeta;
  };
}

// Attendance related interfaces
export interface Attendance {
  id: number;
  classId: number;
  studentId: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy?: number;
  markedAt: string;
  student?: {
    id: number;
    rollNumber: string;
    user: {
      name: string;
    };
  };
  markedByUser?: {
    id: number;
    name: string;
  };
}

export interface ClassSchedule {
  id: number;
  subjectId: number;
  teacherId?: number;
  guestTeacherId?: number;
  roomNumber: string;
  scheduleDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  classType: 'theory' | 'practical' | 'lab' | 'tutorial' | 'seminar';
  semester: number;
  academicYear: string; // e.g., "2024-25"
  maxStudents?: number;
  isRecurring?: boolean;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  notes?: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
  teacher?: Teacher;
  guestTeacher?: GuestTeacher;
  creator?: {
    name: string;
    email: string;
  };
  attendances?: Attendance[];
}

export interface CreateClassScheduleRequest {
  subjectId: number;
  teacherId?: number;
  guestTeacherId?: number;
  roomNumber?: string;
  scheduleDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  classType?: 'theory' | 'practical' | 'lab' | 'tutorial';
  semester: number;
  academicYear: string; // e.g., "2024-25"
  maxStudents?: number;
  isRecurring?: boolean;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  notes?: string;
  isActive?: boolean;
}

export interface UpdateClassScheduleRequest {
  subjectId?: number;
  teacherId?: number;
  guestTeacherId?: number;
  roomNumber?: string;
  scheduleDay?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  startTime?: string;
  endTime?: string;
  classType?: 'theory' | 'practical' | 'lab' | 'tutorial';
  semester?: number;
  academicYear?: string;
  maxStudents?: number;
  isRecurring?: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  isActive?: boolean;
}

export interface ClassScheduleListParams {
  page?: number;
  limit?: number;
  department?: number;
  subject?: number;
  teacher?: number;
  guestTeacher?: number;
  day?: string;
  classType?: string;
  roomNumber?: string;
  semester?: number;
  academicYear?: string;
  isActive?: boolean;
  search?: string;
}

export interface ClassScheduleListResponse {
  success: boolean;
  data: {
    classes: ClassSchedule[];
    pagination: PaginationMeta;
  };
}

export interface WeeklyScheduleResponse {
  success: boolean;
  data: {
    monday: ClassSchedule[];
    tuesday: ClassSchedule[];
    wednesday: ClassSchedule[];
    thursday: ClassSchedule[];
    friday: ClassSchedule[];
    saturday: ClassSchedule[];
    sunday: ClassSchedule[];
  };
}

export interface AttendanceMarkRequest {
  classScheduleId: number;
  date: string;
  attendanceList: Array<{
    studentId: number;
    status: 'present' | 'absent' | 'late';
  }>;
}

export interface AttendanceReport {
  studentId: number;
  studentName: string;
  rollNumber: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendancePercentage: number;
  departmentName: string;
  semester: number;
}

export interface AttendanceSummary {
  classId: number;
  className: string;
  subjectName: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  attendancePercentage: number;
}

export interface AttendanceStatistics {
  totalClasses: number;
  totalStudents: number;
  averageAttendance: number;
  recentTrends: Array<{
    date: string;
    attendancePercentage: number;
  }>;
  departmentStats: Array<{
    departmentId: number;
    departmentName: string;
    averageAttendance: number;
  }>;
}

export interface AttendanceRewardFine {
  id: number;
  studentId: number;
  type: 'reward' | 'fine';
  amount: number;
  reason: string;
  month: string;
  attendancePercentage: number;
  isProcessed: boolean;
  student?: {
    id: number;
    rollNumber: string;
    user: {
      name: string;
    };
  };
}

export interface AttendanceCalendar {
  date: string;
  attendancePercentage: number;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
}

export interface AttendanceListParams {
  page?: number;
  perPage?: number;
  classId?: number;
  studentId?: number;
  date?: string;
  status?: 'present' | 'absent' | 'late';
  departmentId?: number;
  semester?: number;
  startDate?: string;
  endDate?: string;
}

export interface AttendanceListResponse {
  success: boolean;
  data: {
    attendance: Attendance[];
    pagination: PaginationMeta;
  };
}

export interface AttendanceReportResponse {
  success: boolean;
  data: {
    reports: AttendanceReport[];
    pagination: PaginationMeta;
  };
}

export interface AttendanceSummaryResponse {
  success: boolean;
  data: {
    summaries: AttendanceSummary[];
    pagination: PaginationMeta;
  };
}

export interface AttendanceStatisticsResponse {
  success: boolean;
  data: AttendanceStatistics;
}

export interface AttendanceRewardFineResponse {
  success: boolean;
  data: {
    rewardsFines: AttendanceRewardFine[];
    pagination: PaginationMeta;
  };
}

export interface AttendanceCalendarResponse {
  success: boolean;
  data: {
    calendar: AttendanceCalendar[];
  };
}