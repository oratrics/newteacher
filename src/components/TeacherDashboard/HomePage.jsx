// components/TeacherDashboard/TeacherHomepage.jsx - COMPLETELY FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BookOpenIcon,
  StarIcon,
  TrophyIcon,
  BellIcon,
  PlayIcon,
  EyeIcon,
  DocumentTextIcon,
  FireIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  PlusIcon,
  ChevronRightIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  CogIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  HeartIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import {
  CalendarIcon as CalendarIconSolid,
  ClockIcon as ClockIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid,
  BellIcon as BellIconSolid,
  FireIcon as FireIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// === API CONFIGURATION - FIXED ===
const API_BASE_URL = 'https://backend.oratrics.in/api';

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('teacherToken');
  
  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`📡 API Call: ${endpoint}`, { method: config.method || 'GET' });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    console.log(`📡 API Response:`, { status: response.status, success: data.success });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('teacherToken');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error);
    throw error;
  }
};

const teacherAPI = {
  getHomepage: (timezone = 'UTC') => {
    return apiCall(`/newteachers/dashboard?timezone=${encodeURIComponent(timezone)}`);
  },

  markAttendance: (enrollmentId, classScheduleId, data) =>
    apiCall(`/newteachers/classes/${enrollmentId}/${classScheduleId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addPerformance: (enrollmentId, classScheduleId, data) =>
    apiCall(`/newteachers/classes/${enrollmentId}/${classScheduleId}/performance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateClassStatus: (enrollmentId, classScheduleId, data) =>
    apiCall(`/newteachers/classes/${enrollmentId}/${classScheduleId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
};

// === CONSTANTS ===
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// === MAIN COMPONENT ===
const TeacherHomepage = () => {
  const navigate = useNavigate();
  const refreshIntervalRef = useRef(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // === STATE MANAGEMENT ===
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'connected', 'disconnected', 'checking'

  // === SAFE DATA EXTRACTION ===
  const safeData = useMemo(() => {
    if (!dashboardData) {
      return {
        currentTime: {
          displayTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        todayOverview: {
          totalClasses: 0,
          completedClasses: 0,
          pendingClasses: 0,
          pendingAttendance: 0,
          inProgressClasses: 0
        },
        todayClasses: [],
        upcomingClasses: [],
        pendingAttendance: [],
        quickStats: {
          totalStudents: 0,
          totalCourses: 0,
          totalEnrollments: 0,
          weeklyClasses: 0,
          completedTopics: 0,
          totalTopics: 0,
          averageProgress: 0,
          topicCompletionRate: 0,
          completionRate: 0
        },
        performanceOverview: {
          averageScore: 0,
          totalAssessments: 0,
          recentScores: [],
          improvements: 0,
          topPerformers: []
        },
        recentActivity: [],
        alerts: [],
        systemHealth: {
          healthScore: 100,
          issues: [],
          recommendations: []
        }
      };
    }

    // Return actual data with safe fallbacks
    return {
      currentTime: dashboardData.currentTime || {
        displayTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      todayOverview: dashboardData.todayOverview || {
        totalClasses: 0,
        completedClasses: 0,
        pendingClasses: 0,
        pendingAttendance: 0,
        inProgressClasses: 0
      },
      todayClasses: Array.isArray(dashboardData.todayClasses) ? dashboardData.todayClasses : [],
      upcomingClasses: Array.isArray(dashboardData.upcomingClasses) ? dashboardData.upcomingClasses : [],
      pendingAttendance: Array.isArray(dashboardData.pendingAttendance) ? dashboardData.pendingAttendance : [],
      quickStats: dashboardData.quickStats || {
        totalStudents: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        weeklyClasses: 0,
        completedTopics: 0,
        totalTopics: 0,
        averageProgress: 0,
        topicCompletionRate: 0,
        completionRate: 0
      },
      performanceOverview: dashboardData.performanceOverview || {
        averageScore: 0,
        totalAssessments: 0,
        recentScores: [],
        improvements: 0,
        topPerformers: []
      },
      recentActivity: Array.isArray(dashboardData.recentActivity) ? dashboardData.recentActivity : [],
      alerts: Array.isArray(dashboardData.alerts) ? dashboardData.alerts : [],
      systemHealth: dashboardData.systemHealth || {
        healthScore: 100,
        issues: [],
        recommendations: []
      }
    };
  }, [dashboardData]);

  // === COMPUTED VALUES ===
  const computedStats = useMemo(() => {
    const pendingActionsCount = safeData.pendingAttendance.length;
    const urgentActionsCount = safeData.alerts.filter(alert => 
      alert && ['critical', 'urgent'].includes(alert.priority)
    ).length;

    const completionRate = safeData.todayOverview.totalClasses > 0 
      ? Math.round((safeData.todayOverview.completedClasses / safeData.todayOverview.totalClasses) * 100)
      : 0;

    const systemHealth = safeData.systemHealth.healthScore || 100;
    const isHealthy = systemHealth > 80;

    return {
      pendingActionsCount,
      urgentActionsCount,
      completionRate,
      systemHealth,
      isHealthy
    };
  }, [safeData]);

  // === DATA FETCHING WITH RETRY LOGIC ===
  const fetchDashboardData = useCallback(async (showRefreshing = false, retryAttempt = 0) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      setConnectionStatus('checking');

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('🏠 Fetching dashboard data with timezone:', timezone);
      
      const response = await teacherAPI.getHomepage(timezone);
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'Invalid response format from server');
      }

      console.log('✅ Dashboard data received successfully');

      if (mountedRef.current) {
        setDashboardData(response.data);
        setLastRefresh(new Date());
        setConnectionStatus('connected');
        retryCountRef.current = 0; // Reset retry count on success
        
        if (showRefreshing) {
          toast.success('Dashboard refreshed successfully! ✨');
        }
      }

      return response.data;
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      
      // Retry logic
      if (retryAttempt < MAX_RETRY_ATTEMPTS && !err.message.includes('Authentication')) {
        console.log(`🔄 Retrying... Attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS}`);
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryAttempt + 1)));
        return fetchDashboardData(showRefreshing, retryAttempt + 1);
      }

      const errorMsg = err.message || 'Failed to load dashboard data';
      
      if (mountedRef.current) {
        setError(errorMsg);
        setConnectionStatus('disconnected');
        
        if (showRefreshing) {
          toast.error(`Refresh failed: ${errorMsg}`);
        }
      }
      
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // === ACTION HANDLERS ===
  const handleRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const handleClassAction = useCallback((classItem, action) => {
    if (!classItem) {
      toast.error('Invalid class data');
      return;
    }

    console.log('📚 Class action:', action, 'for:', classItem.student?.name);

    try {
      switch (action) {
        case 'start-class':
          if (classItem.joinUrl) {
            window.open(classItem.joinUrl, '_blank');
            toast.success('Opening class meeting...');
          } else {
            navigate(`/teacher/classes/${classItem.classScheduleId}/start`);
          }
          break;

        case 'mark-attendance':
          navigate(`/teacher/attendance`, {
            state: { 
              classScheduleId: classItem.classScheduleId,
              enrollmentId: classItem.enrollmentId,
              studentName: classItem.student?.name || 'Student',
              courseName: classItem.course?.title || 'Course',
              classDate: classItem.classDate
            }
          });
          break;

        case 'add-performance':
          navigate(`/teacher/performance`, {
            state: { 
              classScheduleId: classItem.classScheduleId,
              enrollmentId: classItem.enrollmentId,
              studentName: classItem.student?.name || 'Student',
              courseName: classItem.course?.title || 'Course'
            }
          });
          break;

        case 'view-details':
          navigate(`/teacher/classes/${classItem.classScheduleId}`);
          break;

        default:
          console.warn('Unknown class action:', action);
          toast.warn('Unknown action requested');
      }
    } catch (error) {
      console.error('Error handling class action:', error);
      toast.error('Failed to perform action');
    }
  }, [navigate]);

  const handleQuickAction = useCallback((actionType) => {
    try {
      switch (actionType) {
        case 'schedule-class':
          navigate('/teacher/classes/schedule');
          break;
        case 'add-student':
          navigate('/teacher/students/add');
          break;
        case 'view-analytics':
          navigate('/teacher/analytics');
          break;
        case 'view-students':
          navigate('/teacher/students');
          break;
        case 'view-courses':
          navigate('/teacher/courses');
          break;
        case 'view-attendance':
          navigate('/teacher/attendance');
          break;
        case 'view-classes':
          navigate('/teacher/classes');
          break;
        default:
          toast.info('Feature coming soon!');
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      toast.error('Navigation failed');
    }
  }, [navigate]);

  // === LIFECYCLE EFFECTS ===
  useEffect(() => {
    mountedRef.current = true;
    
    // Check authentication first
    const token = localStorage.getItem('teacherToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetchDashboardData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchDashboardData, navigate]);

  // Auto-refresh setup with connection monitoring
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !document.hidden && connectionStatus === 'connected') {
        fetchDashboardData(false);
      }
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchDashboardData, connectionStatus]);

  // === UTILITY FUNCTIONS ===
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const greetings = {
      morning: ['Good Morning', 'Rise and Shine', 'Hello Sunshine'],
      afternoon: ['Good Afternoon', 'Hope Your Day is Going Well', 'Afternoon Greetings'],
      evening: ['Good Evening', 'Evening Greetings', 'Hope You Had a Great Day']
    };
    
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    if (hour >= 17) timeOfDay = 'evening';
    
    const options = greetings[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  }, []);

  const formatLastRefresh = useCallback(() => {
    if (!lastRefresh) return 'Never';
    
    const now = new Date();
    const diffMs = now - lastRefresh;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }, [lastRefresh]);

  // === CONNECTION STATUS INDICATOR ===
  const ConnectionIndicator = () => (
    <div className={`flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-2 ${
      connectionStatus === 'disconnected' ? 'animate-pulse' : ''
    }`}>
      <div className={`w-3 h-3 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
        connectionStatus === 'checking' ? 'bg-yellow-400 animate-spin' :
        'bg-red-400 animate-bounce'
      }`}></div>
      <span className="text-white text-sm font-semibold">
        {connectionStatus === 'connected' ? 'Connected' :
         connectionStatus === 'checking' ? 'Connecting...' :
         'Connection Lost'}
      </span>
    </div>
  );

  // === RENDER STATES ===
  if (loading) {
    return <LoadingScreen />;
  }

  if (error && !dashboardData && connectionStatus === 'disconnected') {
    return (
      <ErrorScreen 
        error={error}
        onRetry={() => fetchDashboardData()}
        onLogin={() => navigate('/login')}
      />
    );
  }

  // === MAIN RENDER ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* ENHANCED HEADER WITH CONNECTION STATUS */}
      <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
    
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Header Content */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6">
              {/* <div className="relative">
                <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl">
                  <HeartIconSolid className="h-12 w-12 text-pink-300 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-yellow-900 animate-spin" />
                </div>
              </div> */}
              
              <div>
                <h1 className="text-5xl font-bold text-white mb-3 flex items-center">
                  {getGreeting()}, Teacher! 
                  <RocketLaunchIcon className="h-12 w-12 text-yellow-300 ml-4 animate-bounce" />
                </h1>
                <p className="text-indigo-100 text-xl max-w-2xl leading-relaxed">
                  Welcome to your teaching command center. Transform education, inspire minds, and track amazing progress! ✨
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-4">
              {/* Status Indicators */}
              <div className="flex items-center space-x-4">
                <ConnectionIndicator />
                
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <ShieldCheckIcon className={`h-5 w-5 ${computedStats?.isHealthy ? 'text-green-300 animate-pulse' : 'text-yellow-300'}`} />
                  <span className="text-white text-sm font-semibold">
                    System Health: {computedStats?.systemHealth || 100}%
                  </span>
                </div>
                
                <div className="text-indigo-100 text-sm text-right">
                  <div className="font-semibold">Last Updated</div>
                  <div className="opacity-75">{formatLastRefresh()}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || connectionStatus === 'checking'}
                  className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-2xl hover:bg-opacity-30 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg font-semibold"
                >
                  <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>

                <button
                  onClick={() => handleQuickAction('view-analytics')}
                  className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-2xl hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg font-semibold"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Time Display */}
          <div className="flex items-center justify-between text-indigo-100">
            <div className="flex items-center space-x-8">
              <div className="flex items-center bg-white bg-opacity-10 backdrop-blur-sm rounded-xl px-4 py-2">
                <ClockIconSolid className="h-6 w-6 mr-3 text-yellow-300" />
                <div>
                  <span className="text-2xl font-bold">
                    {safeData.currentTime.displayTime}
                  </span>
                  <div className="text-sm opacity-75">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center bg-white bg-opacity-10 backdrop-blur-sm rounded-xl px-4 py-2">
                <GlobeAltIcon className="h-6 w-6 mr-3 text-green-300" />
                <div>
                  <div className="font-semibold">Teaching from</div>
                  <div className="text-sm opacity-75">{safeData.currentTime.timezone}</div>
                </div>
              </div>
            </div>

            {/* Alert Indicators */}
            {computedStats?.pendingActionsCount > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-red-500 bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-2 animate-pulse">
                  <BellIconSolid className="h-5 w-5 text-red-300 mr-2 animate-bounce" />
                  <span className="font-semibold">{computedStats.pendingActionsCount} pending actions</span>
                  {computedStats.urgentActionsCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full font-bold animate-pulse">
                      {computedStats.urgentActionsCount} urgent
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ENHANCED OVERVIEW CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MagicOverviewCard
            title="Today's Classes"
            value={safeData.todayOverview.totalClasses}
            subtitle={`${safeData.todayOverview.completedClasses} completed`}
            icon={CalendarIconSolid}
            color="blue"
            trend={computedStats?.completionRate ? `${computedStats.completionRate}% completion` : null}
            gradient="from-blue-500 to-cyan-500"
            onClick={() => handleQuickAction('view-classes')}
            sparkles={true}
          />
          
          <MagicOverviewCard
            title="Pending Actions"
            value={computedStats?.pendingActionsCount || 0}
            subtitle="Classes need attention"
            icon={ExclamationTriangleIconSolid}
            color={computedStats?.pendingActionsCount > 0 ? "red" : "green"}
            gradient={computedStats?.pendingActionsCount > 0 ? "from-red-500 to-pink-500" : "from-green-500 to-emerald-500"}
            urgent={computedStats?.pendingActionsCount > 0}
            onClick={() => computedStats?.pendingActionsCount > 0 && document.getElementById('pending-section')?.scrollIntoView({ behavior: 'smooth' })}
            sparkles={computedStats?.pendingActionsCount > 0}
          />
          
          <MagicOverviewCard
            title="Active Students"
            value={safeData.quickStats.totalStudents}
            subtitle={`across ${safeData.quickStats.totalCourses} courses`}
            icon={UserGroupIconSolid}
            color="purple"
            gradient="from-purple-500 to-indigo-500"
            trend={`${safeData.quickStats.totalEnrollments} total enrollments`}
            onClick={() => handleQuickAction('view-students')}
            sparkles={true}
          />
          
          <MagicOverviewCard
            title="System Health"
            value={`${computedStats?.systemHealth || 100}%`}
            subtitle={computedStats?.isHealthy ? 'All systems optimal!' : 'Needs attention'}
            icon={computedStats?.isHealthy ? CheckCircleIconSolid : ExclamationTriangleIconSolid}
            color={computedStats?.isHealthy ? "green" : "yellow"}
            gradient={computedStats?.isHealthy ? "from-green-500 to-teal-500" : "from-yellow-500 to-orange-500"}
            urgent={!computedStats?.isHealthy}
            onClick={() => handleQuickAction('view-analytics')}
            sparkles={computedStats?.isHealthy}
          />
        </section>

        {/* ENHANCED QUICK ACTIONS */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <RocketLaunchIcon className="h-6 w-6 mr-3 text-indigo-600" />
                Quick Actions
              </h2>
              <div className="text-sm text-gray-500">
                Streamline your teaching workflow
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <QuickActionButton
                icon={PlusIcon}
                label="Schedule Class"
                color="blue"
                onClick={() => handleQuickAction('schedule-class')}
              />
              <QuickActionButton
                icon={UserPlusIcon}
                label="Add Student"
                color="green"
                onClick={() => handleQuickAction('add-student')}
              />
              <QuickActionButton
                icon={ChartBarIcon}
                label="View Analytics"
                color="purple"
                onClick={() => handleQuickAction('view-analytics')}
              />
              <QuickActionButton
                icon={UserGroupIcon}
                label="All Students"
                color="indigo"
                onClick={() => handleQuickAction('view-students')}
              />
              <QuickActionButton
                icon={AcademicCapIcon}
                label="My Courses"
                color="pink"
                onClick={() => handleQuickAction('view-courses')}
              />
              <QuickActionButton
                icon={ClipboardDocumentCheckIcon}
                label="Attendance"
                color="yellow"
                onClick={() => handleQuickAction('view-attendance')}
              />
            </div>
          </div>
        </section>

        {/* MAIN DASHBOARD GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - TODAY'S CLASSES */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Classes */}
            <BeautifulCard 
              title="Today's Schedule" 
              icon={CalendarIconSolid}
              iconColor="text-blue-600"
              headerAction={
                <button
                  onClick={() => handleQuickAction('view-classes')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                >
                  View All Classes →
                </button>
              }
            >
              <EnhancedClassesList
                classes={safeData.todayClasses}
                type="today"
                onClassAction={handleClassAction}
                emptyMessage="🎉 No classes today! Perfect time to plan ahead or take a well-deserved break."
                emptyIcon={HeartIconSolid}
              />
            </BeautifulCard>

            {/* Upcoming Classes */}
            <BeautifulCard 
              title="Coming Up Next" 
              icon={ClockIconSolid}
              iconColor="text-purple-600"
              headerAction={
                <button
                  onClick={() => handleQuickAction('view-classes')}
                  className="text-purple-600 hover:text-purple-800 text-sm font-semibold transition-colors"
                >
                  View All Upcoming →
                </button>
              }
            >
              <EnhancedClassesList
                classes={safeData.upcomingClasses.slice(0, 5)}
                type="upcoming"
                onClassAction={handleClassAction}
                emptyMessage="✨ All caught up! No upcoming classes in the next week."
                emptyIcon={CheckCircleIconSolid}
                showViewMore={safeData.upcomingClasses.length > 5}
                viewMoreCount={safeData.upcomingClasses.length - 5}
                onViewMore={() => handleQuickAction('view-classes')}
              />
            </BeautifulCard>
          </div>

          {/* RIGHT COLUMN - STATS & ACTIVITY */}
          <div className="space-y-8">
            {/* Enhanced Statistics */}
            <BeautifulCard 
              title="Teaching Statistics" 
              icon={TrophyIconSolid}
              iconColor="text-yellow-600"
            >
              <EnhancedStatsList stats={safeData.quickStats} />
            </BeautifulCard>

            {/* Performance Overview */}
            <BeautifulCard 
              title="Student Performance" 
              icon={StarIconSolid}
              iconColor="text-indigo-600"
            >
              <PerformanceOverview 
                performance={safeData.performanceOverview}
              />
            </BeautifulCard>

            {/* Recent Activity */}
            <BeautifulCard 
              title="Recent Activity" 
              icon={BellIconSolid}
              iconColor="text-green-600"
            >
              <RecentActivity 
                activities={safeData.recentActivity}
              />
            </BeautifulCard>
          </div>
        </section>

        {/* PENDING ACTIONS SECTION */}
        {computedStats?.pendingActionsCount > 0 && (
          <section id="pending-section" className="mt-8">
            <BeautifulCard 
              title="Urgent Actions Required" 
              icon={FireIconSolid}
              iconColor="text-red-600"
              urgent={true}
            >
              <PendingActionsList 
                pendingClasses={safeData.pendingAttendance}
                alerts={safeData.alerts}
                onActionClick={(classItem, action) => handleClassAction(classItem, action)}
              />
            </BeautifulCard>
          </section>
        )}

        {/* INSPIRATIONAL FOOTER */}
        <footer className="mt-12 text-center">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <HeartIconSolid className="h-8 w-8 text-pink-200 mr-3 animate-pulse" />
              <h3 className="text-2xl font-bold">Keep Making a Difference!</h3>
            </div>
            <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
              Every student you teach, every concept you explain, every moment you care - it all matters. 
              You're not just teaching subjects, you're shaping futures. ✨
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

// === ENHANCED COMPONENT PARTS ===

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-spin mx-auto shadow-2xl"></div>
        <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-30 mx-auto"></div>
        <SparklesIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white animate-pulse" />
      </div>
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Loading Your Magic Dashboard ✨</h2>
      <p className="text-gray-600 text-xl mb-6">Preparing your personalized teaching experience...</p>
      <div className="w-64 bg-gray-200 rounded-full h-3 mx-auto">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full animate-pulse transition-all duration-1000" style={{width: '75%'}}></div>
      </div>
      <p className="text-sm text-gray-500 mt-4">🚀 Getting everything ready for you!</p>
    </div>
  </div>
);

const ErrorScreen = ({ error, onRetry, onLogin }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
    <div className="text-center max-w-md p-6">
      <ExclamationTriangleIconSolid className="mx-auto h-20 w-20 text-red-500 mb-6 animate-bounce" />
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
      <p className="text-gray-600 mb-6 text-left bg-gray-100 p-4 rounded-lg font-mono text-sm">
        {error}
      </p>
      
      <div className="space-y-3">
        <button 
          onClick={onRetry}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold transform hover:scale-105"
        >
          ✨ Try Again
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          🔄 Refresh Page
        </button>
        {error.includes('Authentication') && (
          <button 
            onClick={onLogin}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            🔑 Go to Login
          </button>
        )}
      </div>
      
      <p className="text-xs text-gray-400 mt-6">
        If this keeps happening, our support team is here to help! 💙
      </p>
    </div>
  </div>
);
const MagicOverviewCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  gradient,
  trend, 
  urgent, 
  onClick,
  sparkles = false
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white rounded-2xl shadow-xl p-6 border-2 transition-all duration-500 
        hover:shadow-2xl hover:scale-105 transform cursor-pointer overflow-hidden
        ${urgent ? 'border-red-300 ring-4 ring-red-100 animate-pulse' : 'border-gray-100 hover:border-gray-200'}
      `}
    >
      {/* Background Gradient Effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full translate-x-16 -translate-y-16`}></div>
      
      {/* Sparkles Effect */}
      {sparkles && (
        <>
          <SparklesIcon className="absolute top-2 right-2 h-4 w-4 text-yellow-400 animate-pulse" />
          <SparklesIcon className="absolute bottom-4 left-4 h-3 w-3 text-pink-400 animate-bounce" />
        </>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transform transition-transform duration-300 hover:scale-110`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          
          {urgent && (
            <div className="animate-bounce">
              <ExclamationTriangleIconSolid className="h-6 w-6 text-red-500" />
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
          <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
          
          {trend && (
            <div className="flex items-center text-xs">
              <ArrowTrendingUpIcon className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickActionButton = ({ icon: Icon, label, color, onClick }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
    yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group`}
    >
      <Icon className="h-6 w-6 mx-auto mb-2 group-hover:animate-bounce" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
};

const BeautifulCard = ({ title, icon: Icon, iconColor, children, headerAction, urgent = false }) => (
  <div className={`bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
    urgent ? 'border-red-300 ring-4 ring-red-100' : 'border-gray-100'
  }`}>
    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {Icon && <Icon className={`h-6 w-6 mr-3 ${iconColor}`} />}
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {urgent && <FireIcon className="h-5 w-5 ml-2 text-red-500 animate-pulse" />}
        </div>
        {headerAction}
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const EnhancedClassesList = ({ 
  classes = [], 
  type, 
  onClassAction, 
  emptyMessage,
  emptyIcon: EmptyIcon,
  showViewMore = false,
  viewMoreCount = 0,
  onViewMore
}) => {
  if (!classes.length) {
    return (
      <div className="text-center py-12">
        {EmptyIcon && <EmptyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />}
        <p className="text-gray-500 text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((classItem, index) => (
        <EnhancedClassCard 
          key={classItem.classScheduleId || index}
          classItem={classItem}
          type={type}
          onAction={onClassAction}
        />
      ))}
      
      {showViewMore && (
        <div className="text-center pt-6">
          <button 
            onClick={onViewMore}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
          >
            View {viewMoreCount} more classes →
          </button>
        </div>
      )}
    </div>
  );
};

const EnhancedClassCard = ({ classItem, type, onAction }) => {
  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-300',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      rescheduled: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getActionButton = () => {
    switch (classItem.actionRequired) {
      case 'mark-attendance':
        return { text: '📝 Mark Attendance', color: 'from-red-500 to-red-600', action: 'mark-attendance' };
      case 'add-performance':
        return { text: '⭐ Add Performance', color: 'from-blue-500 to-blue-600', action: 'add-performance' };
      case 'start-class':
        return { text: '🚀 Start Class', color: 'from-green-500 to-green-600', action: 'start-class' };
      default:
        return { text: '👁️ View Details', color: 'from-gray-500 to-gray-600', action: 'view-details' };
    }
  };

  const actionButton = getActionButton();
  const timeUntil = type === 'today' ? getTimeUntilClass(classItem.classDate, classItem.classTime) : null;

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {classItem.student?.name?.charAt(0) || 'S'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 text-xl">
                {classItem.student?.name || 'Unknown Student'}
              </h3>
              <p className="text-gray-600 font-medium">
                {classItem.course?.title || 'Unknown Course'}
              </p>
              {classItem.course?.courseType && (
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full mt-1 font-semibold">
                  {classItem.course.courseType}
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center bg-gray-50 rounded-lg p-2">
              <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
              <span className="font-medium">
                {new Date(classItem.classDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-2">
              <ClockIcon className="h-4 w-4 mr-2 text-green-500" />
              <span className="font-medium">{classItem.classTime || 'Time TBD'}</span>
            </div>
          </div>

          {timeUntil && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700">
                <ClockIcon className="h-4 w-4 mr-2" />
                <span className="font-semibold">{timeUntil}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-3">
          <span className={`px-3 py-2 text-xs font-bold rounded-full border ${getStatusColor(classItem.status)}`}>
            {classItem.status?.replace('-', ' ').toUpperCase() || 'PENDING'}
          </span>
          
          {classItem.priority && classItem.priority !== 'low' && (
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              classItem.priority === 'urgent' ? 'bg-red-100 text-red-700 animate-pulse' :
              classItem.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {classItem.priority.toUpperCase()}
            </span>
          )}
          
          <button
            onClick={() => onAction(classItem, actionButton.action)}
            className={`px-6 py-3 bg-gradient-to-r ${actionButton.color} text-white text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl`}
          >
            {actionButton.text}
          </button>
        </div>
      </div>
    </div>
  );
};

const EnhancedStatsList = ({ stats }) => (
  <div className="space-y-4">
    <StatItem
      label="Total Students"
      value={stats.totalStudents || 0}
      icon={UserGroupIcon}
      color="blue"
      description="Active learners in your classes"
    />
    <StatItem
      label="Total Courses"
      value={stats.totalCourses || 0}
      icon={AcademicCapIcon}
      color="purple"
      description="Subjects you're teaching"
    />
    <StatItem
      label="Topic Completion"
      value={`${stats.topicCompletionRate || 0}%`}
      icon={BookOpenIcon}
      color="green"
      progress={stats.topicCompletionRate || 0}
      subValue={`${stats.completedTopics || 0}/${stats.totalTopics || 0} topics covered`}
      description="Overall curriculum progress"
    />
    <StatItem
      label="Weekly Classes"
      value={stats.weeklyClasses || 0}
      icon={CalendarIcon}
      color="yellow"
      description="Classes this week"
    />
    <StatItem
      label="Completion Rate"
      value={`${stats.completionRate || 0}%`}
      icon={TrophyIcon}
      color="green"
      progress={stats.completionRate || 0}
      description="Classes fully completed"
    />
  </div>
);

const StatItem = ({ label, value, subValue, icon: Icon, color, progress, description }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 from-blue-500 to-blue-600',
    green: 'text-green-600 bg-green-100 from-green-500 to-green-600',
    purple: 'text-purple-600 bg-purple-100 from-purple-500 to-purple-600',
    yellow: 'text-yellow-600 bg-yellow-100 from-yellow-500 to-yellow-600',
    red: 'text-red-600 bg-red-100 from-red-500 to-red-600'
  };

  const colorClass = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClass.split(' ').slice(-2).join(' ')} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <span className="text-gray-900 font-bold text-lg">{label}</span>
          {subValue && (
            <div className="text-sm text-gray-500">{subValue}</div>
          )}
          {description && (
            <div className="text-xs text-gray-400">{description}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900 text-2xl">{value}</div>
        {progress !== undefined && (
          <div className="w-24 h-3 bg-gray-200 rounded-full mt-2">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${colorClass.split(' ').slice(-2).join(' ')}`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

const PerformanceOverview = ({ performance }) => (
  <div className="text-center space-y-6">
    <div className="relative">
      <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
        {performance.averageScore || 0}%
      </div>
      <div className="text-gray-600 font-semibold">Average Student Score</div>
      <SparklesIcon className="absolute -top-2 -right-4 h-6 w-6 text-yellow-400 animate-pulse" />
    </div>
    
    {performance.recentScores && performance.recentScores.length > 0 && (
      <div>
        <div className="text-sm text-gray-600 mb-3 font-semibold">Recent Performance Scores</div>
        <div className="flex justify-center space-x-2 flex-wrap gap-2">
          {performance.recentScores.slice(0, 8).map((scoreData, index) => (
            <div 
              key={index}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-transform hover:scale-110 ${
                scoreData.score >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
                scoreData.score >= 60 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                'bg-gradient-to-br from-red-400 to-red-600 text-white'
              }`}
              title={`${scoreData.student || 'Student'}: ${scoreData.score}%`}
            >
              {scoreData.score}
            </div>
          ))}
        </div>
      </div>
    )}
    
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
        <div className="text-2xl font-bold text-blue-600">
          {performance.totalAssessments || 0}
        </div>
        <div className="text-xs text-blue-700 font-semibold">Total Assessments</div>
      </div>
      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
        <div className="text-2xl font-bold text-green-600">
          {performance.improvements || 0}
        </div>
        <div className="text-xs text-green-700 font-semibold">High Scores (80%+)</div>
      </div>
      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
        <div className="text-2xl font-bold text-purple-600">
          {performance.topPerformers?.length || 0}
        </div>
        <div className="text-xs text-purple-700 font-semibold">Top Performers</div>
      </div>
    </div>

    {performance.topPerformers && performance.topPerformers.length > 0 && (
      <div className="text-left">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
          <TrophyIconSolid className="h-5 w-5 mr-2 text-yellow-500" />
          🏆 Top Performers
        </h4>
        <div className="space-y-3">
          {performance.topPerformers.slice(0, 3).map((performer, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                  index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                  'bg-gradient-to-r from-orange-600 to-orange-700'
                }`}>
                  {index + 1}
                </div>
                <span className="text-gray-700 font-semibold">{performer.student}</span>
              </div>
              <span className="font-bold text-green-600 text-lg">{performer.score}%</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const RecentActivity = ({ activities }) => {
  if (!activities?.length) {
    return (
      <div className="text-center py-8">
        <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">No recent activity</p>
        <p className="text-sm text-gray-400">Activity will appear as you teach and interact with students</p>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'attendance': return CheckCircleIcon;
      case 'performance': return TrophyIcon;
      case 'topic': return BookOpenIcon;
      case 'class': return CalendarIcon;
      default: return BellIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'attendance': return 'from-green-500 to-green-600';
      case 'performance': return 'from-yellow-500 to-yellow-600';
      case 'topic': return 'from-blue-500 to-blue-600';
      case 'class': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {activities.slice(0, 10).map((activity, index) => {
        const Icon = getActivityIcon(activity.type);
        const colorClass = getActivityColor(activity.type);
        
        return (
          <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:scale-105">
            <div className={`p-2 rounded-full bg-gradient-to-r ${colorClass} shadow-lg`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {activity.title}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 font-semibold">
              {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recent'}
            </span>
          </div>
        );
      })}\n    </div>
  );
};

const PendingActionsList = ({ pendingClasses, alerts, onActionClick }) => {
  const allPendingItems = [
    ...(alerts || []).map(alert => ({
      ...alert,
      type: 'alert'
    })),
    ...(pendingClasses || []).map(classItem => ({
      ...classItem,
      type: 'pending-class'
    }))
  ];

  if (!allPendingItems.length) {
    return (
      <div className="text-center py-8">
        <CheckCircleIconSolid className="h-16 w-16 text-green-500 mx-auto mb-4 animate-bounce" />
        <p className="text-green-600 text-xl font-bold">🎉 All caught up!</p>
        <p className="text-gray-500">No pending actions at the moment. Great job!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allPendingItems.slice(0, 10).map((item, index) => (
        <PendingActionCard
          key={index}
          item={item}
          onActionClick={onActionClick}
        />
      ))}
    </div>
  );
};

const PendingActionCard = ({ item, onActionClick }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'from-red-500 to-red-600 animate-pulse';
      case 'urgent': return 'from-orange-500 to-orange-600';
      case 'high': return 'from-yellow-500 to-yellow-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
      item.priority === 'critical' ? 'border-red-300 bg-red-50' :
      item.priority === 'urgent' ? 'border-orange-300 bg-orange-50' :
      'border-yellow-300 bg-yellow-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-full bg-gradient-to-r ${getPriorityColor(item.priority)} shadow-lg`}>
              <ExclamationTriangleIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">
                {item.title || `Attendance needed for ${item.student?.name || 'Student'}`}
              </h4>
              <p className="text-sm text-gray-600">
                {item.message || item.description || `Class from ${new Date(item.classDate).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          
          {item.daysOverdue > 0 && (
            <div className="flex items-center text-red-700 text-sm font-semibold">
              <ClockIcon className="h-4 w-4 mr-1" />
              Overdue by {item.daysOverdue} day{item.daysOverdue > 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <button
          onClick={() => onActionClick(item, item.actionRequired || 'mark-attendance')}
          className={`px-6 py-3 bg-gradient-to-r ${getPriorityColor(item.priority)} text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg`}
        >
          {item.actionRequired === 'start-class' ? '🚀 Start' :
           item.actionRequired === 'add-performance' ? '⭐ Add Performance' :
           '📝 Mark Attendance'}
        </button>
      </div>
    </div>
  );
};

// === UTILITY FUNCTIONS ===
const getTimeUntilClass = (classDate, classTime) => {
  try {
    const now = new Date();
    const classDateTime = new Date(`${classDate.split('T')[0]}T${classTime}:00`);
    const diffMs = classDateTime - now;
    
    if (diffMs < 0) return 'Class time passed';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`;
    } else if (diffMinutes > 0) {
      return `in ${diffMinutes} minutes`;
    } else {
      return 'Starting soon!';
    }
  } catch (error) {
    return '';
  }
};
// Import all other component parts from the previous implementation...
// (MagicOverviewCard, QuickActionButton, BeautifulCard, EnhancedClassesList, etc.)
// The component parts remain the same as in the previous implementation

export default TeacherHomepage;
