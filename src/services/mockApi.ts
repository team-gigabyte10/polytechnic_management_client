import { AuthResponse, AttendanceMarkRequest, Attendance, AttendanceReport, AttendanceStatistics, AttendanceRewardFine, ClassSchedule, Student, Department, Subject } from '../types';

// Mock data storage
let mockAttendanceData: Attendance[] = [];
let mockStudents: Student[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@student.com',
    rollNumber: 'STU001',
    employeeId: 'EMP001',
    departmentId: 1,
    courseId: 1,
    semester: 3,
    admissionYear: 2022,
    guardianName: 'Jane Doe',
    guardianPhone: '9876543210',
    phone: '9876543210',
    address: '123 Main St, City',
    isActive: true,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@student.com',
    rollNumber: 'STU002',
    employeeId: 'EMP002',
    departmentId: 1,
    courseId: 1,
    semester: 3,
    admissionYear: 2022,
    guardianName: 'Bob Smith',
    guardianPhone: '9876543211',
    phone: '9876543211',
    address: '456 Oak Ave, City',
    isActive: true,
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@student.com',
    rollNumber: 'STU003',
    employeeId: 'EMP003',
    departmentId: 2,
    courseId: 2,
    semester: 2,
    admissionYear: 2023,
    guardianName: 'Sarah Johnson',
    guardianPhone: '9876543212',
    phone: '9876543212',
    address: '789 Pine St, City',
    isActive: true,
  },
];

let mockDepartments: Department[] = [
  { id: 1, name: 'Computer Science', code: 'CS' },
  { id: 2, name: 'Electronics', code: 'ECE' },
  { id: 3, name: 'Mechanical', code: 'ME' },
];

let mockSubjects: Subject[] = [
  { id: 1, name: 'Data Structures', code: 'CS301', departmentId: 1, semester: 3, credits: 4, theoryHours: 3, practicalHours: 2 },
  { id: 2, name: 'Database Systems', code: 'CS302', departmentId: 1, semester: 3, credits: 4, theoryHours: 3, practicalHours: 2 },
  { id: 3, name: 'Digital Electronics', code: 'ECE201', departmentId: 2, semester: 2, credits: 3, theoryHours: 2, practicalHours: 1 },
];

let mockClassSchedules: ClassSchedule[] = [
  {
    id: 1,
    subjectId: 1,
    teacherId: 1,
    roomNumber: 'A101',
    scheduleDay: 'monday',
    startTime: '09:00',
    endTime: '10:30',
    classType: 'theory',
    semester: 3,
    academicYear: '2024-25',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subject: mockSubjects[0],
  },
  {
    id: 2,
    subjectId: 2,
    teacherId: 2,
    roomNumber: 'A102',
    scheduleDay: 'tuesday',
    startTime: '10:30',
    endTime: '12:00',
    classType: 'theory',
    semester: 3,
    academicYear: '2024-25',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subject: mockSubjects[1],
  },
];

// Mock API for testing
export const mockAuthAPI = {
  login: (email: string, password: string): Promise<{ data: AuthResponse }> => {
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(() => {
        // Check credentials (you can modify these)
        if (email === 'admin@polytechnic.com' && password === 'Admin123') {
          const mockResponse: AuthResponse = {
            success: true,
            message: 'Login successful',
            data: {
              user: {
                id: 1,
                name: 'Admin User',
                email: 'admin@polytechnic.com',
                role: 'admin' as const,
                isActive: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              token: 'mock-jwt-token-' + Date.now(),
            },
          };
          
          console.log('Mock API: Login successful', mockResponse);
          resolve({ data: mockResponse });
        } else {
          console.log('Mock API: Login failed - invalid credentials');
          reject(new Error('Invalid credentials'));
        }
      }, 1000); // 1 second delay to simulate network
    });
  },
};

export const mockDashboardAPI = {
  getDashboardData: (): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = {
          success: true,
          data: {
            counts: {
              students: 150,
              teachers: 25,
              guestTeachers: 8,
              departments: 6,
              courses: 45,
            },
            financials: {
              salaries: {
                total: 2500000,
                paid: 2000000,
                pending: 500000,
              },
              expenses: 150000,
              studentPayments: 800000,
            },
            attendance: {
              total: 150,
              present: 142,
              absent: 5,
              late: 3,
            },
            filters: {},
          },
        };
        
        console.log('Mock API: Dashboard data loaded', mockData);
        resolve({ data: mockData });
      }, 500);
    });
  },
};

export const mockAttendanceAPI = {
  markAttendance: (data: AttendanceMarkRequest): Promise<{ data: any }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          console.log('Mock API: Marking attendance', data);
          
          // Remove existing attendance for this class and date
          mockAttendanceData = mockAttendanceData.filter(
            a => !(a.classId === data.classScheduleId && a.date === data.date)
          );
          
          // Add new attendance records
          const newAttendanceRecords: Attendance[] = data.attendanceList.map(attendance => ({
            id: Date.now() + Math.random(),
            classId: data.classScheduleId,
            studentId: attendance.studentId,
            date: data.date,
            status: attendance.status,
            markedBy: 1, // Mock admin user
            markedAt: new Date().toISOString(),
          }));
          
          mockAttendanceData.push(...newAttendanceRecords);
          
          const response = {
            success: true,
            message: 'Attendance marked successfully',
            data: {
              attendance: newAttendanceRecords,
            },
          };
          
          console.log('Mock API: Attendance marked successfully', response);
          resolve({ data: response });
        } catch (error) {
          console.error('Mock API: Error marking attendance', error);
          reject(new Error('Failed to mark attendance'));
        }
      }, 800);
    });
  },

  getClassAttendance: (classScheduleId: number, date: string): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const attendance = mockAttendanceData.filter(
          a => a.classId === classScheduleId && a.date === date
        );
        
        const response = {
          success: true,
          data: {
            attendance: attendance,
          },
        };
        
        console.log('Mock API: Class attendance retrieved', response);
        resolve({ data: response });
      }, 300);
    });
  },

  getStudentReport: (studentId: number): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const student = mockStudents.find(s => s.id === studentId);
        if (!student) {
          resolve({ data: { success: false, message: 'Student not found' } });
          return;
        }

        const studentAttendance = mockAttendanceData.filter(a => a.studentId === studentId);
        const totalClasses = mockClassSchedules.length * 30; // Mock 30 days
        const present = studentAttendance.filter(a => a.status === 'present').length;
        const absent = studentAttendance.filter(a => a.status === 'absent').length;
        const late = studentAttendance.filter(a => a.status === 'late').length;
        const attendancePercentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

        const report: AttendanceReport = {
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          totalClasses,
          present,
          absent,
          late,
          attendancePercentage,
          departmentName: mockDepartments.find(d => d.id === student.departmentId)?.name || 'Unknown',
          semester: student.semester,
        };

        const response = {
          success: true,
          data: {
            reports: [report],
          },
        };
        
        console.log('Mock API: Student report retrieved', response);
        resolve({ data: response });
      }, 400);
    });
  },

  getStatistics: (): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalClasses = mockClassSchedules.length * 30;
        const totalStudents = mockStudents.length;
        const totalAttendance = mockAttendanceData.length;
        const presentCount = mockAttendanceData.filter(a => a.status === 'present').length;
        const averageAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

        const statistics: AttendanceStatistics = {
          totalClasses,
          totalStudents,
          averageAttendance,
          recentTrends: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            attendancePercentage: Math.floor(Math.random() * 40) + 60, // Random between 60-100
          })),
          departmentStats: mockDepartments.map(dept => ({
            departmentId: dept.id,
            departmentName: dept.name,
            averageAttendance: Math.floor(Math.random() * 30) + 70, // Random between 70-100
          })),
        };

        const response = {
          success: true,
          data: statistics,
        };
        
        console.log('Mock API: Statistics retrieved', response);
        resolve({ data: response });
      }, 500);
    });
  },

  getRewardsFines: (): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rewardsFines: AttendanceRewardFine[] = mockStudents.map(student => ({
          id: student.id,
          studentId: student.id,
          type: Math.random() > 0.5 ? 'reward' : 'fine',
          amount: Math.floor(Math.random() * 1000) + 100,
          reason: Math.random() > 0.5 ? 'Excellent attendance' : 'Poor attendance',
          month: new Date().toISOString().slice(0, 7),
          attendancePercentage: Math.floor(Math.random() * 40) + 60,
          isProcessed: Math.random() > 0.3,
          student: {
            id: student.id,
            rollNumber: student.rollNumber,
            user: { name: student.name },
          },
        }));

        const response = {
          success: true,
          data: {
            rewardsFines,
          },
        };
        
        console.log('Mock API: Rewards and fines retrieved', response);
        resolve({ data: response });
      }, 400);
    });
  },
};

export const mockStudentAPI = {
  getAll: (): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = {
          success: true,
          data: {
            students: mockStudents,
          },
        };
        
        console.log('Mock API: Students retrieved', response);
        resolve({ data: response });
      }, 300);
    });
  },
};

export const mockDepartmentAPI = {
  getAll: (): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = {
          success: true,
          data: {
            departments: mockDepartments,
          },
        };
        
        console.log('Mock API: Departments retrieved', response);
        resolve({ data: response });
      }, 300);
    });
  },
};

export const mockClassScheduleAPI = {
  getAll: (): Promise<{ data: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = {
          success: true,
          data: {
            classes: mockClassSchedules,
          },
        };
        
        console.log('Mock API: Class schedules retrieved', response);
        resolve({ data: response });
      }, 300);
    });
  },
};
