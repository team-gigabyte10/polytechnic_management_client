import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Edit, Trash2, X } from 'lucide-react';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { teacherAPI, departmentAPI } from '../services/api';
import { CreateTeacherRequest, UpdateTeacherRequest, User, Department } from '../types';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().optional(),
  employeeId: yup.string().required('Employee ID is required'),
  departmentId: yup.number().typeError('Department is required').required('Department is required'),
  designation: yup.string().required('Designation is required'),
  qualification: yup.string().required('Qualification is required'),
  experienceYears: yup.number().typeError('Experience is required').min(0).required('Experience is required'),
  salary: yup.number().typeError('Salary is required').min(0).required('Salary is required'),
  joiningDate: yup.string().required('Joining date is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
});

type FormValues = {
  name: string;
  email: string;
  password?: string;
  employeeId: string;
  departmentId: number;
  designation: string;
  qualification: string;
  experienceYears: number;
  salary: number;
  joiningDate: string;
  phone: string;
  address: string;
};

const Teachers: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [nextEmployeeId, setNextEmployeeId] = useState<string>('');

  const fetchTeachers = async () => {
    try {
      setIsLoadingList(true);
             // Prefer dedicated teachers API to ensure we show teacher records
       const res = await teacherAPI.getAll();
       console.log('Raw teachers API response:', res);
       console.log('Response data structure:', res?.data);
       const teacherItems: any[] = res?.data?.data?.teachers ?? res?.data?.data ?? res?.data ?? [];
       console.log('Extracted teacher items:', teacherItems);
      // Normalize into User-like objects for rendering convenience
             const mapped: User[] = teacherItems.map((item: any) => {
         const user: User = item.user || item;
         // Attach teacherProfile-like shape if not present
         (user as any).teacherProfile = item.teacher || item.teacherProfile || {
           employeeId: item.employeeId,
           departmentId: item.departmentId,
           designation: item.designation,
           qualification: item.qualification,
           experienceYears: item.experienceYears,
           salary: item.salary || item.teacherProfile?.salary,
           joiningDate: item.joiningDate,
           phone: item.phone,
           address: item.address,
         };
         
         // Also attach salary directly to user object for easier access
         if (item.salary || item.teacherProfile?.salary) {
           (user as any).salary = item.salary || item.teacherProfile?.salary;
         }
         
         // Use teacher ID if available, otherwise use user ID
         // Try different possible ID fields
         const teacherId = item.id || item.teacher?.id || item.teacherId || user.id;
         (user as any).teacherId = teacherId;
         
         console.log('Mapped teacher:', { 
           user_id: user.id, 
           teacher_id: teacherId,
           name: user.name, 
           employeeId: (user as any).teacherProfile?.employeeId 
         });
         return user;
       });
       console.log('All mapped teachers:', mapped);
       setTeachers(mapped);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load teachers');
    } finally {
      setIsLoadingList(false);
    }
  };

  const generateNextEmployeeId = (teacherList: User[], departmentId?: number) => {
    console.log('Generating next employee ID for teacher list:', teacherList, 'Department:', departmentId);
    
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
    const empPrefix = `${deptCode}-EMP-`;

    // Filter teachers by same department
    const sameDeptTeachers = teacherList.filter(t => 
      (t as any).teacherProfile?.departmentId === departmentId
    );

    console.log('Teachers in same department:', sameDeptTeachers);

    if (sameDeptTeachers.length === 0) {
      const nextEmployeeId = `${empPrefix}001`;
      console.log('No teachers found for this department, setting first employee ID:', nextEmployeeId);
      setNextEmployeeId(nextEmployeeId);
      return;
    }

    // Extract employee IDs for this department
    const employeeIds = sameDeptTeachers
      .map(t => (t as any).teacherProfile?.employeeId)
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
      setIsLoadingDepartments(true);
      console.log('Fetching departments...');
      const res = await departmentAPI.getAll();
      console.log('Departments API response:', res);
      
      // Handle the specific API response structure: res.data.data.departments
      let departmentItems: Department[] = [];
      
      if (res?.data?.data?.departments && Array.isArray(res.data.data.departments)) {
        // Map the API response to our Department interface
        departmentItems = res.data.data.departments.map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          headId: dept.headId,
          createdAt: dept.created_at,
          updatedAt: dept.updated_at,
        }));
        console.log(`Successfully loaded ${departmentItems.length} departments from API`);
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        departmentItems = res.data.data;
      } else if (res?.data && Array.isArray(res.data)) {
        departmentItems = res.data;
      } else {
        console.error('Unexpected departments response structure:', res);
        departmentItems = [];
      }
      
      console.log('Parsed department items:', departmentItems);
      setDepartments(departmentItems);
      
      if (departmentItems.length === 0) {
        console.warn('No departments found in response');
        toast('No departments found. Please create departments first.', { icon: '⚠️' });
      } else {
        console.log(`Successfully loaded ${departmentItems.length} departments`);
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      console.error('Error response:', error?.response);
      toast.error('Could not load departments. Please check console for details.');
      setDepartments([]);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
  }, []);

  const handleEdit = (teacher: User) => {
    setEditingTeacher(teacher);
    setShowForm(true);
    reset({
      name: teacher.name,
      email: teacher.email,
      password: '', // Don't pre-fill password for security
      employeeId: (teacher as any).teacherProfile?.employeeId || '',
      departmentId: (teacher as any).teacherProfile?.departmentId || undefined,
      designation: (teacher as any).teacherProfile?.designation || '',
      qualification: (teacher as any).teacherProfile?.qualification || '',
      experienceYears: (teacher as any).teacherProfile?.experienceYears || 0,
      salary: (teacher as any).teacherProfile?.salary || 0,
      joiningDate: (teacher as any).teacherProfile?.joiningDate || '',
      phone: (teacher as any).teacherProfile?.phone || '',
      address: (teacher as any).teacherProfile?.address || '',
    });
  };

  const handleDelete = async (teacherId: number) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) {
      return;
    }

    try {
      setIsDeleting(teacherId);
      // Use teacherId if available, otherwise use the passed ID
      const actualTeacherId = (teachers.find(t => t.id === teacherId) as any)?.teacherId || teacherId;
      console.log('Attempting to delete teacher with ID:', actualTeacherId);
      await teacherAPI.delete(actualTeacherId);
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (error: any) {
      console.error('Delete teacher error:', error);
      console.error('Error response:', error?.response);
      const message = error?.response?.data?.message || 'Failed to delete teacher';
      toast.error(message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTeacher(null);
    reset();
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      employeeId: '',
      departmentId: undefined as unknown as number,
      designation: '',
      qualification: '',
      experienceYears: 0,
      salary: 0,
      joiningDate: '',
      phone: '',
      address: '',
    },
  });

  // Watch for changes in department to generate employee ID
  const watchedDepartmentId = watch('departmentId');

  useEffect(() => {
    if (showForm && !editingTeacher && watchedDepartmentId) {
      generateNextEmployeeId(teachers, watchedDepartmentId);
    }
  }, [watchedDepartmentId, showForm, editingTeacher, teachers]);

  // Update form employee ID when nextEmployeeId changes and we're creating a new teacher
  useEffect(() => {
    if (showForm && !editingTeacher && nextEmployeeId) {
      // Update only the employee ID field
      reset({
        ...watch(),
        employeeId: nextEmployeeId,
      });
    }
  }, [nextEmployeeId, showForm, editingTeacher, reset, watch]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingTeacher) {
        // For updates, only send changed fields
        const updatePayload: UpdateTeacherRequest = {};
        
        // Check if user data changed
        if (values.name !== editingTeacher.name || values.email !== editingTeacher.email || values.password) {
          updatePayload.userData = {};
          if (values.name !== editingTeacher.name) {
            updatePayload.userData.name = values.name;
          }
          if (values.email !== editingTeacher.email) {
            updatePayload.userData.email = values.email;
          }
          if (values.password && values.password.trim() !== '') {
            updatePayload.userData.password = values.password;
          }
        }
        
        // Check if teacher data changed
        const currentTeacherData = (editingTeacher as any).teacherProfile;
        if (values.employeeId !== currentTeacherData?.employeeId ||
            values.departmentId !== currentTeacherData?.departmentId ||
            values.designation !== currentTeacherData?.designation ||
            values.qualification !== currentTeacherData?.qualification ||
            values.experienceYears !== currentTeacherData?.experienceYears ||
            values.salary !== currentTeacherData?.salary ||
            values.joiningDate !== currentTeacherData?.joiningDate ||
            values.phone !== currentTeacherData?.phone ||
            values.address !== currentTeacherData?.address) {
          
          updatePayload.teacherData = {};
          if (values.employeeId !== currentTeacherData?.employeeId) {
            updatePayload.teacherData.employeeId = values.employeeId;
          }
          if (values.departmentId !== currentTeacherData?.departmentId) {
            updatePayload.teacherData.departmentId = Number(values.departmentId);
          }
          if (values.designation !== currentTeacherData?.designation) {
            updatePayload.teacherData.designation = values.designation;
          }
          if (values.qualification !== currentTeacherData?.qualification) {
            updatePayload.teacherData.qualification = values.qualification;
          }
          if (values.experienceYears !== currentTeacherData?.experienceYears) {
            updatePayload.teacherData.experienceYears = Number(values.experienceYears);
          }
          if (values.salary !== currentTeacherData?.salary) {
            updatePayload.teacherData.salary = Number(values.salary);
          }
          if (values.joiningDate !== currentTeacherData?.joiningDate) {
            updatePayload.teacherData.joiningDate = values.joiningDate;
          }
          if (values.phone !== currentTeacherData?.phone) {
            updatePayload.teacherData.phone = values.phone;
          }
          if (values.address !== currentTeacherData?.address) {
            updatePayload.teacherData.address = values.address;
          }
        }
        
                 // Use teacherId if available, otherwise use the user ID
         const actualTeacherId = (editingTeacher as any)?.teacherId || editingTeacher.id;
         console.log('Attempting to update teacher with ID:', actualTeacherId);
         console.log('Update payload:', updatePayload);
         await teacherAPI.update(actualTeacherId, updatePayload);
         toast.success('Teacher updated successfully');
         setEditingTeacher(null);
      } else {
        // For creation, password is required
        if (!values.password || values.password.trim() === '') {
          toast.error('Password is required when creating a new teacher');
          return;
        }
        
        // Use auto-generated employee ID for new teachers
        const employeeId = editingTeacher ? values.employeeId : nextEmployeeId;

        const createPayload: CreateTeacherRequest = {
          userData: {
            name: values.name,
            email: values.email,
            password: values.password,
            role: 'teacher',
          },
          teacherData: {
            employeeId: employeeId,
            departmentId: Number(values.departmentId),
            designation: values.designation,
            qualification: values.qualification,
            experienceYears: Number(values.experienceYears),
            salary: Number(values.salary),
            joiningDate: values.joiningDate,
            phone: values.phone,
            address: values.address,
          },
        };
        await teacherAPI.create(createPayload);
        toast.success('Teacher created successfully');
      }
      reset();
      setShowForm(false);
      fetchTeachers();
         } catch (error: any) {
       console.error('Save teacher error:', error);
       console.error('Error response:', error?.response);
       const message = error?.response?.data?.message || 'Failed to save teacher';
       toast.error(message);
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700"
          >
            Add Teacher
          </button>
        )}
      </div>

      {!showForm && (
        <Card className="p-4 md:p-6" hover={false}>
          {isLoadingList ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow ring-1 ring-gray-200/60">
              <table className="min-w-full">
                <thead className="bg-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">SL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Salary (৳)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Joining Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {teachers.map((t, index) => (
                    <tr key={t.id} className="odd:bg-gray-50 hover:bg-indigo-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{t.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.employeeId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.department || (t as any).teacherProfile?.departmentId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.designation || (t as any).teacherProfile?.specialization || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.phone || (t as any).teacherProfile?.phoneNumber || '-'}</td>
                                             <td className="px-4 py-3 text-sm text-gray-700">
                         {(t as any).teacherProfile?.salary ? 
                           `৳${Number((t as any).teacherProfile.salary).toLocaleString()}` : 
                           '-'
                         }
                       </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.joiningDate ? new Date((t as any).teacherProfile?.joiningDate).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded"
                            title="Edit Teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={isDeleting === t.id}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded disabled:opacity-50"
                            title="Delete Teacher"
                          >
                            {isDeleting === t.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={10}>No teachers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showForm && (
                 <Card className="p-4 md:p-6" hover={false}>
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-semibold text-gray-900">
               {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
             </h2>
             <button
               onClick={handleCancel}
               className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
           <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
             <p className="text-sm text-blue-800">
               <strong>Note:</strong> If you get an "invalid reference to another resource" error, create departments first using these commands:
               <br />
               <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 block">
                 curl -X POST "http://localhost:3000/api/departments" -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d '{`{"name": "Computer Science", "code": "CSE"}`}'
               </code>
             </p>
           </div>
           <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" {...register('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingTeacher && <span className="text-gray-500 text-sm">(optional for updates)</span>}
              </label>
              <input 
                type="password" 
                {...register('password')} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder={editingTeacher ? "Leave blank to keep current password" : "Enter password"}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              {editingTeacher && (
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current password unchanged</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID {!editingTeacher && <span className="text-gray-500 text-xs">(auto-generated)</span>}
              </label>
              <input 
                {...register('employeeId')} 
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !editingTeacher ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="e.g., CSE-EMP-001"
                readOnly={!editingTeacher}
              />
              {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>}
              {!editingTeacher && (
                <p className="text-xs text-gray-600 mt-1">Employee ID is automatically generated based on department</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select 
                {...register('departmentId', { valueAsNumber: true })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingDepartments}
              >
                <option value="">Select Department</option>
                {Array.isArray(departments) && departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.id} - {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {isLoadingDepartments && (
                <p className="text-xs text-blue-600 mt-1">Loading departments...</p>
              )}
              {!isLoadingDepartments && Array.isArray(departments) && departments.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No departments available. Please contact administrator.</p>
              )}
              {!isLoadingDepartments && Array.isArray(departments) && departments.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">Select the department for this teacher.</p>
              )}
              {!isLoadingDepartments && !Array.isArray(departments) && (
                <p className="text-xs text-red-600 mt-1">Error loading departments. Please refresh the page.</p>
              )}
              {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input {...register('designation')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input {...register('qualification')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.qualification && <p className="text-red-500 text-sm mt-1">{errors.qualification.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
              <input type="number" {...register('experienceYears', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.experienceYears && <p className="text-red-500 text-sm mt-1">{errors.experienceYears.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary (৳)</label>
              <input type="number" {...register('salary', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
              <input type="date" {...register('joiningDate')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.joiningDate && <p className="text-red-500 text-sm mt-1">{errors.joiningDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input {...register('address')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
                         <button
               type="submit"
               disabled={isSubmitting}
               className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
             >
               {isSubmitting ? <LoadingSpinner size="sm" /> : (editingTeacher ? 'Update Teacher' : 'Create Teacher')}
             </button>
          </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Teachers;


