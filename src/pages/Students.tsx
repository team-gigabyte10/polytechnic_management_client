import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { studentAPI, departmentAPI } from '../services/api';
import { Student, Department } from '../types';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().optional(),
  rollNumber: yup.string().required('Roll Number is required'),
  departmentId: yup.number().typeError('Department is required').required('Department is required'),
  semester: yup.number().typeError('Semester is required').min(1, 'Semester must be at least 1').max(8, 'Semester cannot exceed 8').required('Semester is required'),
  admissionYear: yup.number().typeError('Admission Year is required').min(2020, 'Admission Year must be at least 2020').max(2030, 'Admission Year cannot exceed 2030').required('Admission Year is required'),
  guardianName: yup.string().optional(),
  guardianPhone: yup.string().optional(),
  phone: yup.string().required('Phone is required'),
  additionalPhone: yup.string().optional(),
  address: yup.string().optional(),
});

type FormValues = {
  name: string;
  email: string;
  password?: string;
  rollNumber: string;
  departmentId: number;
  semester: number;
  admissionYear: number;
  guardianName?: string;
  guardianPhone?: string;
  phone: string;
  additionalPhone?: string;
  address?: string;
};

const Students: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [nextRollNumber, setNextRollNumber] = useState<string>('');

  const fetchStudents = async () => {
    try {
      setIsLoadingList(true);
      const res = await studentAPI.getAll();
      const studentItems: any[] = res?.data?.data?.students ?? res?.data?.data ?? res?.data ?? [];
      
      // Map students to include user name and email
      const studentsWithUserNames = studentItems.map((student: any) => ({
        ...student,
        name: student.user?.name || student.name || 'N/A',
        email: student.user?.email || student.email || ''
      }));
      
      setStudents(studentsWithUserNames);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load students');
    } finally {
      setIsLoadingList(false);
    }
  };

  const generateNextRollNumber = (studentList: Student[], departmentId?: number, admissionYear?: number) => {
    console.log('Generating next roll number for student list:', studentList, 'Department:', departmentId, 'Year:', admissionYear);
    
    // If no department or year provided, we can't generate a proper roll number
    if (!departmentId || !admissionYear) {
      console.log('Department or admission year not provided, cannot generate roll number');
      setNextRollNumber('');
      return;
    }

    // Get department code
    const department = departments.find(d => d.id === departmentId);
    if (!department) {
      console.log('Department not found, cannot generate roll number');
      setNextRollNumber('');
      return;
    }

    const deptCode = department.code;
    const year = admissionYear.toString();
    const rollPrefix = `${deptCode}-${year}-`;

    // Filter students by same department and year
    const sameDeptYearStudents = studentList.filter(s => 
      s.departmentId === departmentId && s.admissionYear === admissionYear
    );

    console.log('Students in same department and year:', sameDeptYearStudents);

    if (sameDeptYearStudents.length === 0) {
      const nextRollNumber = `${rollPrefix}01`;
      console.log('No students found for this department/year, setting first roll number:', nextRollNumber);
      setNextRollNumber(nextRollNumber);
      return;
    }

    // Extract roll numbers for this department and year
    const rollNumbers = sameDeptYearStudents
      .map(s => s.rollNumber)
      .filter(roll => roll && roll.startsWith(rollPrefix))
      .map(roll => {
        const numberPart = roll.replace(rollPrefix, '');
        return parseInt(numberPart);
      })
      .filter(num => !isNaN(num));

    console.log('Extracted roll numbers for', rollPrefix, ':', rollNumbers);

    if (rollNumbers.length === 0) {
      const nextRollNumber = `${rollPrefix}01`;
      console.log('No valid roll numbers found for this department/year, setting first roll number:', nextRollNumber);
      setNextRollNumber(nextRollNumber);
      return;
    }

    const maxRollNumber = Math.max(...rollNumbers);
    const nextRoll = maxRollNumber + 1;
    const nextRollNumber = `${rollPrefix}${nextRoll.toString().padStart(2, '0')}`;
    console.log('Max roll number found:', maxRollNumber, 'Next roll number:', nextRollNumber);
    setNextRollNumber(nextRollNumber);
  };

  const fetchDepartments = async () => {
    try {
      setIsLoadingDepartments(true);
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
      setIsLoadingDepartments(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

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
      rollNumber: '',
      departmentId: undefined as unknown as number,
      semester: 1,
      admissionYear: new Date().getFullYear(),
      guardianName: '',
      guardianPhone: '',
      phone: '',
      additionalPhone: '',
      address: '',
    },
  });

  // Watch for changes in department and admission year to generate roll number
  const watchedDepartmentId = watch('departmentId');
  const watchedAdmissionYear = watch('admissionYear');

  useEffect(() => {
    if (showForm && !editingStudent && watchedDepartmentId && watchedAdmissionYear) {
      generateNextRollNumber(students, watchedDepartmentId, watchedAdmissionYear);
    }
  }, [watchedDepartmentId, watchedAdmissionYear, showForm, editingStudent, students]);

  // Update form roll number when nextRollNumber changes and we're creating a new student
  useEffect(() => {
    if (showForm && !editingStudent && nextRollNumber) {
      // Update only the roll number field
      reset({
        ...watch(),
        rollNumber: nextRollNumber,
      });
    }
  }, [nextRollNumber, showForm, editingStudent, reset, watch]);

  const onSubmit = async (values: FormValues) => {
    // For new students, password is required
    if (!editingStudent && (!values.password || values.password.trim() === '')) {
      toast.error('Password is required for new students');
      return;
    }

    // Use auto-generated roll number for new students
    const rollNumber = editingStudent ? values.rollNumber : nextRollNumber;

    const payload = {
      userData: {
        name: values.name,
        email: values.email,
        ...(values.password && values.password.trim() !== '' && { password: values.password }),
      },
      studentData: {
        rollNumber: rollNumber,
        departmentId: Number(values.departmentId),
        semester: Number(values.semester),
        admissionYear: Number(values.admissionYear),
        phone: values.phone,
        additionalPhone: values.additionalPhone,
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
      name: student.name || '',
      email: student.email || '',
      password: '', // Don't pre-fill password for security
      rollNumber: student.rollNumber,
      departmentId: student.departmentId,
      semester: student.semester,
      admissionYear: student.admissionYear,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      phone: student.phone || '',
      additionalPhone: student.additionalPhone || '',
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

  const handleShowForm = () => {
    setEditingStudent(null);
    setShowForm(true);
    // Reset form for new students
    reset({
      name: '',
      email: '',
      password: '',
      rollNumber: '',
      departmentId: undefined as unknown as number,
      semester: 1,
      admissionYear: new Date().getFullYear(),
      guardianName: '',
      guardianPhone: '',
      phone: '',
      additionalPhone: '',
      address: '',
    });
  };

  // Helper functions to get names from IDs
  const getDepartmentName = (departmentId: number) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? `${dept.name} (${dept.code})` : `Dept ${departmentId}`;
  };

  const getSemesterName = (semester: number) => {
    return `Semester ${semester}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        {!showForm && (
          <button
            onClick={handleShowForm}
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
            <div className="overflow-x-auto rounded-xl shadow ring-1 ring-gray-200/60">
              <table className="min-w-full">
                <thead className="bg-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">SL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Roll Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Admission Year</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Additional Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {students.map((student, index) => (
                    <tr key={student.id} className="odd:bg-gray-50 hover:bg-indigo-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{student.rollNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getDepartmentName(student.departmentId)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getSemesterName(student.semester)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.admissionYear}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.additionalPhone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            disabled={isDeleting === student.id}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded disabled:opacity-50"
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
          
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input 
                  {...register('name')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Enter student name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email"
                  {...register('email')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="student@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingStudent ? <span className="text-gray-500 text-xs">(optional - leave blank to keep current)</span> : <span className="text-red-500 text-xs">*</span>}
                </label>
                <input 
                  type="password"
                  {...register('password')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder={editingStudent ? "Enter new password (optional)" : "Enter password (required)"}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                {!editingStudent && (
                  <p className="text-xs text-gray-600 mt-1">Password is required for new students</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number {!editingStudent && <span className="text-gray-500 text-xs">(auto-generated)</span>}
                </label>
                <input 
                  {...register('rollNumber')} 
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !editingStudent ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="e.g., CSE-2025-01"
                  readOnly={!editingStudent}
                />
                {errors.rollNumber && <p className="text-red-500 text-sm mt-1">{errors.rollNumber.message}</p>}
                {!editingStudent && (
                  <p className="text-xs text-gray-600 mt-1">Roll number is automatically generated</p>
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
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {isLoadingDepartments && (
                  <p className="text-xs text-blue-600 mt-1">Loading departments...</p>
                )}
                {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId.message}</p>}
              </div>
              {/* Course field removed */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Phone</label>
                <input 
                  {...register('phone')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="0123456789"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Phone <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input 
                  {...register('additionalPhone')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="0987654321 (optional)"
                />
                {errors.additionalPhone && <p className="text-red-500 text-sm mt-1">{errors.additionalPhone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Phone <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input 
                  {...register('guardianPhone')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="0123456789 (optional)"
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
