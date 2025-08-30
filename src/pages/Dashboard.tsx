import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, UserCheck, BookOpen, Banknote, TrendingUp, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { DashboardData } from '../types';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('Dashboard component mounted, user:', user);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Dashboard: Fetching dashboard data');
        const response = await dashboardAPI.getDashboardData();
        console.log('Dashboard: API response:', response);
        setDashboardData(response.data.data);
      } catch (error: any) {
        console.error('Dashboard: Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Students',
      value: dashboardData?.counts.students || 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
    },
    {
      title: 'Teachers',
      value: dashboardData?.counts.teachers || 0,
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
    },
    {
      title: 'Guest Teachers',
      value: dashboardData?.counts.guestTeachers || 0,
      icon: UserCheck,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50',
    },
    {
      title: 'Courses',
      value: dashboardData?.counts.courses || 0,
      icon: BookOpen,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
    },
  ];

  const financialCards = [
    {
      title: 'Total Salaries',
      value: `৳${dashboardData?.financials.salaries.total.toLocaleString() || 0}`,
      subtitle: `Paid: ৳${dashboardData?.financials.salaries.paid.toLocaleString() || 0}`,
      icon: Banknote,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Expenses',
      value: `৳${dashboardData?.financials.expenses.toLocaleString() || 0}`,
      subtitle: 'This month',
      icon: TrendingUp,
      color: 'from-red-500 to-pink-500',
    },
    {
      title: 'Student Payments',
      value: `৳${dashboardData?.financials.studentPayments.toLocaleString() || 0}`,
      subtitle: 'Collected this month',
      icon: Banknote,
      color: 'from-blue-500 to-indigo-500',
    },
  ];

  return (
    <div className="dashboard-container dashboard-content space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="p-4 md:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
              <p className="text-blue-100 text-sm md:text-base">Here's what's happening in your polytechnic today.</p>
            </div>
            <div className="hidden sm:block">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className={`p-4 md:p-6 bg-gradient-to-br ${card.bgColor} h-full`}>
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <card.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Financial Overview */}
      {user?.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {financialCards.map((card) => (
              <Card key={card.title} className="p-4 md:p-6 h-full">
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                    <p className="text-xs md:text-sm text-gray-500">{card.subtitle}</p>
                  </div>
                  <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <card.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="p-3 md:p-4 cursor-pointer hover:bg-blue-50 transition-colors h-full">
            <div className="flex items-center space-x-2 md:space-x-3 h-full">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm md:text-base">View Schedule</p>
                <p className="text-xs md:text-sm text-gray-600">Check today's classes</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 md:p-4 cursor-pointer hover:bg-green-50 transition-colors h-full">
            <div className="flex items-center space-x-2 md:space-x-3 h-full">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm md:text-base">Mark Attendance</p>
                <p className="text-xs md:text-sm text-gray-600">Record today's attendance</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 md:p-4 cursor-pointer hover:bg-purple-50 transition-colors h-full">
            <div className="flex items-center space-x-3 h-full">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-purple-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm md:text-base">Enter Marks</p>
                <p className="text-xs md:text-sm text-gray-600">Update student grades</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 md:p-4 cursor-pointer hover:bg-orange-50 transition-colors h-full">
            <div className="flex items-center space-x-2 md:space-x-3 h-full">
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm md:text-base">Send Notice</p>
                <p className="text-xs md:text-sm text-gray-600">Create announcement</p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;