// services/api.js - Fixed for Vite
import axios from 'axios';

// Base API configuration - Fixed for Vite/modern bundlers
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('teacherToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Return structured error
    return Promise.reject({
      success: false,
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Helper function to get user timezone
const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/teachers/login', credentials),
  register: (userData) => api.post('/teachers/register', userData),
  logout: () => api.post('/teachers/logout'),
  refreshToken: () => api.post('/teachers/refresh'),
  forgotPassword: (email) => api.post('/teachers/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/teachers/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/teachers/verify-email', { token }),
  getCurrentUser: () => api.get('/teachers/me'),
};

// Teacher API
export const teacherAPI = {
  // === DASHBOARD & HOMEPAGE ===
  getHomepage: (timezone) => {
    const userTimezone = timezone || getUserTimezone();
    return api.get('/newteachers/homepage', { 
      params: { timezone: userTimezone } 
    });
  },
  


  // === CLASSES MANAGEMENT ===
  getClasses: (params = {}) => {
    const userTimezone = params.timezone || getUserTimezone();
    return api.get('/newteachers/classes', { 
      params: { ...params, timezone: userTimezone } 
    });
  },
  
  getClassDetails: (classScheduleId) => api.get(`/newteachers/classes/${classScheduleId}`),

  // === ATTENDANCE MANAGEMENT ===
  // Mark regular class attendance
  markAttendance: (attendanceData) => {
    console.log('API: Marking attendance:', attendanceData);
    return api.post('/newteachers/attendance/mark', attendanceData)
      .then(response => {
        console.log('API: Mark attendance response:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('API: Mark attendance error:', error);
        throw error;
      });
  },

  // Cancel a scheduled class
  cancelClass: (cancelData) => {
    console.log('API: Cancelling class:', cancelData);
    return api.post('/newteachers/class/cancel', cancelData)
      .then(response => {
        console.log('API: Cancel class response:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('API: Cancel class error:', error);
        throw error;
      });
  },

  // Reschedule a class
  rescheduleClass: (rescheduleData) => {
    console.log('API: Rescheduling class:', rescheduleData);
    return api.post('/newteachers/class/reschedule', rescheduleData)
      .then(response => {
        console.log('API: Reschedule class response:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('API: Reschedule class error:', error);
        throw error;
      });
  },

  // Add extra/bonus class
  addExtraClass: (extraClassData) => {
    console.log('API: Adding extra class:', extraClassData);
    return api.post('/newteachers/class/extra', extraClassData)
      .then(response => {
        console.log('API: Add extra class response:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('API: Add extra class error:', error);
        throw error;
      });
  },

  // Get attendance history
  getAttendanceHistory: (studentId, courseId, params = {}) => {
    console.log('API: Getting attendance history:', { studentId, courseId, params });
    return api.get(`/newteachers/attendance/${studentId}/${courseId}`, { params })
      .then(response => {
        console.log('API: Attendance history response:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('API: Attendance history error:', error);
        throw error;
      });
  },

  // === TOPIC MANAGEMENT ===
  markTopicCompletion: (topicData) => api.post('/newteachers/topic/complete', topicData),
  
  updateTopicStatus: (topicData) => 
    api.put('/newteachers/topic/status', topicData),
  
  bulkUpdateTopics: (classScheduleId, topics) => 
    api.put(`/newteachers/class/${classScheduleId}/topics`, { topics }),
  
  getTopicProgress: (studentId, params = {}) => 
    api.get(`/newteachers/student/${studentId}/progress`, { params }),

  // === PERFORMANCE MANAGEMENT ===
  addPerformance: (performanceData) => api.post('/newteachers/performance', performanceData),
  
  updatePerformance: (classScheduleId, performanceData) => 
    api.put(`/newteachers/performance/${classScheduleId}`, performanceData),
  
  getPerformanceHistory: (params = {}) => api.get('/newteachers/performance', { params }),

  // === STUDENT MANAGEMENT ===
  // Get all students with filters and pagination
  getStudents: (params = {}) => {
    console.log('API: Calling getStudents with params:', params);
    return api.get('/newteachers/students', { params })
      .then(response => {
        console.log('API: getStudents raw response:', response.data);
        
        // Handle array response (current format)
        if (Array.isArray(response.data)) {
          const students = response.data;
          
          // Calculate summary from the array
          const totalStudents = students.length;
          const activeStudents = students.filter(s => s.overallStatus === 'active').length;
          const needsAttentionStudents = students.filter(s => s.overallStatus === 'needs-attention').length;
          const atRiskStudents = students.filter(s => s.overallStatus === 'at-risk').length;
          
          const averageProgress = students.length > 0 
            ? Math.round(students.reduce((sum, s) => sum + (s.averageProgress || 0), 0) / students.length)
            : 0;
          
          const averageAttendance = students.length > 0 
            ? Math.round(students.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / students.length)
            : 0;

          const transformedResponse = {
            success: true,
            data: students,
            meta: {
              total: totalStudents,
              page: 1,
              limit: students.length,
              pages: 1,
              hasNext: false,
              hasPrevious: false
            },
            summary: {
              totalStudents,
              activeStudents,
              needsAttentionStudents,
              atRiskStudents,
              averageProgress,
              averageAttendance
            }
          };
          
          console.log('API: Transformed students response:', transformedResponse);
          return transformedResponse;
        } else if (response.data && response.data.success) {
          // Handle object response (expected format)
          console.log('API: Response already in correct format');
          return response.data;
        } else {
          // Handle unexpected format
          console.warn('API: Unexpected response format:', response.data);
          return {
            success: false,
            message: 'Unexpected response format',
            data: [],
            summary: {
              totalStudents: 0,
              activeStudents: 0,
              needsAttentionStudents: 0,
              atRiskStudents: 0,
              averageProgress: 0,
              averageAttendance: 0
            }
          };
        }
      })
      .catch(error => {
        console.error('API: getStudents error:', error);
        throw error;
      });
  },
  
  // Get individual student details - HANDLES DIRECT OBJECT RESPONSE
  getStudentDetails: (studentId) => {
    console.log('API: Calling getStudentDetails for student:', studentId);
    if (!studentId) {
      throw new Error('Student ID is required');
    }
    return api.get(`/newteachers/student/${studentId}`)
      .then(response => {
        console.log('API: getStudentDetails raw response:', response.data);
        
        // Handle direct object response (current format)
        if (response.data && response.data._id) {
          const transformedResponse = {
            success: true,
            data: response.data
          };
          console.log('API: Transformed student details response:', transformedResponse);
          return transformedResponse;
        } else if (response.data && response.data.success) {
          // Handle object response (expected format)
          return response.data;
        } else {
          throw new Error('Invalid student details response');
        }
      })
      .catch(error => {
        console.error('API: getStudentDetails error:', error);
        throw error;
      });
  },
  
  // Get student progress - HANDLES DIRECT OBJECT RESPONSE
  getStudentProgress: (studentId, params = {}) => {
    console.log('API: Calling getStudentProgress for student:', studentId, 'with params:', params);
    if (!studentId) {
      throw new Error('Student ID is required');
    }
    return api.get(`/newteachers/student/${studentId}/progress`, { params })
      .then(response => {
        console.log('API: getStudentProgress raw response:', response.data);
        
        // Handle direct object response (current format)
        if (response.data && (response.data.student || response.data.progress)) {
          const transformedResponse = {
            success: true,
            data: response.data
          };
          console.log('API: Transformed student progress response:', transformedResponse);
          return transformedResponse;
        } else if (response.data && response.data.success) {
          // Handle object response (expected format)
          return response.data;
        } else {
          throw new Error('Invalid student progress response');
        }
      })
      .catch(error => {
        console.error('API: getStudentProgress error:', error);
        throw error;
      });
  },

  // === NOTES MANAGEMENT ===
  addNote: (noteData) => api.post('/newteachers/notes', noteData),
  
  updateNote: (noteId, noteData) => api.put(`/newteachers/notes/${noteId}`, noteData),
  
  deleteNote: (noteId) => api.delete(`/newteachers/notes/${noteId}`),
  
  getNotes: (params = {}) => api.get('/newteachers/notes', { params }),

  // === COURSES MANAGEMENT ===
  getCourses: (params = {}) => api.get('/newteachers/courses', { params }),
  
  getCourseDetails: (courseId) => api.get(`/newteachers/courses/${courseId}`),
  
  getCourseProgress: (courseId, params = {}) => 
    api.get(`/newteachers/courses/${courseId}/progress`, { params }),

  // === UTILITIES ===
  getCurrentTime: (timezone) => {
    const userTimezone = timezone || getUserTimezone();
    return api.get('/newteachers/current-time', { 
      params: { timezone: userTimezone } 
    });
  },
  
  getProfile: () => api.get('/newteachers/profile'),
  
  updateProfile: (profileData) => api.put('/newteachers/profile', profileData),
  
  updatePreferences: (preferences) => 
    api.put('/newteachers/profile/preferences', preferences),
};

export default api;
