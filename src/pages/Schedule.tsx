import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, X, Calendar, Clock, MapPin, Filter } from 'lucide-react';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { classScheduleAPI, subjectAPI, teacherAPI, guestTeacherAPI, departmentAPI } from '../services/api';
import { ClassSchedule, Subject, Teacher, GuestTeacher, Department, CreateClassScheduleRequest } from '../types';

const schema = yup.object({
  departmentId: yup.number().typeError('Department is required').required('Department is required'),
  subjectId: yup.number().typeError('Subject is required').required('Subject is required'),
  teacherId: yup.number().nullable().transform((value, originalValue) => {
    return originalValue === '' || originalValue === null || originalValue === undefined ? null : value;
  }).optional(),
  guestTeacherId: yup.number().nullable().transform((value, originalValue) => {
    return originalValue === '' || originalValue === null || originalValue === undefined ? null : value;
  }).optional(),
  roomNumber: yup.string().optional(),
  scheduleDay: yup.string().oneOf(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).required('Day is required'),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  classType: yup.string().oneOf(['theory', 'practical', 'lab', 'tutorial', 'seminar']).optional(),
  semester: yup.number().typeError('Semester is required').required('Semester is required'),
  academicYear: yup.string().required('Academic year is required'),
  maxStudents: yup.number().nullable().transform((value, originalValue) => {
    return originalValue === '' || originalValue === null || originalValue === undefined ? null : value;
  }).optional(),
  isRecurring: yup.boolean().optional(),
  startDate: yup.string().optional(),
  endDate: yup.string().optional(),
  notes: yup.string().optional(),
  isActive: yup.boolean().default(true),
});

type FormValues = {
  departmentId: number;
  subjectId: number;
  teacherId?: number | null;
  guestTeacherId?: number | null;
  roomNumber: string;
  scheduleDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  classType: 'theory' | 'practical' | 'lab' | 'tutorial' | 'seminar';
  semester: number;
  academicYear: string;
  maxStudents?: number | null;
  isRecurring?: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
};

const Schedule: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [guestTeachers, setGuestTeachers] = useState<GuestTeacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isLoadingGuestTeachers, setIsLoadingGuestTeachers] = useState(true);
  // const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'weekly'>('list');
  const [weeklySchedule, setWeeklySchedule] = useState<any>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [filters, setFilters] = useState({
    departmentId: '',
    subjectId: '',
    teacherId: '',
    guestTeacherId: '',
    scheduleDay: '',
    classType: '',
    semester: '',
  });

  const fetchClasses = async () => {
    try {
      setIsLoadingList(true);
      const params: any = {};
      if (filters.departmentId) params.department = Number(filters.departmentId);
      if (filters.subjectId) params.subject = Number(filters.subjectId);
      if (filters.teacherId) params.teacher = Number(filters.teacherId);
      if (filters.guestTeacherId) params.guestTeacher = Number(filters.guestTeacherId);
      if (filters.scheduleDay) params.day = filters.scheduleDay;
      if (filters.classType) params.classType = filters.classType;
      if (filters.semester) params.semester = Number(filters.semester);

      const res = await classScheduleAPI.getAll(params);
      
      // Handle different response structures
      let classItems: ClassSchedule[] = [];
      const responseData = res?.data as any;
      
      if (responseData?.data?.classes && Array.isArray(responseData.data.classes)) {
        classItems = responseData.data.classes;
      } else if (responseData?.data?.classSchedules && Array.isArray(responseData.data.classSchedules)) {
        classItems = responseData.data.classSchedules;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        classItems = responseData.data;
      } else if (responseData && Array.isArray(responseData)) {
        classItems = responseData;
      } else if (responseData?.classes && Array.isArray(responseData.classes)) {
        classItems = responseData.classes;
      } else if (responseData?.classSchedules && Array.isArray(responseData.classSchedules)) {
        classItems = responseData.classSchedules;
      }
      
      // Apply client-side filtering as fallback
      let filteredClasses = classItems;
      
      // Filter by subject
      if (filters.subjectId) {
        filteredClasses = filteredClasses.filter(classItem => 
          classItem.subjectId === Number(filters.subjectId)
        );
      }
      
      // Filter by day
      if (filters.scheduleDay) {
        filteredClasses = filteredClasses.filter(classItem => 
          classItem.scheduleDay === filters.scheduleDay
        );
      }
      
      // Filter by class type
      if (filters.classType) {
        filteredClasses = filteredClasses.filter(classItem => 
          classItem.classType === filters.classType
        );
      }
      
      // Filter by semester
      if (filters.semester) {
        filteredClasses = filteredClasses.filter(classItem => 
          classItem.semester === Number(filters.semester)
        );
      }
      
      setClasses(filteredClasses);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error(error?.response?.data?.message || 'Failed to load classes');
      // Ensure classes is always an array even on error
      setClasses([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchWeeklySchedule = async () => {
    try {
      setIsLoadingWeekly(true);
      const params: any = {};
      if (filters.departmentId) params.department = Number(filters.departmentId);

      const res = await classScheduleAPI.getWeeklySchedule(params);
      
      // Handle different response structures for weekly schedule
      let weeklyData: any = {};
      const responseData = res?.data as any;
      
      if (responseData?.data?.weeklySchedule) {
        weeklyData = responseData.data.weeklySchedule;
      } else if (responseData?.data) {
        weeklyData = responseData.data;
      } else if (responseData) {
        weeklyData = responseData;
      }
      
      setWeeklySchedule(weeklyData);
    } catch (error: any) {
      console.error('Error fetching weekly schedule:', error);
      toast.error('Failed to load weekly schedule');
      // Ensure weeklySchedule is always an object even on error
      setWeeklySchedule({});
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      const res = await subjectAPI.getAll();
      const subjectItems: Subject[] = res?.data?.data?.subjects ?? res?.data?.data ?? res?.data ?? [];
      setSubjects(subjectItems);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setIsLoadingTeachers(true);
      const res = await teacherAPI.getAll();
      const teacherItems: any[] = res?.data?.data?.teachers ?? res?.data?.data ?? res?.data ?? [];
      const teachersWithUserNames = teacherItems.map((teacher: any) => ({
        ...teacher,
        name: teacher.user?.name || teacher.name || 'N/A'
      }));
      setTeachers(teachersWithUserNames);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
      setTeachers([]);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const fetchGuestTeachers = async () => {
    try {
      setIsLoadingGuestTeachers(true);
      const res = await guestTeacherAPI.getAll();
      const guestTeacherItems: GuestTeacher[] = res?.data?.data?.guestTeachers ?? res?.data?.data ?? res?.data ?? [];
      setGuestTeachers(guestTeacherItems);
    } catch (error: any) {
      console.error('Error fetching guest teachers:', error);
      toast.error('Failed to load guest teachers');
      setGuestTeachers([]);
    } finally {
      setIsLoadingGuestTeachers(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentAPI.getAll();
      let departmentItems: Department[] = [];
      if (res?.data?.data?.departments && Array.isArray(res.data.data.departments)) {
        departmentItems = res.data.data.departments.map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          headId: dept.headId,
          createdAt: dept.created_at,
          updatedAt: dept.updated_at,
        }));
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        departmentItems = res.data.data;
      } else if (res?.data && Array.isArray(res.data)) {
        departmentItems = res.data;
      }
      setDepartments(departmentItems);
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
      setDepartments([]);
    } finally {
    }
  };

  useEffect(() => {
    // Always fetch classes for list view functionality
    fetchClasses();
    
    // Also fetch weekly schedule if in weekly view
    if (viewMode === 'weekly') {
      fetchWeeklySchedule();
    }
    
    // Fetch supporting data
    fetchSubjects();
    fetchTeachers();
    fetchGuestTeachers();
    fetchDepartments();
  }, [filters, viewMode]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      departmentId: undefined as unknown as number,
      subjectId: undefined as unknown as number,
      teacherId: undefined as unknown as number,
      guestTeacherId: undefined as unknown as number,
      roomNumber: '',
      scheduleDay: 'monday',
      startTime: '09:00',
      endTime: '10:00',
      classType: 'theory',
      semester: 1,
      academicYear: '2024-25',
      maxStudents: undefined,
      isRecurring: true,
      startDate: '',
      endDate: '',
      notes: '',
      isActive: true,
    },
  });

  const watchedTeacherId = watch('teacherId');
  const watchedGuestTeacherId = watch('guestTeacherId');
  const watchedScheduleDay = watch('scheduleDay');
  const watchedDepartmentId = watch('departmentId');

  // Memoized filtered subjects based on selected department (for form)
  const filteredSubjects = useMemo(() => {
    if (!watchedDepartmentId) {
      return subjects;
    }
    return subjects.filter(subject => {
      const subjectDeptId = subject.departmentId || (subject as any).department_id;
      return subjectDeptId === watchedDepartmentId;
    });
  }, [subjects, watchedDepartmentId]);

  // Memoized filtered subjects for main page filters based on selected department filter
  const filteredSubjectsForFilters = useMemo(() => {
    if (!filters.departmentId) {
      return subjects;
    }
    return subjects.filter(subject => {
      const subjectDeptId = subject.departmentId || (subject as any).department_id;
      return subjectDeptId === Number(filters.departmentId);
    });
  }, [subjects, filters.departmentId]);

  // Update form when editing class and subjects are loaded
  useEffect(() => {
    if (editingClass && subjects.length > 0 && showForm) {
      // Get department ID from subject or class item
      let departmentId = 0;
      if (editingClass.subject && editingClass.subject.departmentId) {
        departmentId = editingClass.subject.departmentId;
      } else if ((editingClass as any).departmentId) {
        departmentId = (editingClass as any).departmentId;
      } else if ((editingClass as any).department_id) {
        departmentId = (editingClass as any).department_id;
      } else if (editingClass.subjectId) {
        // Find the subject and get its department
        const subject = subjects.find(s => s.id === editingClass.subjectId);
        if (subject) {
          departmentId = subject.departmentId || (subject as any).department_id || 0;
        }
      }
      
      // Update the form with the resolved department ID
      setValue('departmentId', departmentId);
    }
  }, [editingClass, subjects, showForm, setValue]);
  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');
  const watchedRoomNumber = watch('roomNumber');

  useEffect(() => {
    if (watchedTeacherId && watchedGuestTeacherId) {
      reset({
        ...watch(),
        guestTeacherId: undefined,
      });
    }
  }, [watchedTeacherId, watchedGuestTeacherId, reset, watch]);

  useEffect(() => {
    if (watchedGuestTeacherId && watchedTeacherId) {
      reset({
        ...watch(),
        teacherId: undefined,
      });
    }
  }, [watchedGuestTeacherId, watchedTeacherId, reset, watch]);

  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  
  useEffect(() => {
    if (showForm && !editingClass && watchedScheduleDay && watchedStartTime && watchedEndTime && watchedRoomNumber && (watchedTeacherId || watchedGuestTeacherId)) {
      const currentValues: FormValues = {
        departmentId: watch('departmentId') || 0,
        subjectId: 0,
        teacherId: watchedTeacherId,
        guestTeacherId: watchedGuestTeacherId,
        roomNumber: watchedRoomNumber,
        scheduleDay: watchedScheduleDay,
        startTime: watchedStartTime,
        endTime: watchedEndTime,
        classType: 'theory' as const,
        semester: 1,
        academicYear: '2024-25',
        isRecurring: true,
        startDate: '',
        endDate: '',
        notes: '',
        isActive: true,
      };
      const conflicts = checkForConflicts(currentValues);
      setConflictWarnings(conflicts);
    } else {
      setConflictWarnings([]);
    }
  }, [watchedScheduleDay, watchedStartTime, watchedEndTime, watchedRoomNumber, watchedTeacherId, watchedGuestTeacherId, showForm, editingClass, classes]);

  const checkForConflicts = (values: FormValues, excludeId?: number) => {
    const conflicts: string[] = [];
    if (!Array.isArray(classes)) return conflicts;
    
    classes.filter(classItem => {
      if (excludeId && classItem.id === excludeId) return false;
      if (classItem.scheduleDay !== values.scheduleDay) return false;
      const classStart = classItem.startTime;
      const classEnd = classItem.endTime;
      const newStart = values.startTime;
      const newEnd = values.endTime;
      const hasTimeOverlap = (newStart < classEnd && newEnd > classStart);
      if (!hasTimeOverlap) return false;
      if (values.teacherId && classItem.teacherId === values.teacherId) {
        conflicts.push(`Teacher is already scheduled for ${classItem.startTime}-${classItem.endTime} in ${classItem.roomNumber}`);
        return true;
      }
      if (values.guestTeacherId && classItem.guestTeacherId === values.guestTeacherId) {
        conflicts.push(`Guest teacher is already scheduled for ${classItem.startTime}-${classItem.endTime} in ${classItem.roomNumber}`);
        return true;
      }
      if (classItem.roomNumber === values.roomNumber) {
        conflicts.push(`Room ${values.roomNumber} is already booked for ${classItem.startTime}-${classItem.endTime} by ${getTeacherName(classItem.teacherId, classItem.guestTeacherId)}`);
        return true;
      }
      return false;
    });
    return conflicts;
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.teacherId && !values.guestTeacherId) {
      toast.error('Please select either a teacher or guest teacher');
      return;
    }
    if (values.startTime >= values.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    const conflicts = checkForConflicts(values, editingClass?.id);
    if (conflicts.length > 0) {
      toast.error(`Scheduling conflicts detected:\n${conflicts.join('\n')}`);
      return;
    }

    const payload: any = {
      subjectId: values.subjectId,
      roomNumber: values.roomNumber,
      scheduleDay: values.scheduleDay,
      startTime: values.startTime,
      endTime: values.endTime,
      classType: values.classType,
      semester: values.semester,
      academicYear: values.academicYear,
      isRecurring: values.isRecurring,
      startDate: values.startDate,
      endDate: values.endDate,
      notes: values.notes,
      isActive: values.isActive,
    };

    // Only add departmentId for new class schedules, not for updates
    if (!editingClass) {
      payload.departmentId = values.departmentId;
    }

    // Only add optional fields if they have valid positive values
    if (values.maxStudents !== null && values.maxStudents !== undefined && values.maxStudents > 0) {
      payload.maxStudents = values.maxStudents;
    }
    if (values.teacherId !== null && values.teacherId !== undefined && values.teacherId > 0) {
      payload.teacherId = values.teacherId;
    }
    if (values.guestTeacherId !== null && values.guestTeacherId !== undefined && values.guestTeacherId > 0) {
      payload.guestTeacherId = values.guestTeacherId;
    }

    try {
      if (editingClass) {
        await classScheduleAPI.update(editingClass.id, payload);
        toast.success('Class schedule updated successfully');
        setEditingClass(null);
      } else {
        const createPayload = payload as CreateClassScheduleRequest;
        await classScheduleAPI.create(createPayload);
        toast.success('Class schedule created successfully');
      }
      reset();
      setShowForm(false);
      fetchClasses();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save class schedule';
      toast.error(message);
    }
  };

  const handleEdit = (classItem: ClassSchedule) => {
    setEditingClass(classItem);
    setShowForm(true);
    
    // Get department ID from subject or class item
    let departmentId = 0;
    if (classItem.subject && classItem.subject.departmentId) {
      departmentId = classItem.subject.departmentId;
    } else if ((classItem as any).departmentId) {
      departmentId = (classItem as any).departmentId;
    } else if ((classItem as any).department_id) {
      departmentId = (classItem as any).department_id;
    } else if (classItem.subjectId) {
      // Find the subject and get its department
      const subject = subjects.find(s => s.id === classItem.subjectId);
      if (subject) {
        departmentId = subject.departmentId || (subject as any).department_id || 0;
      }
    }
    
    reset({
      departmentId: departmentId,
      subjectId: classItem.subjectId,
      teacherId: classItem.teacherId || null,
      guestTeacherId: classItem.guestTeacherId || null,
      roomNumber: classItem.roomNumber,
      scheduleDay: classItem.scheduleDay,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      classType: classItem.classType,
      semester: classItem.semester,
      academicYear: classItem.academicYear,
      maxStudents: classItem.maxStudents || null,
      isRecurring: classItem.isRecurring,
      startDate: classItem.startDate,
      endDate: classItem.endDate,
      notes: classItem.notes,
      isActive: classItem.isActive,
    });
  };

  const handleDelete = async (classId: number) => {
    if (!window.confirm('Are you sure you want to delete this class schedule?')) {
      return;
    }
    try {
      setIsDeleting(classId);
      await classScheduleAPI.delete(classId);
      toast.success('Class schedule deleted successfully');
      fetchClasses();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete class schedule';
      toast.error(message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
    reset();
  };

  const handleShowForm = () => {
    setEditingClass(null);
    setShowForm(true);
    reset({
      departmentId: undefined as unknown as number,
      subjectId: undefined as unknown as number,
      teacherId: null,
      guestTeacherId: null,
      roomNumber: '',
      scheduleDay: 'monday',
      startTime: '09:00',
      endTime: '10:00',
      classType: 'theory',
      semester: 1,
      academicYear: '2024-25',
      maxStudents: null,
      isRecurring: true,
      startDate: '',
      endDate: '',
      notes: '',
      isActive: true,
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value,
      };
      
      // Reset subject filter when department changes
      if (key === 'departmentId') {
        newFilters.subjectId = '';
      }
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      departmentId: '',
      subjectId: '',
      teacherId: '',
      guestTeacherId: '',
      scheduleDay: '',
      classType: '',
      semester: '',
    });
  };

  const getSubjectName = (subjectId: number, classItem?: ClassSchedule) => {
    // First try to get from the class item's nested subject data
    if (classItem?.subject) {
      return `${classItem.subject.name} (${classItem.subject.code})`;
    }
    
    // Fallback to subjects list
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? `${subject.name} (${subject.code})` : `Subject ${subjectId}`;
  };

  const getTeacherName = (teacherId?: number, guestTeacherId?: number) => {
    if (teacherId) {
      const teacher = teachers.find(t => t.id === teacherId);
      return teacher ? teacher.name : `Teacher ${teacherId}`;
    }
    if (guestTeacherId) {
      const guestTeacher = guestTeachers.find(gt => gt.id === guestTeacherId);
      return guestTeacher ? guestTeacher.name : `Guest Teacher ${guestTeacherId}`;
    }
    return 'Not assigned';
  };

  const getDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getClassTypeColor = (type: string) => {
    switch (type) {
      case 'theory': return 'bg-blue-100 text-blue-800';
      case 'practical': return 'bg-green-100 text-green-800';
      case 'lab': return 'bg-purple-100 text-purple-800';
      case 'tutorial': return 'bg-orange-100 text-orange-800';
      case 'seminar': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Class Schedule</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-1" />
              List View
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'weekly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Weekly View
            </button>
          </div>
          {!showForm && (
            <button
              onClick={handleShowForm}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          )}
        </div>
      </div>

      {!showForm && (
        <Card className="p-4" hover={false}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filters.departmentId}
                onChange={(e) => handleFilterChange('departmentId', e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={filters.subjectId}
                onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {filteredSubjectsForFilters.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {filters.departmentId && filteredSubjectsForFilters.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">No subjects found for selected department</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                value={filters.scheduleDay}
                onChange={(e) => handleFilterChange('scheduleDay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Days</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            <div>
              <label className="block text sm font-medium text-gray-700 mb-1">Class Type</label>
              <select
                value={filters.classType}
                onChange={(e) => handleFilterChange('classType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="theory">Theory</option>
                <option value="practical">Practical</option>
                <option value="lab">Lab</option>
                <option value="tutorial">Tutorial</option>
                <option value="seminar">Seminar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </Card>
      )}

      {!showForm && viewMode === 'list' && (
        <Card className="p-4 md:p-6" hover={false}>
          {isLoadingList ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Filter Status Indicator */}
              {(filters.subjectId || filters.scheduleDay || filters.classType || filters.semester) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filters.subjectId && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Subject: {subjects.find(s => s.id === Number(filters.subjectId))?.name || filters.subjectId}
                      </span>
                    )}
                    {filters.scheduleDay && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Day: {filters.scheduleDay.charAt(0).toUpperCase() + filters.scheduleDay.slice(1)}
                      </span>
                    )}
                    {filters.classType && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Type: {filters.classType.charAt(0).toUpperCase() + filters.classType.slice(1)}
                      </span>
                    )}
                    {filters.semester && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Semester: {filters.semester}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-xl shadow ring-1 ring-gray-200/60">
              <table className="min-w-full">
                <thead className="bg-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">SL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Room</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Day</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {Array.isArray(classes) && classes.map((classItem, index) => (
                    <tr key={classItem.id} className="odd:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getSubjectName(classItem.subjectId, classItem)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getTeacherName(classItem.teacherId, classItem.guestTeacherId)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{classItem.roomNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getDayName(classItem.scheduleDay)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Semester {classItem.semester}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassTypeColor(classItem.classType)}`}>
                          {getDayName(classItem.classType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {classItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(classItem)}
                            className="p-1 text-indigo-600 rounded"
                            title="Edit Class"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(classItem.id)}
                            disabled={isDeleting === classItem.id}
                            className="p-1 text-rose-600 rounded disabled:opacity-50"
                            title="Delete Class"
                          >
                            {isDeleting === classItem.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {Array.isArray(classes) && classes.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={10}>No classes found</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </>
          )}
        </Card>
      )}

      {!showForm && viewMode === 'weekly' && (
        <Card className="p-4 md:p-6" hover={false}>
          {isLoadingWeekly ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const dayClasses = weeklySchedule?.[day] || (Array.isArray(classes) ? classes.filter(c => c.scheduleDay === day) : []);
                return (
                  <div key={day} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 text-center">
                      {getDayName(day)}
                    </h3>
                    <div className="space-y-2">
                      {dayClasses.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center">No classes</p>
                      ) : (
                        dayClasses
                          .sort((a: ClassSchedule, b: ClassSchedule) => a.startTime.localeCompare(b.startTime))
                          .map((classItem: ClassSchedule) => (
                            <div
                              key={classItem.id}
                              className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {getSubjectName(classItem.subjectId, classItem)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {getTeacherName(classItem.teacherId, classItem.guestTeacherId)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {classItem.roomNumber}
                              </div>
                              <div className="text-xs text-gray-500">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                              </div>
                              <div className="mt-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassTypeColor(classItem.classType)}`}>
                                  {getDayName(classItem.classType)}
                                </span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {showForm && (
        <Card className="p-4 md:p-6" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingClass ? 'Edit Class Schedule' : 'Add New Class Schedule'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {conflictWarnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">⚠️ Scheduling Conflicts Detected:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {conflictWarnings.map((conflict, index) => (
                    <li key={index}>• {conflict}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select 
                  {...register('departmentId', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    register('departmentId', { valueAsNumber: true }).onChange(e);
                    // Reset subject selection when department changes
                    setValue('subjectId', undefined as unknown as number);
                    // Force form validation to update
                    trigger('subjectId');
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select 
                  {...register('subjectId', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingSubjects}
                  key={`subject-${watch('departmentId') || 'all'}`} // Force re-render when department changes
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {isLoadingSubjects && (
                  <p className="text-xs text-blue-600 mt-1">Loading subjects...</p>
                )}
                {watchedDepartmentId && filteredSubjects.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">No subjects found for selected department</p>
                )}
                {errors.subjectId && <p className="text-red-500 text-sm mt-1">{errors.subjectId.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input 
                  {...register('roomNumber')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., A101, Lab-1"
                />
                {errors.roomNumber && <p className="text-red-500 text-sm mt-1">{errors.roomNumber.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select 
                  {...register('teacherId', { 
                    setValueAs: (value) => value === '' ? null : Number(value)
                  })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingTeachers}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.employeeId})
                    </option>
                  ))}
                </select>
                {isLoadingTeachers && (
                  <p className="text-xs text-blue-600 mt-1">Loading teachers...</p>
                )}
                {errors.teacherId && <p className="text-red-500 text-sm mt-1">{errors.teacherId.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Teacher</label>
                <select 
                  {...register('guestTeacherId', { 
                    setValueAs: (value) => value === '' ? null : Number(value)
                  })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingGuestTeachers}
                >
                  <option value="">Select Guest Teacher</option>
                  {guestTeachers.map((guestTeacher) => (
                    <option key={guestTeacher.id} value={guestTeacher.id}>
                      {guestTeacher.name}
                    </option>
                  ))}
                </select>
                {isLoadingGuestTeachers && (
                  <p className="text-xs text-blue-600 mt-1">Loading guest teachers...</p>
                )}
                {errors.guestTeacherId && <p className="text-red-500 text-sm mt-1">{errors.guestTeacherId.message as any}</p>}
                <p className="text-xs text-gray-600 mt-1">Note: Select either a teacher OR guest teacher, not both</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select 
                  {...register('scheduleDay')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
                {errors.scheduleDay && <p className="text-red-500 text-sm mt-1">{errors.scheduleDay.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                <select 
                  {...register('classType')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                  <option value="lab">Lab</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="seminar">Seminar</option>
                </select>
                {errors.classType && <p className="text-red-500 text-sm mt-1">{errors.classType.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input 
                  type="time"
                  {...register('startTime')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input 
                  type="time"
                  {...register('endTime')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select 
                  {...register('semester', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
                {errors.semester && <p className="text-red-500 text-sm mt-1">{errors.semester.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <input 
                  {...register('academicYear')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., 2024-25"
                />
                {errors.academicYear && <p className="text-red-500 text-sm mt-1">{errors.academicYear.message as any}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                <input 
                  type="number"
                  {...register('maxStudents', { 
                    setValueAs: (value) => value === '' ? null : Number(value)
                  })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
                <select 
                  {...register('isRecurring')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  type="date"
                  {...register('startDate')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  type="date"
                  {...register('endDate')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  {...register('notes')} 
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    {...register('isActive')} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : (editingClass ? 'Update Class' : 'Create Class')}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Schedule;
