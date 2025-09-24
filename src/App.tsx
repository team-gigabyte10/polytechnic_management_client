import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GuestTeachers from './pages/GuestTeachers';
import NotFound from './pages/NotFound';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Departments from './pages/Departments';
import Schedule from './pages/Schedule';
import Subjects from './pages/Subjects';
import AttendancePage from './pages/Attendance';

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  color: 'black',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  border: '1px solid #e5e7eb',
                },
              }}
            />
            
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/guest-teachers"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <MainLayout>
                      <GuestTeachers />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/departments"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <MainLayout>
                      <Departments />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/students"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Students />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teachers"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <MainLayout>
                      <Teachers />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Schedule />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subjects"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Subjects />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AttendancePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="p-6"><h1 className="text-2xl font-bold">Courses - Coming Soon</h1></div>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marks"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="p-6"><h1 className="text-2xl font-bold">Marks - Coming Soon</h1></div>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="p-6"><h1 className="text-2xl font-bold">Accounts - Coming Soon</h1></div>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="p-6"><h1 className="text-2xl font-bold">Notifications - Coming Soon</h1></div>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;