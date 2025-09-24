import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, Users, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { Subject, Department, CreateSubjectRequest, UpdateSubjectRequest } from '../types';
import { subjectAPI, departmentAPI } from '../services/api';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().required('Subject name is required'),
  code: yup.string().required('Subject code is required'),
  departmentId: yup.number().typeError('Department is required').required('Department is required'),
  semester: yup.number().min(1, 'Semester must be at least 1').max(8, 'Semester must be at most 8').required('Semester is required'),
  credits: yup.number().min(1, 'Credits must be at least 1').max(10, 'Credits must be at most 10').required('Credits is required'),
  theoryHours: yup.number().min(0, 'Theory hours cannot be negative').required('Theory hours is required'),
  practicalHours: yup.number().min(0, 'Practical hours cannot be negative').required('Practical hours is required'),
  // description removed
});

type FormData = {
  name: string;
  code: string;
  departmentId: number;
  semester: number;
  credits: number;
  theoryHours: number;
  practicalHours: number;
};

const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  // Removed departments state (unused after UI simplification)
  // departments state removed
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    departmentId: '',
    semester: '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      code: '',
      departmentId: undefined as unknown as number,
      semester: 1,
      credits: 3,
      theoryHours: 3,
      practicalHours: 1,
      
    },
  });

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filters.departmentId) params.departmentId = Number(filters.departmentId);
      if (filters.semester) params.semester = Number(filters.semester);
      if (searchTerm) params.search = searchTerm;

      const response = await subjectAPI.getAll(params);
      const subjectItems: Subject[] = response?.data?.data?.subjects ?? response?.data?.data ?? response?.data ?? [];
      setSubjects(subjectItems);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to fetch subjects';
      toast.error(errorMessage);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentAPI.getAll();
      let items: Department[] = [];
      if (res?.data?.data?.departments && Array.isArray(res.data.data.departments)) {
        items = res.data.data.departments;
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        items = res.data.data;
      } else if (res?.data && Array.isArray(res.data)) {
        items = res.data;
      }
      setDepartments(items);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  // Removed fetchDepartments (no longer used)

  const onSubmit = async (data: FormData) => {
    try {
      const rawDeptId = (data as any).departmentId;
      const effectiveDepartmentId = (typeof rawDeptId === 'number' && !Number.isNaN(rawDeptId))
        ? rawDeptId
        : (filters.departmentId ? Number(filters.departmentId) : undefined);
      if (effectiveDepartmentId === undefined) {
        toast.error('Department is required');
        return;
      }
      const payload: UpdateSubjectRequest = {
        name: data.name,
        code: data.code,
        departmentId: effectiveDepartmentId,
        semester: data.semester,
        credits: data.credits,
        theoryHours: data.theoryHours,
        practicalHours: data.practicalHours,
      };

      if (editingId) {
        await subjectAPI.update(editingId, payload);
        toast.success('Subject updated successfully');
      } else {
        const createPayload: CreateSubjectRequest = payload as unknown as CreateSubjectRequest;
        await subjectAPI.create(createPayload);
        toast.success('Subject created successfully');
      }
      
      setShowForm(false);
      setEditingId(null);
      reset();
      fetchSubjects();
    } catch (error: any) {
      console.error('Subject operation error:', error);
      const errorMessage = error?.response?.data?.message || 'Operation failed';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setShowForm(true);
    const deptId = (subject as any).departmentId ?? (subject as any).department_id ?? subject.departmentId;
    reset({
      name: subject.name,
      code: subject.code,
      departmentId: deptId,
      semester: subject.semester,
      credits: subject.credits,
      theoryHours: subject.theoryHours,
      practicalHours: subject.practicalHours,
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    try {
      setIsDeleting(id);
      await subjectAPI.delete(id);
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete subject';
      toast.error(message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  const handleShowForm = () => {
    setEditingId(null);
    setShowForm(true);
    reset({
      name: '',
      code: '',
      departmentId: (filters.departmentId ? Number(filters.departmentId) : (undefined as unknown as number)),
      semester: 1,
      credits: 3,
      theoryHours: 3,
      practicalHours: 1,
    });
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
      semester: '',
    });
    setSearchTerm('');
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentName = (departmentId: number) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? `${dept.name} (${dept.code})` : `Dept ${departmentId}`;
  };

  // Removed unused getDepartmentName helper to avoid linter warning

  const getTotalHours = (theoryHours: number, practicalHours: number) => {
    return theoryHours + practicalHours;
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
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600">Manage subjects and their course assignments</p>
        </div>
        <button
          onClick={handleShowForm}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={(filters as any).departmentId}
              onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
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

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search subjects..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Edit Subject' : 'Add New Subject'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name *
                    </label>
                    <input
                      {...register('name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Data Structures"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Code *
                    </label>
                    <input
                      {...register('code')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., CS201"
                    />
                    {errors.code && (
                      <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
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
                    {(errors as any).departmentId && (
                      <p className="text-red-500 text-sm mt-1">{(errors as any).departmentId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester *
                    </label>
                    <select
                      {...register('semester', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                    {errors.semester && (
                      <p className="text-red-500 text-sm mt-1">{errors.semester.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credits *
                    </label>
                    <input
                      {...register('credits')}
                      type="number"
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.credits && (
                      <p className="text-red-500 text-sm mt-1">{errors.credits.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theory Hours *
                    </label>
                    <input
                      {...register('theoryHours')}
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.theoryHours && (
                      <p className="text-red-500 text-sm mt-1">{errors.theoryHours.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Practical Hours *
                    </label>
                    <input
                      {...register('practicalHours')}
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.practicalHours && (
                      <p className="text-red-500 text-sm mt-1">{errors.practicalHours.message}</p>
                    )}
                  </div>
                </div>

                

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {isSubmitting ? <LoadingSpinner size="sm" /> : (editingId ? 'Update Subject' : 'Create Subject')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Table */}
      <Card className="p-4 md:p-6" hover={false}>
        <div className="overflow-x-auto rounded-xl shadow ring-1 ring-gray-200/60">
          <table className="min-w-full">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">SL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Semester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Credits</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSubjects.map((subject, index) => (
                <tr key={subject.id} className="odd:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-gray-500 text-xs">{subject.code}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{getDepartmentName(((subject as any).departmentId ?? (subject as any).department_id ?? subject.departmentId) as number)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Sem {subject.semester}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {subject.credits} Credits
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-blue-600" />
                        <span className="text-xs">{subject.theoryHours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-green-600" />
                        <span className="text-xs">{subject.practicalHours}h</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        ({getTotalHours(subject.theoryHours, subject.practicalHours)}h total)
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="p-1 text-indigo-600 rounded"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        disabled={isDeleting === subject.id}
                        className="p-1 text-rose-600 rounded disabled:opacity-50"
                        title="Delete Subject"
                      >
                        {isDeleting === subject.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSubjects.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={7}>No subjects found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Subjects;
