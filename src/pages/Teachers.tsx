import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { teacherAPI } from '../services/api';
import { CreateTeacherRequest, User } from '../types';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
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
  password: string;
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
  const [isLoadingList, setIsLoadingList] = useState(true);

  const fetchTeachers = async () => {
    try {
      setIsLoadingList(true);
      // Prefer dedicated teachers API to ensure we show teacher records
      const res = await teacherAPI.getAll();
      const teacherItems: any[] = res?.data?.data?.teachers ?? res?.data?.data ?? res?.data ?? [];
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
          salary: item.salary,
          joiningDate: item.joiningDate,
          phone: item.phone,
          address: item.address,
        };
        return user;
      });
      setTeachers(mapped);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load teachers');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
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

  const onSubmit = async (values: FormValues) => {
    const payload: CreateTeacherRequest = {
      userData: {
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'teacher',
      },
      teacherData: {
        employeeId: values.employeeId,
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

    try {
      await teacherAPI.create(payload);
      toast.success('Teacher created successfully');
      reset();
      setShowForm(false);
      fetchTeachers();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create teacher';
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary (৳)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{t.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{t.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.employeeId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.department || (t as any).teacherProfile?.departmentId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.designation || (t as any).teacherProfile?.specialization || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.phone || (t as any).teacherProfile?.phoneNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{typeof (t as any).teacherProfile?.salary === 'number' ? `৳${(t as any).teacherProfile?.salary.toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{(t as any).teacherProfile?.joiningDate ? new Date((t as any).teacherProfile?.joiningDate).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={8}>No teachers found</td>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" {...register('password')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input {...register('employeeId')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department ID</label>
              <input type="number" {...register('departmentId', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Create Teacher'}
            </button>
          </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Teachers;


