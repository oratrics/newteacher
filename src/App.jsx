// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TeacherLogin from './components/auth/TeacherLogin';
import TeacherHomePage from './components/TeacherDashboard/HomePage';
import ClassesManagement from './components/TeacherDashboard/ClassesManagement';
import StudentsManagement from './components/TeacherDashboard/StudentsManagement';
// import CoursesManagement from './components/TeacherDashboard/CoursesManagement';
// import ProfileSettings from './components/TeacherDashboard/ProfileSettings';
import TeacherLayout from './components/layout/TeacherLayout';

import NotFound from './components/common/NotFound';
import LiveClassroom from './components/VideoClassroom';
// import LiveClassroomWrapper from './components/LiveClassroom';
import MyClasses from './components/MyClasses';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<TeacherLogin />} />
              <Route 
            path="/live-class/:classScheduleId" 
            element={
                <LiveClassroom />
            } 
          />
          
            {/* Protected Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute>
                <TeacherLayout />
              </ProtectedRoute>
            }>
              <Route index element={<TeacherHomePage />} />
              <Route path="classes" element={<ClassesManagement />} />
              <Route path="students" element={<StudentsManagement />} />
              
                   <Route path="newclass" element={<MyClasses />} />
              

              
              {/* <Route path="courses" element={<CoursesManagement />} /> */}
              {/* <Route path="profile" element={<ProfileSettings />} /> */}
            </Route>

            {/* Redirect root to teacher dashboard */}
            <Route path="/" element={<Navigate to="/teacher" replace />} />
            
            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
