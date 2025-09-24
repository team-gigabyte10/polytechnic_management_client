import React, { useState, useEffect } from 'react';
// framer-motion removed to disable hover animations
import { Plus, Search, Edit2, Trash2, Eye, UserCheck, DollarSign, Clock, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { GuestTeacher, Department, CreateGuestTeacherRequest, UpdateGuestTeacherRequest, TeachingSession, SalaryHistory, GuestTeacherStatistics } from '../types';
import { guestTeacherAPI, departmentAPI } from '../services/api';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().optional(),
  employeeId: yup.string().required('Employee ID is required'),
  phone: yup.string().required('Phone number is required'),
  qualification: yup.string().required('Qualification is required'),
  rate: yup.number().positive('Rate must be positive').required('Rate is required'),
  departmentId: yup.number().optional(),
  paymentType: yup.string().oneOf(['hourly', 'per_class', 'per_session', 'monthly']).required('Payment type is required'),
  address: yup.string().required('Address is required'),
});

type FormData = {
  name: string;
  email: string;
  password?: string;
  employeeId: string;
  phone: string;
  qualification: string;
  rate: number;
  departmentId?: number;
  paymentType: 'hourly' | 'per_class' | 'per_session' | 'monthly';
  address: string;
};

const GuestTeachers: React.FC = () => {
  const [guestTeachers, setGuestTeachers] = useState<GuestTeacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<GuestTeacher | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [teachingSessions, setTeachingSessions] = useState<TeachingSession[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [statistics, setStatistics] = useState<GuestTeacherStatistics | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [nextEmployeeId, setNextEmployeeId] = useState<string>('');
  const [filters, setFilters] = useState({
    departmentId: '',
    paymentType: '',
    isActive: '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
  });

  // Remove subjects watching since it's not in the new schema

  useEffect(() => {
    fetchGuestTeachers();
    fetchDepartments();
  }, [filters]);

  // Watch for changes in department to generate employee ID
  const watchedDepartmentId = watch('departmentId');

  useEffect(() => {
    if (showForm && !editingId && watchedDepartmentId) {
      generateNextEmployeeId(guestTeachers, watchedDepartmentId);
    }
  }, [watchedDepartmentId, showForm, editingId, guestTeachers]);

  // Update form employee ID when nextEmployeeId changes and we're creating a new guest teacher
  useEffect(() => {
    if (showForm && !editingId && nextEmployeeId) {
      // Update only the employee ID field
      reset({
        ...watch(),
        employeeId: nextEmployeeId,
      });
    }
  }, [nextEmployeeId, showForm, editingId, reset, watch]);

  const fetchGuestTeachers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filters.departmentId) params.departmentId = Number(filters.departmentId);
      if (filters.paymentType) params.paymentType = filters.paymentType;
      if (filters.isActive) params.isActive = filters.isActive === 'true';
      if (searchTerm) params.search = searchTerm;

      const response = await guestTeacherAPI.getAll(params);
      console.log('Raw API response structure:', {
        response: response?.data,
        data: response?.data?.data,
        guestTeachers: response?.data?.data?.guestTeachers,
        directData: response?.data
      });
      
      const teacherItems: GuestTeacher[] = response?.data?.data?.guestTeachers ?? response?.data?.data ?? response?.data ?? [];
      console.log('Parsed teacher items:', teacherItems);
      
      // Map teachers to include user name and handle missing fields
      const teachersWithUserNames = teacherItems.map((teacher: any) => ({
        ...teacher,
        name: teacher.user?.name || teacher.name || 'N/A',
        email: teacher.user?.email || teacher.email || 'N/A',
        phoneNumber: teacher.phoneNumber || teacher.phone || 'N/A',
        specialization: teacher.specialization || teacher.qualification || 'N/A',
        ratePerHour: teacher.ratePerHour || teacher.rate || 0,
        employeeId: teacher.employeeId || 'N/A',
        paymentType: teacher.paymentType || 'hourly',
        departmentId: teacher.departmentId || null,
        isActive: teacher.isActive !== undefined ? teacher.isActive : true,
        subjects: teacher.subjects || [],
        classes: teacher.classes || [],
        // Handle both camelCase and snake_case timestamp fields
        createdAt: teacher.createdAt || teacher.created_at || teacher.user?.createdAt || teacher.user?.created_at || new Date().toISOString(),
        updatedAt: teacher.updatedAt || teacher.updated_at || teacher.user?.updatedAt || teacher.user?.updated_at || new Date().toISOString(),
      }));
      
      setGuestTeachers(teachersWithUserNames);
    } catch (error: any) {
      console.error('Error fetching guest teachers:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to fetch guest teachers';
      
      // Check if it's a database column error
      if (errorMessage.includes('Unknown column') || errorMessage.includes('user.createdAt')) {
        toast.error('Database column naming issue detected. Backend should use snake_case (created_at) instead of camelCase (createdAt).');
        console.error('Database column naming error - backend is using camelCase but database uses snake_case');
        console.error('Expected: user.created_at, Got: user.createdAt');
      } else {
        toast.error(errorMessage);
      }
      
      // Set empty array on error to prevent UI issues
      setGuestTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const generateNextEmployeeId = (teacherList: GuestTeacher[], departmentId?: number) => {
    console.log('Generating next employee ID for guest teacher list:', teacherList, 'Department:', departmentId);
    
    // If no department provided, we can't generate a proper employee ID
    if (!departmentId) {
      console.log('Department not provided, cannot generate employee ID');
      setNextEmployeeId('');
      return;
    }

    // Get department code
    const department = departments.find(d => d.id === departmentId);
    if (!department) {
      console.log('Department not found, cannot generate employee ID');
      setNextEmployeeId('');
      return;
    }

    const deptCode = department.code;
    const empPrefix = `${deptCode}-GT-`;

    // Filter guest teachers by same department
    const sameDeptTeachers = teacherList.filter(t => t.departmentId === departmentId);

    console.log('Guest teachers in same department:', sameDeptTeachers);

    if (sameDeptTeachers.length === 0) {
      const nextEmployeeId = `${empPrefix}001`;
      console.log('No guest teachers found for this department, setting first employee ID:', nextEmployeeId);
      setNextEmployeeId(nextEmployeeId);
      return;
    }

    // Extract employee IDs for this department
    const employeeIds = sameDeptTeachers
      .map(t => t.employeeId)
      .filter(empId => empId && empId.startsWith(empPrefix))
      .map(empId => {
        const numberPart = empId.replace(empPrefix, '');
        return parseInt(numberPart);
      })
      .filter(num => !isNaN(num));

    console.log('Extracted employee IDs for', empPrefix, ':', employeeIds);

    if (employeeIds.length === 0) {
      const nextEmployeeId = `${empPrefix}001`;
      console.log('No valid employee IDs found for this department, setting first employee ID:', nextEmployeeId);
      setNextEmployeeId(nextEmployeeId);
      return;
    }

    const maxEmployeeId = Math.max(...employeeIds);
    const nextEmp = maxEmployeeId + 1;
    const nextEmployeeId = `${empPrefix}${nextEmp.toString().padStart(3, '0')}`;
    console.log('Max employee ID found:', maxEmployeeId, 'Next employee ID:', nextEmployeeId);
    setNextEmployeeId(nextEmployeeId);
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
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchTeacherDetails = async (teacher: GuestTeacher) => {
    try {
      setLoadingDetails(true);
      setSelectedTeacher(teacher);
      setShowDetails(true);

      // Fetch teaching sessions
      const sessionsRes = await guestTeacherAPI.getTeachingSessions(teacher.id);
      const sessions: TeachingSession[] = sessionsRes?.data?.data?.sessions ?? sessionsRes?.data?.data ?? sessionsRes?.data ?? [];
      setTeachingSessions(sessions);

      // Fetch salary history
      const salaryRes = await guestTeacherAPI.getSalaryHistory(teacher.id);
      const salaries: SalaryHistory[] = salaryRes?.data?.data?.salaries ?? salaryRes?.data?.data ?? salaryRes?.data ?? [];
      setSalaryHistory(salaries);

      // Get statistics
      if (teacher.statistics) {
        setStatistics(teacher.statistics);
      }
    } catch (error) {
      toast.error('Failed to fetch teacher details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // For new guest teachers, password is required
      if (!editingId && (!data.password || data.password.trim() === '')) {
        toast.error('Password is required for new guest teachers');
        return;
      }

      if (editingId) {
        const updatePayload: UpdateGuestTeacherRequest = {
          userData: {
            name: data.name,
            email: data.email,
            ...(data.password && data.password.trim() !== '' && { password: data.password }),
          },
          guestTeacherData: {
            employeeId: data.employeeId,
            phone: data.phone,
            qualification: data.qualification,
            rate: data.rate,
            departmentId: data.departmentId,
            paymentType: data.paymentType,
            address: data.address,
          },
        };
        console.log('Updating guest teacher with payload:', updatePayload);
        await guestTeacherAPI.update(editingId, updatePayload);
        toast.success('Guest teacher updated successfully');
      } else {
        // Use auto-generated employee ID for new guest teachers
        const employeeId = editingId ? data.employeeId : nextEmployeeId;

        const createPayload: CreateGuestTeacherRequest = {
          userData: {
            name: data.name,
            email: data.email,
            password: data.password!,
          },
          guestTeacherData: {
            employeeId: employeeId,
            phone: data.phone,
            qualification: data.qualification,
            rate: data.rate,
            departmentId: data.departmentId,
            paymentType: data.paymentType,
            address: data.address,
          },
        };
        console.log('Creating guest teacher with payload:', createPayload);
        await guestTeacherAPI.create(createPayload);
        toast.success('Guest teacher added successfully');
      }
      
      setShowForm(false);
      setEditingId(null);
      reset();
      fetchGuestTeachers();
    } catch (error: any) {
      console.error('Guest teacher operation error:', error);
      const errorMessage = error?.response?.data?.message || 'Operation failed';
      
      // Check for specific database errors
      if (errorMessage.includes('Unknown column') || errorMessage.includes('user.createdAt')) {
        toast.error('Database column naming issue detected. Backend should use snake_case (created_at) instead of camelCase (createdAt).');
        console.error('Database column naming error - backend is using camelCase but database uses snake_case');
      } else if (errorMessage.includes('Validation error')) {
        toast.error(`Validation error: ${errorMessage}`);
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        toast.error('A guest teacher with this email or employee ID already exists.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleEdit = (guestTeacher: GuestTeacher) => {
    setEditingId(guestTeacher.id);
    reset({
      name: guestTeacher.name,
      email: guestTeacher.email,
      password: '', // Don't pre-fill password for security
      employeeId: guestTeacher.employeeId,
      phone: guestTeacher.phoneNumber,
      qualification: guestTeacher.specialization, // Map specialization to qualification
      rate: guestTeacher.ratePerHour, // Map ratePerHour to rate
      departmentId: guestTeacher.departmentId,
      paymentType: guestTeacher.paymentType,
      address: '', // Address not in current GuestTeacher interface, will be empty
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this guest teacher?')) {
      try {
        await guestTeacherAPI.delete(id);
        toast.success('Guest teacher deleted successfully');
        fetchGuestTeachers();
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Failed to delete guest teacher';
        toast.error(message);
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      departmentId: '',
      paymentType: '',
      isActive: '',
    });
    setSearchTerm('');
  };

  const filteredGuestTeachers = guestTeachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Removed subjects since they're not in the API payload

  const getDepartmentName = (departmentId?: number) => {
    if (!departmentId) return 'Not assigned';
    const dept = departments.find(d => d.id === departmentId);
    return dept ? `${dept.name} (${dept.code})` : `Dept ${departmentId}`;
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'hourly': return 'bg-blue-100 text-blue-800';
      case 'per_class': return 'bg-green-100 text-green-800';
      case 'per_session': return 'bg-yellow-100 text-yellow-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guest Teachers</h1>
          <p className="text-gray-600">Manage guest teachers, their assignments, and payments</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            reset();
          }}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Guest Teacher</span>
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
            <select
              value={filters.paymentType}
              onChange={(e) => handleFilterChange('paymentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="hourly">Hourly</option>
              <option value="per_class">Per Class</option>
              <option value="per_session">Per Session</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
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

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search guest teachers..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Guest Teacher' : 'Add Guest Teacher'}
              </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    reset();
                  }}
                  className="p-2 text-gray-400 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      {...register('name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {editingId ? <span className="text-gray-500 text-xs">(optional - leave blank to keep current)</span> : <span className="text-red-500 text-xs">*</span>}
                    </label>
                    <input
                      {...register('password')}
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={editingId ? "Enter new password (optional)" : "Enter password (required)"}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                    {!editingId && (
                      <p className="text-xs text-gray-600 mt-1">Password is required for new guest teachers</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID {!editingId && <span className="text-gray-500 text-xs">(auto-generated)</span>}
                    </label>
                    <input
                      {...register('employeeId')}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !editingId ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="e.g., CSE-GT-001"
                      readOnly={!editingId}
                    />
                    {errors.employeeId && (
                      <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>
                    )}
                    {!editingId && (
                      <p className="text-xs text-gray-600 mt-1">Employee ID is automatically generated based on department</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      {...register('phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate (৳) *
                    </label>
                    <input
                      {...register('rate')}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.rate && (
                      <p className="text-red-500 text-sm mt-1">{errors.rate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      {...register('departmentId', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {errors.departmentId && (
                      <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Type *
                    </label>
                    <select
                      {...register('paymentType')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="per_class">Per Class</option>
                      <option value="per_session">Per Session</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    {errors.paymentType && (
                      <p className="text-red-500 text-sm mt-1">{errors.paymentType.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification *
                  </label>
                  <input
                    {...register('qualification')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., PhD Computer Science, MSc Mathematics"
                  />
                  {errors.qualification && (
                    <p className="text-red-500 text-sm mt-1">{errors.qualification.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full address"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      reset();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {isSubmitting ? <LoadingSpinner size="sm" /> : editingId ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Details Modal */}
      {showDetails && selectedTeacher && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Guest Teacher Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 text-gray-400 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Teacher Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedTeacher.name}</p>
                        <p><span className="font-medium">Email:</span> {selectedTeacher.email}</p>
                        <p><span className="font-medium">Employee ID:</span> {selectedTeacher.employeeId}</p>
                        <p><span className="font-medium">Phone:</span> {selectedTeacher.phoneNumber}</p>
                        <p><span className="font-medium">Specialization:</span> {selectedTeacher.specialization}</p>
                        <p><span className="font-medium">Department:</span> {getDepartmentName(selectedTeacher.departmentId)}</p>
                        <p><span className="font-medium">Rate:</span> {formatCurrency(selectedTeacher.ratePerHour)}/hour</p>
                        <p><span className="font-medium">Payment Type:</span> 
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentTypeColor(selectedTeacher.paymentType)}`}>
                            {selectedTeacher.paymentType}
                          </span>
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
                      {statistics ? (
                        <div className="space-y-2">
                          <p><span className="font-medium">Total Hours:</span> {statistics.totalHours}</p>
                          <p><span className="font-medium">Total Sessions:</span> {statistics.totalSessions}</p>
                          <p><span className="font-medium">Total Earnings:</span> {formatCurrency(statistics.totalEarnings)}</p>
                          <p><span className="font-medium">Avg Session Duration:</span> {statistics.averageSessionDuration} min</p>
                          <p><span className="font-medium">Current Month Hours:</span> {statistics.currentMonthHours}</p>
                          <p><span className="font-medium">Current Month Earnings:</span> {formatCurrency(statistics.currentMonthEarnings)}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No statistics available</p>
                      )}
                    </Card>
                  </div>

                  {/* Teaching Sessions */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Teaching Sessions</h3>
                    {teachingSessions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {teachingSessions.slice(0, 10).map((session) => (
                              <tr key={session.id}>
                                <td className="px-4 py-2 text-sm">{formatDate(session.sessionDate)}</td>
                                <td className="px-4 py-2 text-sm">{session.startTime} - {session.endTime}</td>
                                <td className="px-4 py-2 text-sm">{session.duration} min</td>
                                <td className="px-4 py-2 text-sm">{formatCurrency(session.amount)}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {session.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No teaching sessions found</p>
                    )}
                  </Card>

                  {/* Salary History */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Salary History</h3>
                    {salaryHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {salaryHistory.slice(0, 10).map((salary) => (
                              <tr key={salary.id}>
                                <td className="px-4 py-2 text-sm">{formatDate(salary.paymentDate)}</td>
                                <td className="px-4 py-2 text-sm">{formatCurrency(salary.amount)}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentTypeColor(salary.paymentType)}`}>
                                    {salary.paymentType}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm">{salary.period}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    salary.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    salary.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {salary.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No salary history found</p>
                    )}
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guest Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuestTeachers.map((teacher) => (
          <div key={teacher.id}>
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.specialization}</p>
                    <p className="text-xs text-gray-500">{teacher.employeeId}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => fetchTeacherDetails(teacher)}
                    className="p-2 text-green-600 rounded-lg"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="p-2 text-blue-600 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="p-2 text-red-600 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {teacher.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {teacher.phoneNumber}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Rate:</span> {formatCurrency(teacher.ratePerHour || 0)}/hour
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Department:</span> {getDepartmentName(teacher.departmentId)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Payment:</span> 
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentTypeColor(teacher.paymentType)}`}>
                    {teacher.paymentType}
                  </span>
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Specialization:</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {teacher.specialization}
                    </span>
                </div>
              </div>

              {teacher.statistics && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{teacher.statistics.totalHours}h</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <span>{formatCurrency(teacher.statistics.totalEarnings)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>

      {filteredGuestTeachers.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guest Teachers Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.values(filters).some(f => f) ? 'No guest teachers match your search criteria.' : 'Start by adding your first guest teacher.'}
          </p>
          {!searchTerm && !Object.values(filters).some(f => f) && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                reset();
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              Add Guest Teacher
            </button>
          )}
        </Card>
      )}
    </div>
  );
};

export default GuestTeachers;