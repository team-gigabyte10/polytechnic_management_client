import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { GuestTeacher } from '../types';
import { guestTeacherAPI } from '../services/api';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  specialization: yup.string().required('Specialization is required'),
  ratePerHour: yup.number().positive('Rate must be positive').required('Rate per hour is required'),
  subjects: yup.array().of(yup.string()).min(1, 'At least one subject is required'),
  classes: yup.array().of(yup.string()).min(1, 'At least one class is required'),
});

type FormData = {
  name: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  ratePerHour: number;
  subjects: string[];
  classes: string[];
};

const GuestTeachers: React.FC = () => {
  const [guestTeachers, setGuestTeachers] = useState<GuestTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const watchedSubjects = watch('subjects', []);
  const watchedClasses = watch('classes', []);

  useEffect(() => {
    fetchGuestTeachers();
  }, []);

  const fetchGuestTeachers = async () => {
    try {
      const response = await guestTeacherAPI.getAll();
      setGuestTeachers(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch guest teachers');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingId) {
        await guestTeacherAPI.update(editingId, data);
        toast.success('Guest teacher updated successfully');
      } else {
        await guestTeacherAPI.create(data);
        toast.success('Guest teacher added successfully');
      }
      
      setShowForm(false);
      setEditingId(null);
      reset();
      fetchGuestTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (guestTeacher: GuestTeacher) => {
    setEditingId(guestTeacher.id);
    reset({
      name: guestTeacher.name,
      email: guestTeacher.email,
      phoneNumber: guestTeacher.phoneNumber,
      specialization: guestTeacher.specialization,
      ratePerHour: guestTeacher.ratePerHour,
      subjects: guestTeacher.subjects,
      classes: guestTeacher.classes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this guest teacher?')) {
      try {
        await guestTeacherAPI.delete(id);
        toast.success('Guest teacher deleted successfully');
        fetchGuestTeachers();
      } catch (error) {
        toast.error('Failed to delete guest teacher');
      }
    }
  };

  const filteredGuestTeachers = guestTeachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Mechanical', 'Electrical', 'Civil', 'English'];
  const availableClasses = ['1st Year', '2nd Year', '3rd Year', 'Diploma 1st', 'Diploma 2nd', 'Diploma 3rd'];

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
          <p className="text-gray-600">Manage guest teachers and their assignments</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            reset();
          }}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Guest Teacher</span>
        </motion.button>
      </div>

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {editingId ? 'Edit Guest Teacher' : 'Add Guest Teacher'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      Phone Number *
                    </label>
                    <input
                      {...register('phoneNumber')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate per Hour (৳) *
                    </label>
                    <input
                      {...register('ratePerHour')}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.ratePerHour && (
                      <p className="text-red-500 text-sm mt-1">{errors.ratePerHour.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <input
                    {...register('specialization')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.specialization && (
                    <p className="text-red-500 text-sm mt-1">{errors.specialization.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableSubjects.map((subject) => (
                      <label key={subject} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={subject}
                          checked={watchedSubjects?.includes(subject)}
                          onChange={(e) => {
                            const current = watchedSubjects || [];
                            if (e.target.checked) {
                              setValue('subjects', [...current, subject]);
                            } else {
                              setValue('subjects', current.filter(s => s !== subject));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                  {errors.subjects && (
                    <p className="text-red-500 text-sm mt-1">{errors.subjects.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classes *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableClasses.map((cls) => (
                      <label key={cls} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={cls}
                          checked={watchedClasses?.includes(cls)}
                          onChange={(e) => {
                            const current = watchedClasses || [];
                            if (e.target.checked) {
                              setValue('classes', [...current, cls]);
                            } else {
                              setValue('classes', current.filter(c => c !== cls));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{cls}</span>
                      </label>
                    ))}
                  </div>
                  {errors.classes && (
                    <p className="text-red-500 text-sm mt-1">{errors.classes.message}</p>
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
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <LoadingSpinner size="sm" /> : editingId ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Guest Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuestTeachers.map((teacher, index) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.specialization}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  <span className="font-medium">Rate:</span> ৳{teacher.ratePerHour}/hour
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-1">
                  {teacher.subjects.slice(0, 3).map((subject) => (
                    <span
                      key={subject}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {subject}
                    </span>
                  ))}
                  {teacher.subjects.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{teacher.subjects.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Classes:</p>
                <div className="flex flex-wrap gap-1">
                  {teacher.classes.slice(0, 3).map((cls) => (
                    <span
                      key={cls}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                    >
                      {cls}
                    </span>
                  ))}
                  {teacher.classes.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{teacher.classes.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredGuestTeachers.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guest Teachers Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No guest teachers match your search.' : 'Start by adding your first guest teacher.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                reset();
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
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