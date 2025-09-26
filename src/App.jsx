// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import the AuthProvider (likely small and needed immediately)
import { AuthProvider } from './contexts/AuthContext';

// Import the ProtectedRoute (needed for all protected routes)
import ProtectedRoute from './components/auth/ProtectedRoute';

// 1. Convert component imports to dynamic imports using React.lazy()

// Auth & Public
const TeacherLogin = lazy(() => import('./components/auth/TeacherLogin'));
const LiveClassroom = lazy(() => import('./components/VideoClassroom'));

// Layout
const TeacherLayout = lazy(() => import('./components/layout/TeacherLayout'));

// Teacher Dashboard Components
const TeacherHomePage = lazy(() => import('./components/TeacherDashboard/HomePage'));
const ClassesManagement = lazy(() => import('./components/TeacherDashboard/ClassesManagement'));
const StudentsManagement = lazy(() => import('./components/TeacherDashboard/StudentsManagement'));
const MyClasses = lazy(() => import('./components/MyClasses'));
const TeacherHomeworkDashboard = lazy(() => import('./components/teacherHomework/TeacherHomeworkDashboard'));
const AttendanceManagement = lazy(() => import('./components/TeacherDashboard/AttendanceManagement'));

// Common
const NotFound = lazy(() => import('./components/common/NotFound'));


// Fallback component for Suspense (can be a loading spinner)
const LoadingFallback = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <p>Loading content...</p>
    {/* You'd typically use a proper spinner component here */}
  </div>
);


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* 2. Wrap the Routes in Suspense */}
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<TeacherLogin />} />
              <Route path="/live-class/:classScheduleId" element={<LiveClassroom />} />

              {/* Protected Routes */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute>
                    {/* The TeacherLayout component itself is now lazy-loaded */}
                    <TeacherLayout />
                  </ProtectedRoute>
                }
              >
                {/* Child Routes - components are also lazy-loaded */}
                <Route index element={<TeacherHomePage />} />
                <Route path="classes" element={<ClassesManagement />} />
                <Route path="students" element={<StudentsManagement />} />
                <Route path="newclass" element={<MyClasses />} />
                <Route path="homework" element={<TeacherHomeworkDashboard />} />
                <Route path="attendance" element={<AttendanceManagement />} />

              </Route>

              {/* Redirect root "/" to "/teacher" */}
              <Route path="/" element={<Navigate to="/teacher" replace />} />

              {/* Catch-all 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
              success: { duration: 3000, style: { background: '#10B981' } },
              error: { duration: 5000, style: { background: '#EF4444' } },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;