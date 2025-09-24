import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { departmentAPI, teacherAPI } from '../services/api';
import { Department } from '../types';

const schema = yup.object().shape({
  name: yup.string().required('Department name is required'),
  code: yup.string().required('Department code is required').max(10, 'Code must be 10 characters or less'),
  headId: yup.number().transform((value, originalValue) => {
    return originalValue === '' ? undefined : value;
  }).optional(),
});



const Departments: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchDepartments = async () => {
    try {
      setIsLoadingList(true);
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
          // Add head information if available
          head: dept.head ? {
            id: dept.head.id,
            employeeId: dept.head.employeeId,
            name: dept.head.user?.name,
            email: dept.head.user?.email
          } : undefined
        }));
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
      
      if (departmentItems.length > 0) {
        toast.success(`Loaded ${departmentItems.length} department(s)`);
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      toast.error(error?.response?.data?.message || 'Failed to load departments');
      setDepartments([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setIsLoadingTeachers(true);
      console.log('Fetching teachers...');
      const res = await teacherAPI.getAll();
      console.log('Teachers API response:', res);
      
      // Handle the teachers response structure
      let teacherItems: any[] = [];
      
      if (res?.data?.data?.teachers && Array.isArray(res.data.data.teachers)) {
        teacherItems = res.data.data.teachers.map((teacher: any) => ({
          id: teacher.id,
          name: teacher.user?.name || teacher.name,
          employeeId: teacher.employeeId,
          email: teacher.user?.email || teacher.email,
          department: teacher.department?.name,
          designation: teacher.designation
        }));
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        teacherItems = res.data.data;
      } else if (res?.data && Array.isArray(res.data)) {
        teacherItems = res.data;
      } else {
        console.error('Unexpected teachers response structure:', res);
        teacherItems = [];
      }
      
      console.log('Parsed teacher items:', teacherItems);
      setTeachers(teacherItems);
      
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      toast.error(error?.response?.data?.message || 'Failed to load teachers');
      setTeachers([]);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchTeachers();
  }, []);

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowForm(true);
    reset({
      name: department.name,
      code: department.code,
      headId: department.headId || undefined,
    });
  };

  const handleDelete = async (departmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(departmentId);
      await departmentAPI.delete(departmentId);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete department';
      toast.error(message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDepartment(null);
    reset();
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      headId: undefined,
    },
  });

  const onSubmit = async (values: any) => {
    const payload = {
      name: values.name,
      code: values.code.toUpperCase(),
      ...(values.headId && { headId: Number(values.headId) }),
    };

    try {
      if (editingDepartment) {
        await departmentAPI.update(editingDepartment.id, payload);
        toast.success('Department updated successfully');
        setEditingDepartment(null);
      } else {
        await departmentAPI.create(payload);
        toast.success('Department created successfully');
      }
      reset();
      setShowForm(false);
      fetchDepartments();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save department';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Department
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Department Head</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {departments.map((dept, index) => (
                    <tr key={dept.id} className="odd:bg-gray-50 hover:bg-indigo-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{dept.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {dept.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {dept.head ? (
                          <div>
                            <div className="font-medium text-gray-900">{dept.head.name}</div>
                            <div className="text-xs text-gray-500">ID: {dept.head.employeeId}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No head assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(dept)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded"
                            title="Edit Department"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
                            disabled={isDeleting === dept.id}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded disabled:opacity-50"
                            title="Delete Department"
                          >
                            {isDeleting === dept.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={6}>
                        No departments found. Create your first department!
                      </td>
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
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
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
              <strong>Info:</strong> Create departments that teachers can be assigned to. 
              The department code should be a short abbreviation (e.g., "CSE", "EEE").
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input 
                  {...register('name')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., Computer Science & Engineering"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                <input 
                  {...register('code')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., CSE"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Head (Optional)</label>
                <select 
                  {...register('headId')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingTeachers}
                >
                  <option value="">Select a teacher as department head</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.employeeId}) - {teacher.designation || 'Teacher'}
                    </option>
                  ))}
                </select>
                {isLoadingTeachers && (
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <LoadingSpinner size="sm" />
                    Loading teachers...
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Select a teacher to head this department</p>
                {errors.headId && <p className="text-red-500 text-sm mt-1">{errors.headId.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {editingDepartment ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {editingDepartment ? 'Update Department' : 'Create Department'}
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Departments;
