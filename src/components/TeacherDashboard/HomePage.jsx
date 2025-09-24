// components/TeacherDashboard/TeacherHomepage.jsx - SENIOR DEVELOPER QUALITY
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
  InformationCircleIcon
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
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Card from '../common/Card';
import PendingActions from './PendingActions';
import AttendanceModal from './AttendanceModal';

// === CONSTANTS ===
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  URGENT: 'urgent', 
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const ACTION_TYPES = {
  ATTENDANCE: 'attendance',
  HOMEWORK: 'homework',
  RESCHEDULE: 'reschedule',
  DEMO_FEEDBACK: 'demo-feedback'
};

// === CUSTOM HOOKS ===
const useAsyncRetry = (asyncFunction, dependencies = [], maxRetries = MAX_RETRY_ATTEMPTS) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    retryCount: 0
  });

  const executeWithRetry = useCallback(async (showRefreshing = false) => {
    let attempts = 0;
    
    const attemptExecution = async () => {
      try {
        if (!showRefreshing && attempts === 0) {
          setState(prev => ({ ...prev, loading: true, error: null }));
        }

        const result = await asyncFunction();
        setState({
          data: result,
          loading: false,
          error: null,
          retryCount: attempts
        });
        return result;
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempts));
          return attemptExecution();
        } else {
          setState({
            data: null,
            loading: false,
            error: error,
            retryCount: attempts
          });
          throw error;
        }
      }
    };

    return attemptExecution();
  }, dependencies);

  return [state, executeWithRetry];
};

// === MAIN COMPONENT ===
const TeacherHomepage = () => {
  const navigate = useNavigate();
  const refreshIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  // === STATE MANAGEMENT ===
  const [homepageData, setHomepageData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, analytics
  const [notifications, setNotifications] = useState([]);

  // === DATA FETCHING WITH RETRY LOGIC ===
  const fetchHomepageData = useCallback(async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('🏠 Fetching homepage data with timezone:', timezone);
      
      const response = await teacherAPI.getHomepage(timezone);
      
      if (!response?.success) {
        throw new Error(response?.message || 'Invalid response format');
      }

      console.log('📊 Homepage data received:', {
        todayClasses: response.data?.todayClasses?.length || 0,
        upcomingClasses: response.data?.upcomingClasses?.length || 0,
        pendingAttendance: response.data?.pendingAttendance?.length || 0,
        totalStudents: response.data?.quickStats?.totalStudents || 0
      });

      return response.data;
    } catch (error) {
      console.error('❌ Homepage fetch error:', error);
      throw new Error(error.message || 'Failed to load homepage data');
    }
  }, []);

  const [homepageState, executeHomepageFetch] = useAsyncRetry(fetchHomepageData, []);

  // === COMPUTED VALUES ===
  const computedStats = useMemo(() => {
    if (!homepageData) return null;

    const pendingActionsCount = (homepageData.pendingAttendance?.length || 0) +
                               (homepageData.pendingHomework?.length || 0) +
                               (homepageData.rescheduleRequests?.length || 0);

    const urgentActionsCount = homepageData.alerts?.filter(alert => 
      [PRIORITY_LEVELS.CRITICAL, PRIORITY_LEVELS.URGENT].includes(alert.priority)
    ).length || 0;

    const completionRate = homepageData.todayOverview?.totalClasses > 0 
      ? Math.round((homepageData.todayOverview.completedClasses / homepageData.todayOverview.totalClasses) * 100)
      : 0;

    return {
      pendingActionsCount,
      urgentActionsCount,
      completionRate,
      systemHealth: homepageData.systemHealth?.healthScore || 100,
      isHealthy: (homepageData.systemHealth?.healthScore || 100) > 80
    };
  }, [homepageData]);

  // === REFRESH HANDLERS ===
  const handleRefresh = useCallback(async (showToast = true) => {
    if (!mountedRef.current) return;

    try {
      setRefreshing(true);
      const data = await executeHomepageFetch(true);
      
      if (mountedRef.current) {
        setHomepageData(data);
        setLastRefresh(new Date());
        
        if (showToast) {
          toast.success('Dashboard refreshed successfully!');
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        toast.error(`Refresh failed: ${error.message}`);
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [executeHomepageFetch]);

  // === ACTION HANDLERS ===
  const handlePendingActionClick = useCallback(async (action) => {
    console.log('🎯 Processing action:', action.type, 'for student:', action.student);

    try {
      switch (action.type) {
        case ACTION_TYPES.ATTENDANCE:
          if (action.actionData) {
            setSelectedClass({
              classScheduleId: action.actionData.classScheduleId,
              studentId: action.actionData.studentId,
              enrollmentId: action.actionData.enrollmentId,
              studentName: action.student,
              courseName: action.course?.title || 'Course',
              classDate: action.classDate,
              daysOverdue: action.daysOverdue
            });
            setShowAttendanceModal(true);
          } else {
            navigate(`/teacher/students/${action.studentId}/attendance`);
          }
          break;

        case ACTION_TYPES.HOMEWORK:
          if (action.actionData?.homeworkId) {
            navigate(`/teacher/homework/${action.actionData.homeworkId}/grade`, {
              state: { 
                studentId: action.studentId,
                studentName: action.student,
                returnUrl: '/teacher/dashboard'
              }
            });
          } else {
            navigate('/teacher/homework', { 
              state: { filter: 'pending-grading' } 
            });
          }
          break;

        case ACTION_TYPES.RESCHEDULE:
          if (action.actionData?.classScheduleId) {
            navigate(`/teacher/schedule/reschedule/${action.actionData.classScheduleId}`, {
              state: {
                studentId: action.studentId,
                studentName: action.student,
                originalDate: action.originalDate,
                requestedDate: action.requestedDate,
                reason: action.reason
              }
            });
          }
          break;

        case ACTION_TYPES.DEMO_FEEDBACK:
          if (action.actionData?.demoId) {
            navigate(`/teacher/demos/${action.actionData.demoId}/feedback`, {
              state: {
                studentId: action.studentId,
                studentName: action.student
              }
            });
          }
          break;

        default:
          console.warn('Unknown action type:', action.type);
          toast.warn('This action is not yet implemented');
      }
    } catch (error) {
      console.error('❌ Error handling action:', error);
      toast.error('Failed to handle action');
    }
  }, [navigate]);

  const handleAttendanceSuccess = useCallback((message) => {
    toast.success(message || 'Attendance marked successfully!');
    setShowAttendanceModal(false);
    setSelectedClass(null);
    
    // Refresh data after successful attendance marking
    handleRefresh(false);
  }, [handleRefresh]);

  const handleClassAction = useCallback((classItem, actionType) => {
    console.log('📚 Class action:', actionType, 'for:', classItem.student?.name);

    switch (actionType) {
      case 'view-details':
        navigate(`/teacher/classes/${classItem.classScheduleId}`, {
          state: { classItem }
        });
        break;

      case 'start-class':
        if (classItem.joinUrl) {
          window.open(classItem.joinUrl, '_blank');
        } else {
          navigate(`/teacher/classes/${classItem.classScheduleId}/start`);
        }
        break;

      case 'mark-attendance':
        setSelectedClass(classItem);
        setShowAttendanceModal(true);
        break;

      case 'add-performance':
        navigate(`/teacher/performance/add`, {
          state: { 
            classScheduleId: classItem.classScheduleId,
            studentId: classItem.student._id,
            enrollmentId: classItem.enrollmentId
          }
        });
        break;

      default:
        console.warn('Unknown class action:', actionType);
    }
  }, [navigate]);

  // === LIFECYCLE EFFECTS ===
  useEffect(() => {
    mountedRef.current = true;
    
    const initializeData = async () => {
      try {
        const data = await executeHomepageFetch();
        if (mountedRef.current) {
          setHomepageData(data);
          setLastRefresh(new Date());
        }
      } catch (error) {
        console.error('Initial data load failed:', error);
      }
    };

    initializeData();

    return () => {
      mountedRef.current = false;
    };
  }, [executeHomepageFetch]);

  // Auto-refresh setup
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !document.hidden) {
        handleRefresh(false);
      }
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [handleRefresh]);

  // Page visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current) {
        // Refresh when page becomes visible again
        const timeSinceLastRefresh = lastRefresh 
          ? new Date() - lastRefresh 
          : Infinity;
          
        if (timeSinceLastRefresh > 60000) { // 1 minute
          handleRefresh(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastRefresh, handleRefresh]);

  // === UTILITY FUNCTIONS ===
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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

  // === RENDER STATES ===
  if (homepageState.loading) {
    return <LoadingScreen />;
  }

  if (homepageState.error && !homepageData) {
    return (
      <ErrorScreen 
        error={homepageState.error}
        onRetry={() => executeHomepageFetch()}
        retryCount={homepageState.retryCount}
      />
    );
  }

  const safeHomepageData = homepageData || {};

  // === MAIN RENDER ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-32 -translate-y-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300 opacity-10 rounded-full -translate-x-16 translate-y-16 animate-bounce"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-3 flex items-center">
                {getGreeting()}, Teacher! 
                <SparklesIcon className="h-12 w-12 text-yellow-300 ml-4 animate-pulse" />
              </h1>
              <p className="text-indigo-100 text-xl max-w-2xl">
                Welcome to your comprehensive teaching dashboard. Monitor progress, manage tasks, and support your students effectively.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* System health indicator */}
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className={`h-3 w-3 rounded-full ${
                  computedStats?.isHealthy ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                }`}></div>
                <span className="text-white text-sm">
                  Health: {computedStats?.systemHealth || 100}%
                </span>
              </div>
              
              {/* Last refresh indicator */}
              <div className="text-indigo-100 text-sm">
                <div>Last updated</div>
                <div className="font-semibold">{formatLastRefresh()}</div>
              </div>

              {/* Refresh button */}
              <button
                onClick={() => handleRefresh()}
                disabled={refreshing}
                className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-2xl hover:bg-opacity-30 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg"
                title={`Last refreshed: ${formatLastRefresh()}`}
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Current time and quick info */}
          <div className="flex items-center justify-between text-indigo-100">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <ClockIconSolid className="h-5 w-5 mr-2" />
                <span className="text-lg">
                  {safeHomepageData.currentTime?.displayTime || new Date().toLocaleString()}
                </span>
              </div>
              <div className="flex items-center">
                <CalendarIconSolid className="h-5 w-5 mr-2" />
                <span className="text-lg">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Quick action counts */}
            {computedStats?.pendingActionsCount > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <BellIconSolid className="h-5 w-5 text-yellow-300 mr-2" />
                  <span>{computedStats.pendingActionsCount} pending</span>
                  {computedStats.urgentActionsCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
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
        {/* Today's Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <OverviewCard
            title="Today's Classes"
            value={safeHomepageData.todayOverview?.totalClasses || 0}
            subtitle={`${safeHomepageData.todayOverview?.completedClasses || 0} completed`}
            icon={CalendarIconSolid}
            color="blue"
            trend={computedStats?.completionRate ? `${computedStats.completionRate}% completion` : null}
            onClick={() => navigate('/teacher/classes/today')}
          />
          
          <OverviewCard
            title="Pending Attendance"
            value={safeHomepageData.todayOverview?.pendingAttendance || 0}
            subtitle="Classes missing attendance"
            icon={ClipboardDocumentCheckIcon}
            color={safeHomepageData.todayOverview?.pendingAttendance > 0 ? "red" : "green"}
            urgent={safeHomepageData.todayOverview?.pendingAttendance > 0}
            onClick={() => {
              if (safeHomepageData.todayOverview?.pendingAttendance > 0) {
                document.getElementById('pending-actions')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
          
          <OverviewCard
            title="Active Students"
            value={safeHomepageData.quickStats?.totalStudents || 0}
            subtitle={`across ${safeHomepageData.quickStats?.totalCourses || 0} courses`}
            icon={UserGroupIconSolid}
            color="purple"
            trend={`${safeHomepageData.quickStats?.totalEnrollments || 0} enrollments`}
            onClick={() => navigate('/teacher/students')}
          />
          
          <OverviewCard
            title="System Health"
            value={`${computedStats?.systemHealth || 100}%`}
            subtitle={computedStats?.isHealthy ? 'All systems operational' : 'Needs attention'}
            icon={computedStats?.isHealthy ? CheckCircleIconSolid : ExclamationTriangleIconSolid}
            color={computedStats?.isHealthy ? "green" : "yellow"}
            urgent={!computedStats?.isHealthy}
            onClick={() => navigate('/teacher/system/health')}
          />
        </section>

        {/* Pending Actions Section */}
        <section id="pending-actions" className="mb-8">
          <PendingActions
            data={safeHomepageData}
            onActionClick={handlePendingActionClick}
            onRefresh={handleRefresh}
            loading={refreshing}
            className="w-full"
            showStats={true}
          />
        </section>

        {/* Main Dashboard Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Classes */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Classes */}
            <Card 
              titleText="Today's Classes" 
              titleIcon={CalendarIconSolid}
              variant="info"
              headerActions={
                <button
                  onClick={() => navigate('/teacher/classes/today')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All →
                </button>
              }
            >
              <ClassesList
                classes={safeHomepageData.todayClasses || []}
                type="today"
                onClassAction={handleClassAction}
                emptyMessage="No classes scheduled for today. Enjoy your free time! 🎉"
              />
            </Card>

            {/* Upcoming Classes */}
            <Card 
              titleText="Upcoming Classes" 
              titleIcon={ClockIconSolid}
              variant="default"
              headerActions={
                <button
                  onClick={() => navigate('/teacher/classes/upcoming')}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View All →
                </button>
              }
            >
              <ClassesList
                classes={safeHomepageData.upcomingClasses?.slice(0, 5) || []}
                type="upcoming"
                onClassAction={handleClassAction}
                emptyMessage="All caught up! No upcoming classes scheduled."
                showViewMore={safeHomepageData.upcomingClasses?.length > 5}
                viewMoreCount={safeHomepageData.upcomingClasses?.length - 5}
                onViewMore={() => navigate('/teacher/classes/upcoming')}
              />
            </Card>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <Card 
              titleText="Quick Statistics" 
              titleIcon={ChartBarIcon}
              variant="success"
            >
              <StatsList stats={safeHomepageData.quickStats || {}} />
            </Card>

            {/* Performance Overview */}
            <Card 
              titleText="Performance Overview" 
              titleIcon={TrophyIconSolid}
              variant="default"
            >
              <PerformanceOverview 
                performance={safeHomepageData.performanceOverview || {}}
              />
            </Card>

            {/* Recent Activity */}
            <Card 
              titleText="Recent Activity" 
              titleIcon={BellIconSolid}
              variant="default"
            >
              <RecentActivity 
                activities={safeHomepageData.recentActivity || []}
              />
            </Card>
          </div>
        </section>

        {/* Error boundary for debugging */}
        {process.env.NODE_ENV === 'development' && homepageState.error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold mb-2">Debug Information</h3>
            <pre className="text-xs text-red-600 overflow-auto">
              {JSON.stringify(homepageState.error, null, 2)}
            </pre>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAttendanceModal && selectedClass && (
        <AttendanceModal
          student={selectedClass}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedClass(null);
          }}
          onSuccess={handleAttendanceSuccess}
        />
      )}
    </div>
  );
};

// === COMPONENT PARTS ===

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-30 mx-auto"></div>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Loading Your Dashboard</h2>
      <p className="text-gray-600 text-lg mb-6">Gathering your teaching data and analytics...</p>
      <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full animate-pulse transition-all duration-1000" 
          style={{ width: '75%' }}
        ></div>
      </div>
      <p className="text-sm text-gray-500 mt-4">This usually takes just a few seconds ✨</p>
    </div>
  </div>
);

const ErrorScreen = ({ error, onRetry, retryCount = 0 }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
    <div className="text-center max-w-md">
      <ExclamationTriangleIconSolid className="mx-auto h-20 w-20 text-red-500 mb-6" />
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Unavailable</h2>
      <p className="text-gray-600 mb-6">
        {error?.message || 'Unable to load your dashboard. Please check your connection and try again.'}
      </p>
      
      {retryCount > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          Attempted {retryCount} time{retryCount > 1 ? 's' : ''}
        </p>
      )}
      
      <div className="space-y-3">
        <button 
          onClick={onRetry}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
        >
          Try Again
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Refresh Page
        </button>
      </div>
      
      <p className="text-xs text-gray-400 mt-4">
        If this problem persists, please contact support
      </p>
    </div>
  </div>
);

const OverviewCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend, 
  urgent, 
  onClick 
}) => {
  const colorClasses = {
    blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', light: 'bg-blue-100', border: 'border-blue-200' },
    green: { bg: 'from-green-500 to-green-600', text: 'text-green-600', light: 'bg-green-100', border: 'border-green-200' },
    purple: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', light: 'bg-purple-100', border: 'border-purple-200' },
    yellow: { bg: 'from-yellow-500 to-yellow-600', text: 'text-yellow-600', light: 'bg-yellow-100', border: 'border-yellow-200' },
    red: { bg: 'from-red-500 to-red-600', text: 'text-red-600', light: 'bg-red-100', border: 'border-red-200' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-xl p-6 border-2 transition-all duration-300 
        hover:shadow-2xl hover:scale-105 transform
        ${onClick ? 'cursor-pointer' : ''}
        ${urgent ? `${colors.light} ${colors.border} animate-pulse ring-2 ring-red-200` : 'border-gray-100 hover:border-gray-200'}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-2xl bg-gradient-to-r ${colors.bg} shadow-lg transform transition-transform duration-300 hover:scale-110`}>
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
  );
};

const ClassesList = ({ 
  classes = [], 
  type, 
  onClassAction, 
  emptyMessage,
  showViewMore = false,
  viewMoreCount = 0,
  onViewMore
}) => {
  if (!classes.length) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((classItem, index) => (
        <ClassCard 
          key={classItem.classScheduleId || index}
          classItem={classItem}
          type={type}
          onAction={onClassAction}
        />
      ))}
      
      {showViewMore && (
        <div className="text-center pt-4">
          <button 
            onClick={onViewMore}
            className="px-6 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            View {viewMoreCount} more classes →
          </button>
        </div>
      )}
    </div>
  );
};

const ClassCard = ({ classItem, type, onAction }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'rescheduled': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionButton = () => {
    switch (classItem.actionRequired) {
      case 'mark-attendance':
        return {
          text: 'Mark Attendance',
          color: 'bg-red-600 hover:bg-red-700',
          action: 'mark-attendance'
        };
      case 'add-performance':
        return {
          text: 'Add Performance',
          color: 'bg-blue-600 hover:bg-blue-700',
          action: 'add-performance'
        };
      case 'start-class':
        return {
          text: 'Start Class',
          color: 'bg-green-600 hover:bg-green-700',
          action: 'start-class'
        };
      default:
        return {
          text: 'View Details',
          color: 'bg-gray-600 hover:bg-gray-700',
          action: 'view-details'
        };
    }
  };

  const actionButton = getActionButton();

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-gray-200 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">
                {classItem.student?.name?.charAt(0) || classItem.studentName?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {classItem.student?.name || classItem.studentName || 'Unknown Student'}
              </h3>
              <p className="text-gray-600">
                {classItem.course?.title || classItem.courseName || 'Unknown Course'}
              </p>
              {classItem.course?.type && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mt-1">
                  {classItem.course.type}
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {new Date(classItem.classDate).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              {classItem.classTime || 'Time TBD'}
            </div>
            {classItem.dayOfWeek && (
              <div className="col-span-2 flex items-center">
                <span className="text-gray-500">
                  {classItem.dayOfWeek}
                  {type === 'today' && classItem.timeUntilClass && (
                    <span className="ml-2 text-blue-600 font-medium">
                      • {classItem.timeUntilClass}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(classItem.status)}`}>
            {classItem.status ? classItem.status.replace('-', ' ').toUpperCase() : 'PENDING'}
          </span>
          
          {classItem.priority && classItem.priority !== 'low' && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              classItem.priority === 'critical' ? 'bg-red-100 text-red-700' :
              classItem.priority === 'urgent' ? 'bg-orange-100 text-orange-700' :
              classItem.priority === 'high' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {classItem.priority}
            </span>
          )}
          
          <button
            onClick={() => onAction(classItem, actionButton.action)}
            className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 ${actionButton.color}`}
          >
            {actionButton.text}
          </button>
        </div>
      </div>
      
      {/* Additional info for urgent items */}
      {classItem.daysOverdue && classItem.daysOverdue > 0 && (
        <div className="mt-4 pt-4 border-t border-red-100 bg-red-50 rounded-lg p-3">
          <div className="flex items-center text-red-700">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              Overdue by {classItem.daysOverdue} day{classItem.daysOverdue > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const StatsList = ({ stats }) => (
  <div className="space-y-4">
    <StatItem
      label="Total Students"
      value={stats.totalStudents || 0}
      icon={UserGroupIcon}
      color="blue"
    />
    <StatItem
      label="Total Courses"
      value={stats.totalCourses || 0}
      icon={AcademicCapIcon}
      color="purple"
    />
    <StatItem
      label="Topic Completion"
      value={`${stats.topicCompletionRate || 0}%`}
      icon={BookOpenIcon}
      color="green"
      progress={stats.topicCompletionRate || 0}
      subValue={`${stats.completedTopics || 0}/${stats.totalTopics || 0} topics`}
    />
    <StatItem
      label="Weekly Classes"
      value={stats.weeklyClasses || 0}
      icon={CalendarIcon}
      color="yellow"
    />
    <StatItem
      label="Completion Rate"
      value={`${stats.completionRate || 0}%`}
      icon={TrophyIcon}
      color="green"
      progress={stats.completionRate || 0}
    />
  </div>
);

const StatItem = ({ label, value, subValue, icon: Icon, color, progress }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100'
  };

  const colorClass = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <span className="text-gray-700 font-medium">{label}</span>
          {subValue && (
            <div className="text-xs text-gray-500">{subValue}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900 text-lg">{value}</div>
        {progress !== undefined && (
          <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                color === 'blue' ? 'bg-blue-500' :
                color === 'green' ? 'bg-green-500' :
                color === 'purple' ? 'bg-purple-500' :
                color === 'yellow' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`}
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
    <div>
      <div className="text-4xl font-bold text-indigo-600 mb-2">
        {performance.averageScore || 0}%
      </div>
      <div className="text-gray-600">Average Student Score</div>
    </div>
    
    {performance.recentScores && performance.recentScores.length > 0 && (
      <div>
        <div className="text-sm text-gray-600 mb-3">Recent Performance Scores</div>
        <div className="flex justify-center space-x-2 flex-wrap gap-2">
          {performance.recentScores.slice(0, 8).map((scoreData, index) => (
            <div 
              key={index}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${
                scoreData.score >= 80 ? 'bg-green-100 text-green-800' :
                scoreData.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
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
      <div>
        <div className="text-lg font-semibold text-gray-900">
          {performance.totalAssessments || 0}
        </div>
        <div className="text-xs text-gray-500">Total Assessments</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-900">
          {performance.improvements || 0}
        </div>
        <div className="text-xs text-gray-500">High Scores (80%+)</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-900">
          {performance.topPerformers?.length || 0}
        </div>
        <div className="text-xs text-gray-500">Top Performers</div>
      </div>
    </div>

    {performance.topPerformers && performance.topPerformers.length > 0 && (
      <div className="text-left">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">🏆 Top Performers</h4>
        <div className="space-y-2">
          {performance.topPerformers.slice(0, 3).map((performer, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{performer.student}</span>
              <span className="font-semibold text-green-600">{performer.score}%</span>
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
        <BellIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No recent activity</p>
        <p className="text-sm text-gray-400">Activity will appear as you use the platform</p>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'attendance': return CheckCircleIcon;
      case 'performance': return TrophyIcon;
      case 'homework': return BookOpenIcon;
      case 'class': return CalendarIcon;
      default: return BellIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'attendance': return 'bg-green-100 text-green-600';
      case 'performance': return 'bg-yellow-100 text-yellow-600';
      case 'homework': return 'bg-blue-100 text-blue-600';
      case 'class': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
      {activities.slice(0, 10).map((activity, index) => {
        const Icon = getActivityIcon(activity.type);
        const colorClass = getActivityColor(activity.type);
        
        return (
          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className={`p-2 rounded-full ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.title}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recent'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TeacherHomepage;
