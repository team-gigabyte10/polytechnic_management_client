import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Award, 
  DollarSign,
  BarChart3,
  UserCheck,
  FileText,
  RefreshCw
} from 'lucide-react';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  attendanceAPI, 
  classScheduleAPI, 
  studentAPI, 
  departmentAPI 
} from '../services/api';
import { 
  Attendance, 
  AttendanceMarkRequest, 
  AttendanceReport, 
  AttendanceStatistics, 
  AttendanceRewardFine, 
  ClassSchedule,
  Student,
  Department
} from '../types';
import useApiError from '../hooks/useApiError';

const markAttendanceSchema = yup.object({
  classScheduleId: yup.number().required('Class is required'),
  date: yup.string().required('Date is required'),
});

type MarkAttendanceFormValues = {
  classScheduleId: number;
  date: string;
};

const AttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mark' | 'reports' | 'statistics' | 'rewards'>('mark');
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(null);
  const [rewardsFines, setRewardsFines] = useState<AttendanceRewardFine[]>([]);
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [attendanceList, setAttendanceList] = useState<Array<{ studentId: number; status: 'present' | 'absent' | 'late' }>>([]);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  
  const [filters, setFilters] = useState({
    departmentId: '',
    classId: '',
    studentId: '',
    date: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  // Enhanced error handling
  const { handleError, isRetrying, resetRetry } = useApiError();

  const {
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<MarkAttendanceFormValues>({
    resolver: yupResolver(markAttendanceSchema),
    defaultValues: {
      classScheduleId: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const watchedClassScheduleId = watch('classScheduleId');
  const watchedDate = watch('date');

  // Fetch initial data
  useEffect(() => {
    fetchClasses();
    fetchStudents();
    fetchDepartments();
    fetchStatistics();
    fetchRewardsFines();
  }, []);

  // Fetch attendance data when class or date changes
  useEffect(() => {
    if (watchedClassScheduleId && watchedDate) {
      fetchClassAttendance(Number(watchedClassScheduleId), watchedDate);
    }
  }, [watchedClassScheduleId, watchedDate]);

  const fetchClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const res = await classScheduleAPI.getAll();
      const classItems: ClassSchedule[] = res?.data?.data?.classes ?? res?.data?.data ?? res?.data ?? [];
      setClasses(classItems);
      resetRetry(); // Reset retry count on success
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      handleError(error, 'Failed to load classes');
      setClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll();
      const studentItems: Student[] = res?.data?.data?.students ?? res?.data?.data ?? res?.data ?? [];
      setStudents(studentItems);
      resetRetry(); // Reset retry count on success
    } catch (error: any) {
      console.error('Error fetching students:', error);
      handleError(error, 'Failed to load students');
      setStudents([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentAPI.getAll();
      const departmentItems: Department[] = res?.data?.data?.departments ?? res?.data?.data ?? res?.data ?? [];
      setDepartments(departmentItems);
      resetRetry(); // Reset retry count on success
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      handleError(error, 'Failed to load departments');
      setDepartments([]);
    }
  };

  const fetchClassAttendance = async (classScheduleId: number, date: string) => {
    try {
      const res = await attendanceAPI.getClassAttendance(classScheduleId, date);
      const attendanceItems: Attendance[] = res?.data?.data?.attendance ?? res?.data?.data ?? res?.data ?? [];
      
      // Initialize attendance list for marking
      const classItem = classes.find(c => c.id === classScheduleId);
      if (classItem) {
        setSelectedClass(classItem);
        // Get students for this class (you might need to implement this based on your data structure)
        const classStudents = students.filter(s => s.semester === classItem.semester);
        const initialAttendanceList = classStudents.map(student => {
          const existingAttendance = attendanceItems.find(a => a.studentId === student.id);
          return {
            studentId: student.id,
            status: existingAttendance?.status || 'absent' as 'present' | 'absent' | 'late'
          };
        });
        setAttendanceList(initialAttendanceList);
      }
      resetRetry(); // Reset retry count on success
    } catch (error: any) {
      console.error('Error fetching class attendance:', error);
      handleError(error, 'Failed to load attendance data');
    }
  };

  const fetchReports = async () => {
    try {
      setIsLoadingReports(true);
      const params: any = {};
      if (filters.departmentId) params.departmentId = Number(filters.departmentId);
      if (filters.studentId) params.studentId = Number(filters.studentId);
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await attendanceAPI.getStudentReport(Number(filters.studentId) || 0, params);
      const reportItems: AttendanceReport[] = res?.data?.data?.reports ?? res?.data?.data ?? res?.data ?? [];
      setReports(reportItems);
      resetRetry(); // Reset retry count on success
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      handleError(error, 'Failed to load attendance reports');
      setReports([]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setIsLoadingStatistics(true);
      const res = await attendanceAPI.getStatistics();
      const stats: AttendanceStatistics = res?.data?.data ?? res?.data ?? {};
      setStatistics(stats);
      resetRetry(); // Reset retry count on success
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      handleError(error, 'Failed to load attendance statistics');
      setStatistics(null);
    } finally {
      setIsLoadingStatistics(false);
    }
  };

  const fetchRewardsFines = async () => {
    try {
      setIsLoadingRewards(true);
      const res = await attendanceAPI.getRewardsFines();
      const rewardsItems: AttendanceRewardFine[] = res?.data?.data?.rewardsFines ?? res?.data?.data ?? res?.data ?? [];
      setRewardsFines(rewardsItems);
      resetRetry(); // Reset retry count on success
    } catch (error: any) {
      console.error('Error fetching rewards/fines:', error);
      handleError(error, 'Failed to load rewards and fines');
      setRewardsFines([]);
    } finally {
      setIsLoadingRewards(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!watchedClassScheduleId || !watchedDate) {
      toast.error('Please select a class and date');
      return;
    }

    try {
      setIsMarkingAttendance(true);
      const payload: AttendanceMarkRequest = {
        classScheduleId: watchedClassScheduleId,
        date: watchedDate,
        attendanceList: attendanceList,
      };

      await attendanceAPI.markAttendance(payload);
      toast.success('Attendance marked successfully');
      fetchClassAttendance(watchedClassScheduleId, watchedDate);
      resetRetry(); // Reset retry count on success
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      handleError(error, 'Failed to mark attendance');
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const handleAttendanceStatusChange = (studentId: number, status: 'present' | 'absent' | 'late') => {
    setAttendanceList(prev => 
      prev.map(item => 
        item.studentId === studentId ? { ...item, status } : item
      )
    );
  };

  const handleBulkStatusChange = (status: 'present' | 'absent' | 'late') => {
    setAttendanceList(prev => 
      prev.map(item => ({ ...item, status }))
    );
  };


  const getStatusColor = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAttendancePercentage = () => {
    if (attendanceList.length === 0) return 0;
    const present = attendanceList.filter(a => a.status === 'present').length;
    return Math.round((present / attendanceList.length) * 100);
  };

  const filteredClasses = useMemo(() => {
    if (!filters.departmentId || filters.departmentId === '') return classes;
    return classes.filter(c => {
      const subject = c.subject;
      if (!subject) return false;
      const subjectDeptId = subject.departmentId || subject.department_id;
      return subjectDeptId === Number(filters.departmentId);
    });
  }, [classes, filters.departmentId]);


  const renderMarkAttendance = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark Attendance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.departmentId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, departmentId: e.target.value }));
                // Reset class selection when department changes
                reset({ classScheduleId: 0, date: watchedDate });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              {...register('classScheduleId', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingClasses}
            >
              <option value="">Select Class</option>
              {filteredClasses.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.subject?.name} - {classItem.roomNumber} ({classItem.scheduleDay})
                </option>
              ))}
            </select>
            {errors.classScheduleId && <p className="text-red-500 text-sm mt-1">{errors.classScheduleId.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
          </div>
        </div>

        {selectedClass && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Class Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Subject:</span>
                <p className="font-medium">{selectedClass.subject?.name}</p>
              </div>
              <div>
                <span className="text-blue-700">Room:</span>
                <p className="font-medium">{selectedClass.roomNumber}</p>
              </div>
              <div>
                <span className="text-blue-700">Time:</span>
                <p className="font-medium">{selectedClass.startTime} - {selectedClass.endTime}</p>
              </div>
              <div>
                <span className="text-blue-700">Semester:</span>
                <p className="font-medium">{selectedClass.semester}</p>
              </div>
            </div>
          </div>
        )}

        {attendanceList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Student Attendance</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Bulk Actions:</span>
                <button
                  onClick={() => handleBulkStatusChange('present')}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
                >
                  All Present
                </button>
                <button
                  onClick={() => handleBulkStatusChange('absent')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                >
                  All Absent
                </button>
                <button
                  onClick={() => handleBulkStatusChange('late')}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm"
                >
                  All Late
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      Present: {attendanceList.filter(a => a.status === 'present').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-600">
                      Absent: {attendanceList.filter(a => a.status === 'absent').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">
                      Late: {attendanceList.filter(a => a.status === 'late').length}
                    </span>
                  </div>
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {getAttendancePercentage()}% Attendance
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {attendanceList.map((attendance) => {
                const student = students.find(s => s.id === attendance.studentId);
                if (!student) return null;

                return (
                  <div
                    key={attendance.studentId}
                    className={`border rounded-lg p-3 transition-colors ${getStatusColor(attendance.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm opacity-75">{student.rollNumber}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAttendanceStatusChange(attendance.studentId, 'present')}
                          className={`p-1 rounded ${
                            attendance.status === 'present' 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAttendanceStatusChange(attendance.studentId, 'absent')}
                          className={`p-1 rounded ${
                            attendance.status === 'absent' 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAttendanceStatusChange(attendance.studentId, 'late')}
                          className={`p-1 rounded ${
                            attendance.status === 'late' 
                              ? 'bg-yellow-200 text-yellow-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleMarkAttendance}
                disabled={isMarkingAttendance}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg shadow-lg disabled:opacity-0 flex items-center gap-2 transition-none"
              >
                {isMarkingAttendance ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                Mark Attendance
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Reports</h3>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={filters.studentId}
              onChange={(e) => setFilters(prev => ({ ...prev, studentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.rollNumber})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoadingReports ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Roll Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Semester</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Total Classes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Present</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Absent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Late</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.studentId} className="odd:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{report.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{report.rollNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{report.departmentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{report.semester}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{report.totalClasses}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {report.present}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        {report.absent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        {report.late}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.attendancePercentage >= 85 
                          ? 'bg-green-100 text-green-800'
                          : report.attendancePercentage >= 75
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {report.attendancePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={9}>
                      No attendance reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-6">
      {isLoadingStatistics ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : statistics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.totalClasses}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.totalStudents}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.averageAttendance}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Trends</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.recentTrends.length} days</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Statistics</h3>
              <div className="space-y-3">
                {statistics.departmentStats.map((dept) => (
                  <div key={dept.departmentId} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{dept.departmentName}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${dept.averageAttendance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {dept.averageAttendance}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Trends</h3>
              <div className="space-y-3">
                {statistics.recentTrends.slice(0, 7).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(trend.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${trend.attendancePercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {trend.attendancePercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-6">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Statistics Available</h3>
            <p className="text-gray-600">Statistics will appear here once attendance data is available.</p>
          </div>
        </Card>
      )}
    </div>
  );

  const renderRewardsFines = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Rewards & Fines</h3>
          <button
            onClick={fetchRewardsFines}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {isLoadingRewards ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Attendance %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rewardsFines.map((item) => (
                  <tr key={item.id} className="odd:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {item.student?.user?.name || `Student ${item.studentId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        item.type === 'reward' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.type === 'reward' ? (
                          <Award className="w-3 h-3" />
                        ) : (
                          <DollarSign className="w-3 h-3" />
                        )}
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`font-medium ${
                        item.type === 'reward' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹{item.amount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.reason}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(item.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.attendancePercentage >= 85 
                          ? 'bg-green-100 text-green-800'
                          : item.attendancePercentage >= 75
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.attendancePercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.isProcessed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.isProcessed ? 'Processed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                {rewardsFines.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={7}>
                      No rewards or fines found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <div className="flex items-center gap-2">
            {isRetrying && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Retrying...</span>
              </div>
            )}
            <button
              onClick={() => {
                fetchStatistics();
                fetchRewardsFines();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              disabled={isRetrying}
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>
        </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'mark', label: 'Mark Attendance', icon: UserCheck },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'statistics', label: 'Statistics', icon: BarChart3 },
            { id: 'rewards', label: 'Rewards & Fines', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'mark' && renderMarkAttendance()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'statistics' && renderStatistics()}
      {activeTab === 'rewards' && renderRewardsFines()}
    </div>
  );
};

export default AttendancePage;
