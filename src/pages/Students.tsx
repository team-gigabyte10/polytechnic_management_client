import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { studentAPI } from '../services/api';
import { Student } from '../types';

const schema = yup.object({
  rollNumber: yup.string().required('Roll Number is required'),
  departmentId: yup.number().typeError('Department is required').required('Department is required'),
  courseId: yup.number().typeError('Course is required').required('Course is required'),
  semester: yup.number().typeError('Semester is required').min(1, 'Semester must be at least 1').max(8, 'Semester cannot exceed 8').required('Semester is required'),
  admissionYear: yup.number().typeError('Admission Year is required').min(2020, 'Admission Year must be at least 2020').max(2030, 'Admission Year cannot exceed 2030').required('Admission Year is required'),
  guardianName: yup.string().required('Guardian Name is required'),
  guardianPhone: yup.string().required('Guardian Phone is required'),
  address: yup.string().required('Address is required'),
});

type FormValues = {
  rollNumber: string;
  departmentId: number;
  courseId: number;
  semester: number;
  admissionYear: number;
  guardianName: string;
  guardianPhone: string;
  address: string;
};

const Students: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchStudents = async () => {
    try {
      setIsLoadingList(true);
      const res = await studentAPI.getAll();
      const studentItems: any[] = res?.data?.data?.students ?? res?.data?.data ?? res?.data ?? [];
      setStudents(studentItems);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load students');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      rollNumber: '',
      departmentId: undefined as unknown as number,
      courseId: undefined as unknown as number,
      semester: 1,
      admissionYear: new Date().getFullYear(),
      guardianName: '',
      guardianPhone: '',
      address: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      studentData: {
        rollNumber: values.rollNumber,
        departmentId: Number(values.departmentId),
        courseId: Number(values.courseId),
        semester: Number(values.semester),
        admissionYear: Number(values.admissionYear),
        guardianName: values.guardianName,
        guardianPhone: values.guardianPhone,
        address: values.address,
      },
    };

    try {
      if (editingStudent) {
        await studentAPI.update(editingStudent.id, payload);
        toast.success('Student updated successfully');
        setEditingStudent(null);
      } else {
        await studentAPI.create(payload);
        toast.success('Student created successfully');
      }
      reset();
      setShowForm(false);
      fetchStudents();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save student';
      toast.error(message);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
    reset({
      rollNumber: student.rollNumber,
      departmentId: student.departmentId,
      courseId: student.courseId,
      semester: student.semester,
      admissionYear: student.admissionYear,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      address: student.address,
    });
  };

  const handleDelete = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      setIsDeleting(studentId);
      await studentAPI.delete(studentId);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete student';
      toast.error(message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{student.rollNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.departmentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.courseId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.semester}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.admissionYear}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.guardianName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.guardianPhone}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.address}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            disabled={isDeleting === student.id}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Delete Student"
                          >
                            {isDeleting === student.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={9}>No students found</td>
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
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input 
                  {...register('rollNumber')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., CSE-2025-001"
                />
                {errors.rollNumber && <p className="text-red-500 text-sm mt-1">{errors.rollNumber.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department ID</label>
                <input 
                  type="number" 
                  {...register('departmentId', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="1"
                />
                {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course ID</label>
                <input 
                  type="number" 
                  {...register('courseId', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="1"
                />
                {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select 
                  {...register('semester', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
                {errors.semester && <p className="text-red-500 text-sm mt-1">{errors.semester.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Year</label>
                <input 
                  type="number" 
                  {...register('admissionYear', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="2025"
                />
                {errors.admissionYear && <p className="text-red-500 text-sm mt-1">{errors.admissionYear.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                <input 
                  {...register('guardianName')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Guardian Name"
                />
                {errors.guardianName && <p className="text-red-500 text-sm mt-1">{errors.guardianName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                <input 
                  {...register('guardianPhone')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="0123456789"
                />
                {errors.guardianPhone && <p className="text-red-500 text-sm mt-1">{errors.guardianPhone.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea 
                  {...register('address')} 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Student Address"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
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
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : (editingStudent ? 'Update Student' : 'Create Student')}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Students;
