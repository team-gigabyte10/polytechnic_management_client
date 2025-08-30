import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type FormData = {
  email: string;
  password: string;
};

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  
  // Safely use the auth context with error handling
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('Error accessing auth context:', error);
    // Fallback to local state if context is not available
    authContext = {
      login: async () => {},
      isLoading: false,
      isAuthenticated: false,
    };
  }

  const { login, isLoading: contextLoading, isAuthenticated } = authContext;
  const isLoading = contextLoading || localLoading;

  // Navigate to dashboard when authentication state changes
  useEffect(() => {
    console.log('Login component mounted, auth state:', { isAuthenticated });
    if (isAuthenticated) {
      console.log('User authenticated, navigating to dashboard');
      // Add a small delay to ensure the state is fully propagated
      const timer = setTimeout(() => {
        console.log('Timer fired, navigating to dashboard');
        navigate('/dashboard');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  // If user is already authenticated, redirect immediately
  if (isAuthenticated) {
    console.log('Login: User already authenticated, redirecting');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: 'admin@polytechnic.com',
      password: 'Admin123',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLocalLoading(true);
      console.log('Attempting login with:', data);
      await login(data.email, data.password);
      console.log('Login completed, waiting for state update');
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error in component:', error);
      toast.error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your Polytechnic Management account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-300 mb-2">Demo Credentials:</p>
            <p className="text-xs text-gray-400">Email: admin@polytechnic.com</p>
            <p className="text-xs text-gray-400">Password: Admin123</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;