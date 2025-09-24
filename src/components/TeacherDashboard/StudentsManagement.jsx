// components/TeacherDashboard/StudentsManagement.jsx - SIMPLIFIED VERSION
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  Bars3Icon,
  ListBulletIcon,
  XMarkIcon,
  StarIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import {
  UserGroupIcon as UserGroupIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Import attendance modal
import AttendanceModal from './AttendanceModal';

// === UTILITY COMPONENTS ===
const ProgressBar = ({ percentage, color = 'blue', height = 'h-2' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full ${height}`}>
      <div 
        className={`${colorClasses[color]} ${height} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
      ></div>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
    <div className="text-center">
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-30"></div>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-3">Loading Students...</h2>
      <p className="text-gray-600 text-lg">Gathering student data and progress ✨</p>
      <div className="mt-6 w-64 bg-gray-200 rounded-full h-2 mx-auto">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
      </div>
    </div>
  </div>
);

// === MAIN COMPONENT ===
const StudentsManagement = () => {
  const navigate = useNavigate();
  
  // === STATE MANAGEMENT ===
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    activeStudents: 0,
    needsAttentionStudents: 0,
    atRiskStudents: 0,
    averageProgress: 0,
    averageAttendance: 0
  });
  
  // Filters and Search
  const [filters, setFilters] = useState({
    search: '',
    courseType: '',
    progressRange: '',
    status: 'all'
  });

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  // Modals
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // View mode
  const [viewMode, setViewMode] = useState('grid');

  // === DATA FETCHING ===
  const fetchStudents = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('Fetching students with filters:', filters);
      
      const params = {};
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.courseType) params.courseType = filters.courseType;
      if (filters.progressRange) params.progressRange = filters.progressRange;
      if (filters.status !== 'all') params.status = filters.status;
      
      const response = await teacherAPI.getStudents(params);
      
      console.log('Students API response:', response);
      
      // Handle both array response and object response formats
      let studentsData = [];
      let summaryData = {
        totalStudents: 0,
        activeStudents: 0,
        needsAttentionStudents: 0,
        atRiskStudents: 0,
        averageProgress: 0,
        averageAttendance: 0
      };

      if (Array.isArray(response)) {
        studentsData = response;
        summaryData = {
          totalStudents: studentsData.length,
          activeStudents: studentsData.filter(s => s.overallStatus === 'active').length,
          needsAttentionStudents: studentsData.filter(s => s.overallStatus === 'needs-attention').length,
          atRiskStudents: studentsData.filter(s => s.overallStatus === 'at-risk').length,
          averageProgress: studentsData.length > 0 
            ? Math.round(studentsData.reduce((sum, s) => sum + (s.averageProgress || 0), 0) / studentsData.length)
            : 0,
          averageAttendance: studentsData.length > 0 
            ? Math.round(studentsData.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / studentsData.length)
            : 0
        };
      } else if (response && response.success) {
        studentsData = response.data || [];
        summaryData = response.summary || summaryData;
      } else {
        const errorMsg = response?.message || 'Failed to load students';
        setError(errorMsg);
        toast.error(errorMsg);
        setStudents([]);
        setSummary(summaryData);
        return;
      }

      setStudents(studentsData);
      setSummary(summaryData);
      
      if (showRefreshing) {
        toast.success('Students refreshed successfully!');
      }

    } catch (err) {
      console.error('Error fetching students:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Network error: Unable to load students';
      setError(errorMsg);
      toast.error(errorMsg);
      setStudents([]);
      setSummary({
        totalStudents: 0,
        activeStudents: 0,
        needsAttentionStudents: 0,
        atRiskStudents: 0,
        averageProgress: 0,
        averageAttendance: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(filters) !== JSON.stringify({
        search: '',
        courseType: '',
        progressRange: '',
        status: 'all'
      })) {
        fetchStudents();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, fetchStudents]);

  // === DATA PROCESSING ===
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'progress':
          aValue = a.averageProgress || 0;
          bValue = b.averageProgress || 0;
          break;
        case 'attendance':
          aValue = a.attendanceRate || 0;
          bValue = b.attendanceRate || 0;
          break;
        case 'topics':
          aValue = a.topicCompletionRate || 0;
          bValue = b.topicCompletionRate || 0;
          break;
        case 'status':
          const statusOrder = { 'at-risk': 3, 'needs-attention': 2, 'active': 1 };
          aValue = statusOrder[a.overallStatus] || 0;
          bValue = statusOrder[b.overallStatus] || 0;
          break;
        case 'lastClass':
          aValue = new Date(a.lastClassDate || 0);
          bValue = new Date(b.lastClassDate || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, sortBy, sortOrder]);

  // === ACTION HANDLERS ===
  const handleViewProgress = useCallback((studentId) => {
    console.log('Navigating to progress for student:', studentId);
    navigate(`/teacher/students/${studentId}/progress`);
  }, [navigate]);

  const handleManageAttendance = useCallback((student) => {
    console.log('Opening attendance modal for student:', student.name);
    setSelectedStudent(student);
    setShowAttendanceModal(true);
  }, []);

  const handleStudentAction = useCallback((studentId, action) => {
    const student = students.find(s => s._id === studentId);
    if (!student) {
      toast.error('Student not found');
      return;
    }

    console.log('Student action:', action, 'for student:', student.name);

    switch (action) {
      case 'view_progress':
        handleViewProgress(studentId);
        break;
      case 'manage_attendance':
        handleManageAttendance(student);
        break;
      case 'view_details':
        navigate(`/teacher/students/${studentId}/details`);
        break;
      case 'send_message':
        if (student.email) {
          window.open(`mailto:${student.email}?subject=Regarding your studies&body=Dear ${student.name},%0D%0A%0D%0A`);
          toast.success('Opening email client...');
        } else {
          toast.error('No email address available for this student');
        }
        break;
      default:
        console.warn('Unknown action:', action);
        toast.warn('Unknown action requested');
        break;
    }
  }, [students, handleViewProgress, handleManageAttendance, navigate]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      courseType: '',
      progressRange: '',
      status: 'all'
    });
    setSortBy('name');
    setSortOrder('asc');
    toast.success('Filters cleared');
  }, []);

  const toggleStudentSelection = useCallback((studentId) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  }, []);

  const selectAllStudents = useCallback(() => {
    if (selectedStudents.size === filteredAndSortedStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredAndSortedStudents.map(s => s._id)));
    }
  }, [selectedStudents.size, filteredAndSortedStudents]);

  const handleModalSuccess = useCallback((message) => {
    toast.success(message);
    fetchStudents(true);
  }, [fetchStudents]);

  // === UTILITY FUNCTIONS ===
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs-attention': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'at-risk': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircleIconSolid;
      case 'needs-attention': return ClockIconSolid;
      case 'at-risk': return ExclamationCircleIconSolid;
      default: return CheckCircleIconSolid;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // === RENDER STATES ===
  if (loading) {
    return <LoadingScreen />;
  }

  if (error && students.length === 0) {
    return <ErrorScreen error={error} onRetry={() => fetchStudents()} />;
  }

  // === MAIN RENDER ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-32 -translate-y-32 animate-pulse"></div>
          <div className="absolute top-20 right-20 w-48 h-48 bg-yellow-300 opacity-10 rounded-full animate-bounce"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center mb-4">
                <div className="p-4 bg-white bg-opacity-20 rounded-2xl mr-4">
                  <UserGroupIconSolid className="h-10 w-10 text-blue-300" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {getGreeting()}, Teacher! 👋
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    Track attendance, monitor progress, and support student learning
                  </p>
                </div>
              </div>
              
              {/* Quick Stats in Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <HeaderStatCard 
                  value={summary.totalStudents} 
                  label="Total Students" 
                  icon="👥"
                />
                <HeaderStatCard 
                  value={summary.activeStudents} 
                  label="Active" 
                  icon="✅"
                />
                <HeaderStatCard 
                  value={summary.needsAttentionStudents} 
                  label="Need Attention" 
                  icon="⚠️"
                  urgent={summary.needsAttentionStudents > 0}
                />
                <HeaderStatCard 
                  value={summary.atRiskStudents} 
                  label="At Risk" 
                  icon="🚨"
                  urgent={summary.atRiskStudents > 0}
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-4">
              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchStudents(true)}
                  disabled={refreshing}
                  className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                  <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-1">
                <ViewModeButton 
                  mode="grid" 
                  currentMode={viewMode} 
                  onClick={setViewMode}
                  icon={Bars3Icon}
                  label="Grid"
                />
                <ViewModeButton 
                  mode="list" 
                  currentMode={viewMode} 
                  onClick={setViewMode}
                  icon={ListBulletIcon}
                  label="List"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <EnhancedStatCard
            title="Total Students"
            value={summary.totalStudents}
            icon={UserGroupIcon}
            color="blue"
            subtitle="All enrolled students"
            onClick={() => {}}
          />
          
          <EnhancedStatCard
            title="Active Students"
            value={summary.activeStudents}
            icon={CheckCircleIcon}
            color="green"
            subtitle="Performing well"
            percentage={summary.totalStudents > 0 ? Math.round((summary.activeStudents / summary.totalStudents) * 100) : 0}
            onClick={() => setFilters(prev => ({ ...prev, status: 'active' }))}
          />
          
          <EnhancedStatCard
            title="Need Attention"
            value={summary.needsAttentionStudents}
            icon={ClockIcon}
            color="yellow"
            subtitle="Require follow-up"
            urgent={summary.needsAttentionStudents > 0}
            onClick={() => setFilters(prev => ({ ...prev, status: 'needs-attention' }))}
          />
          
          <EnhancedStatCard
            title="At Risk"
            value={summary.atRiskStudents}
            icon={ExclamationCircleIcon}
            color="red"
            subtitle="Need immediate help"
            urgent={summary.atRiskStudents > 0}
            onClick={() => setFilters(prev => ({ ...prev, status: 'at-risk' }))}
          />
        </div>

        {/* Enhanced Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Enhanced Filters */}
          <FiltersSection
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            hasFilters={!!(filters.search || filters.courseType || filters.progressRange || filters.status !== 'all')}
          />

          {/* Content Header */}
          <ContentHeader
            title="Students"
            count={filteredAndSortedStudents.length}
            selectedCount={selectedStudents.size}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={setSortBy}
            onSortOrderChange={setSortOrder}
            onSelectAll={selectAllStudents}
            viewMode={viewMode}
          />

          {/* Bulk Actions */}
          {selectedStudents.size > 0 && (
            <BulkActionsBar 
              selectedCount={selectedStudents.size}
              onAction={() => setShowBulkActionModal(true)}
              onClear={() => setSelectedStudents(new Set())}
            />
          )}

          {/* Content */}
          <div className="p-6">
            {filteredAndSortedStudents.length === 0 ? (
              <EmptyState 
                hasFilters={!!(filters.search || filters.courseType || filters.progressRange || filters.status !== 'all')}
                onClearFilters={clearFilters}
              />
            ) : (
              <ContentRenderer
                students={filteredAndSortedStudents}
                viewMode={viewMode}
                selectedStudents={selectedStudents}
                onStudentAction={handleStudentAction}
                onToggleSelect={toggleStudentSelection}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            )}
          </div>
        </div>
      </div>

      {/* Attendance Management Modal */}
      {showAttendanceModal && selectedStudent && (
        <AttendanceModal
          student={selectedStudent}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedStudent(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <BulkActionModal
          selectedCount={selectedStudents.size}
          onClose={() => setShowBulkActionModal(false)}
          onAction={(action) => {
            toast.success(`Bulk action "${action}" applied to ${selectedStudents.size} students`);
            setSelectedStudents(new Set());
            setShowBulkActionModal(false);
          }}
        />
      )}
    </div>
  );
};

// === COMPONENT PARTS (same as before but simplified action buttons) ===
const HeaderStatCard = ({ value, label, icon, urgent, className = "" }) => (
  <div className={`bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-3 relative transition-all duration-300 hover:bg-opacity-30 cursor-pointer ${className}`}>
    <div className={`text-2xl font-bold text-white ${urgent ? 'animate-pulse' : ''}`}>
      {value}
    </div>
    <div className="text-indigo-100 text-sm flex items-center">
      <span className="mr-2">{icon}</span>
      {label}
    </div>
    {urgent && value > 0 && (
      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
    )}
  </div>
);

const ViewModeButton = ({ mode, currentMode, onClick, icon: Icon, label }) => (
  <button
    onClick={() => onClick(mode)}
    className={`px-3 py-2 rounded-lg transition-all flex items-center ${
      currentMode === mode ? 'bg-white text-indigo-600' : 'text-white hover:bg-white hover:bg-opacity-20'
    }`}
  >
    <Icon className="h-4 w-4 mr-1" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const EnhancedStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle, 
  urgent, 
  percentage,
  onClick
}) => {
  const colorClasses = {
    blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', light: 'bg-blue-100', border: 'border-blue-200' },
    green: { bg: 'from-green-500 to-green-600', text: 'text-green-600', light: 'bg-green-100', border: 'border-green-200' },
    yellow: { bg: 'from-yellow-500 to-yellow-600', text: 'text-yellow-600', light: 'bg-yellow-100', border: 'border-yellow-200' },
    red: { bg: 'from-red-500 to-red-600', text: 'text-red-600', light: 'bg-red-100', border: 'border-red-200' }
  };

  const colors = colorClasses[color];

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-xl p-6 border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer ${
        urgent ? `${colors.border} ${colors.light} animate-pulse` : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-2xl bg-gradient-to-r ${colors.bg} shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        {percentage !== undefined && (
          <div className={`text-right ${colors.text}`}>
            <div className="text-2xl font-bold">{percentage}%</div>
            <div className="text-xs">of total</div>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
};

const FiltersSection = ({ filters, onFiltersChange, onClearFilters, hasFilters }) => (
  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
      </div>
      {hasFilters && (
        <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
          Filters Applied
        </div>
      )}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Search */}
      <div className="relative lg:col-span-2">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search students, courses..."
          value={filters.search}
          onChange={(e) => onFiltersChange(prev => ({ ...prev, search: e.target.value }))}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
        />
      </div>

      {/* Course Type */}
      <select
        value={filters.courseType}
        onChange={(e) => onFiltersChange(prev => ({ ...prev, courseType: e.target.value }))}
        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
      >
        <option value="">All Course Types</option>
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
        <option value="Standard">Standard</option>
      </select>

      {/* Progress Range */}
      <select
        value={filters.progressRange}
        onChange={(e) => onFiltersChange(prev => ({ ...prev, progressRange: e.target.value }))}
        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
      >
        <option value="">All Progress</option>
        <option value="0-25">0-25%</option>
        <option value="26-50">26-50%</option>
        <option value="51-75">51-75%</option>
        <option value="76-100">76-100%</option>
      </select>

      {/* Status Filter */}
      <select
        value={filters.status}
        onChange={(e) => onFiltersChange(prev => ({ ...prev, status: e.target.value }))}
        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="needs-attention">Needs Attention</option>
        <option value="at-risk">At Risk</option>
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 bg-white shadow-sm flex items-center justify-center"
        >
          <XMarkIcon className="h-4 w-4 mr-2" />
          Clear
        </button>
      )}
    </div>
  </div>
);

const ContentHeader = ({ 
  title, 
  count, 
  selectedCount, 
  sortBy, 
  sortOrder, 
  onSortChange, 
  onSortOrderChange, 
  onSelectAll, 
  viewMode 
}) => (
  <div className="p-6 border-b border-gray-200 bg-gray-50">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
      <div className="mb-4 lg:mb-0">
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600 mt-1">
          {count} {count === 1 ? 'student' : 'students'}
          {selectedCount > 0 && ` • ${selectedCount} selected`}
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="progress">Sort by Progress</option>
            <option value="attendance">Sort by Attendance</option>
            <option value="topics">Sort by Topics</option>
            <option value="status">Sort by Status</option>
            <option value="lastClass">Sort by Last Class</option>
          </select>
          
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors bg-white"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Select All Toggle */}
        {count > 0 && (
          <button
            onClick={onSelectAll}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors bg-white"
          >
            {selectedCount === count ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>
    </div>
  </div>
);

const BulkActionsBar = ({ selectedCount, onAction, onClear }) => (
  <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-blue-800 flex items-center">
        <CheckCircleIconSolid className="h-4 w-4 mr-2" />
        {selectedCount} students selected
      </span>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onAction('export_progress')}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export Progress
        </button>
        <button
          onClick={() => onAction('bulk_attendance')}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
        >
          Mark Attendance
        </button>
        <button
          onClick={() => onAction('send_notification')}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
        >
          Send Notification
        </button>
        <button
          onClick={onClear}
          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

const ContentRenderer = ({ 
  students, 
  viewMode, 
  selectedStudents, 
  onStudentAction, 
  onToggleSelect, 
  getStatusColor, 
  getStatusIcon 
}) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {students.map((student) => (
          <StudentListCard
            key={student._id}
            student={student}
            isSelected={selectedStudents.has(student._id)}
            onToggleSelect={() => onToggleSelect(student._id)}
            onAction={onStudentAction}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        ))}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {students.map((student) => (
        <StudentGridCard
          key={student._id}
          student={student}
          isSelected={selectedStudents.has(student._id)}
          onToggleSelect={() => onToggleSelect(student._id)}
          onAction={onStudentAction}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      ))}
    </div>
  );
};








const StudentGridCard = ({ 
  student, 
  isSelected, 
  onToggleSelect, 
  onAction, 
  getStatusColor, 
  getStatusIcon 
}) => {
  const StatusIcon = getStatusIcon(student.overallStatus);
  
  return (
    <div className={`border-2 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 bg-white transform hover:scale-105 ${
      isSelected ? 'border-blue-300 bg-blue-50 ring-4 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <StudentAvatar avatar={student.avatar} name={student.name} size="md" />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{student.name || 'Unknown Student'}</h3>
            <p className="text-sm text-gray-500">Grade {student.grade || 'N/A'}</p>
          </div>
        </div>
        
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${getStatusColor(student.overallStatus)}`}>
          <StatusIcon className="h-3 w-3 inline mr-1" />
          {student.overallStatus ? student.overallStatus.replace('-', ' ') : 'Unknown'}
        </span>
      </div>

      {/* Enhanced Progress Stats */}
      <div className="space-y-4 mb-6">
        <ProgressItem 
          label="Overall Progress" 
          value={student.averageProgress || 0} 
          color="blue" 
          icon={ChartBarIcon}
        />
        <ProgressItem 
          label="Attendance Rate" 
          value={student.attendanceRate || 0} 
          color="green" 
          icon={CheckCircleIcon}
        />
        <ProgressItem 
          label="Topics Completed" 
          value={student.topicCompletionRate || 0} 
          color="purple" 
          icon={BookOpenIcon}
        />
      </div>

      {/* Courses Preview */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <AcademicCapIcon className="h-4 w-4 mr-2" />
          Enrolled Courses:
        </p>
        <div className="space-y-1">
          {student.courses && student.courses.length > 0 ? (
            <>
              {student.courses.slice(0, 2).map((course) => (
                <div key={course._id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-700 font-medium truncate">{course.title}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                    {course.courseType}
                  </span>
                </div>
              ))}
              {student.courses.length > 2 && (
                <p className="text-xs text-gray-500 text-center">+{student.courses.length - 2} more courses</p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500 italic text-center py-2">No courses enrolled</p>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Classes:</span>
            <span className="font-semibold">{student.completedClasses || 0}/{student.totalClasses || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Topics:</span>
            <span className="font-semibold">{student.completedTopics || 0}/{student.totalTopics || 0}</span>
          </div>
        </div>
      </div>

      {/* SIMPLIFIED Action Buttons - Only Progress & Attendance */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAction(student._id, 'view_progress')}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-lg transform hover:scale-105"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Progress
          </button>
          <button
            onClick={() => onAction(student._id, 'manage_attendance')}
            className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center shadow-lg transform hover:scale-105"
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
            Attendance
          </button>
        </div>
        
        <button
          onClick={() => onAction(student._id, 'send_message')}
          className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center"
        >
          <EnvelopeIcon className="h-4 w-4 mr-2" />
          Send Message
        </button>
      </div>

      {/* Contact Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center truncate">
            <EnvelopeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{student.email || 'No email'}</span>
          </div>
          {student.lastClassDate && (
            <div className="ml-2 text-right">
              Last: {new Date(student.lastClassDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const StudentListCard = ({ student, isSelected, onToggleSelect, onAction, getStatusColor, getStatusIcon }) => {
  const StatusIcon = getStatusIcon(student.overallStatus);
  
  return (
    <div className={`border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 ${
      isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          
          <StudentAvatar avatar={student.avatar} name={student.name} size="sm" />
          
          <div>
            <h3 className="text-lg font-bold text-gray-900">{student.name || 'Unknown Student'}</h3>
            <p className="text-sm text-gray-600">{student.email || 'No email'}</p>
            <p className="text-sm text-gray-500">Grade: {student.grade || 'Not specified'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{student.averageProgress || 0}%</p>
            <p className="text-xs text-gray-500">Progress</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{student.attendanceRate || 0}%</p>
            <p className="text-xs text-gray-500">Attendance</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{student.topicCompletionRate || 0}%</p>
            <p className="text-xs text-gray-500">Topics</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border-2 ${getStatusColor(student.overallStatus)}`}>
              <StatusIcon className="h-4 w-4 inline mr-1" />
              {student.overallStatus ? student.overallStatus.replace('-', ' ') : 'Unknown'}
            </span>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onAction(student._id, 'view_progress')}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                title="View Progress"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onAction(student._id, 'manage_attendance')}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                title="Manage Attendance"
              >
                <ClipboardDocumentCheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onAction(student._id, 'manage_enrollment')}
                className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                title="Manage Enrollment"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Helper Components
const StudentAvatar = ({ avatar, name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-xl'
  };

  return (
    <div className="relative flex-shrink-0">
      {avatar ? (
        <img 
          src={avatar} 
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-md`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-md ${avatar ? 'hidden' : ''}`}>
        <span className="text-white font-bold">
          {name?.charAt(0) || 'S'}
        </span>
      </div>
    </div>
  );
};

const ProgressItem = ({ label, value, color, icon: Icon }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    orange: 'text-orange-600'
  };

  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-gray-600 flex items-center">
          {Icon && <Icon className={`h-4 w-4 mr-2 ${colorClasses[color]}`} />}
          {label}
        </span>
        <span className="font-bold text-lg">{value}%</span>
      </div>
      <ProgressBar percentage={value} color={color} height="h-3" />
    </div>
  );
};

const EmptyState = ({ hasFilters, onClearFilters, onNewEnrollment }) => (
  <div className="text-center py-20">
    <div className="mb-8">
      <UserGroupIconSolid className="h-32 w-32 text-gray-300 mx-auto" />
    </div>
    <h3 className="text-4xl font-bold text-gray-900 mb-4">
      {hasFilters ? 'No Students Found' : 'No Students Yet'}
    </h3>
    <p className="text-gray-600 text-xl mb-8 max-w-md mx-auto">
      {hasFilters 
        ? 'No students match your current filters. Try adjusting your search criteria.' 
        : 'Start by enrolling students to see them here and track their progress.'
      }
    </p>
    <div className="space-y-4">
      {hasFilters ? (
        <button
          onClick={onClearFilters}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center mx-auto"
        >
          <XMarkIcon className="h-6 w-6 mr-3" />
          Clear All Filters
        </button>
      ) : (
        <button
          onClick={onNewEnrollment}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center mx-auto"
        >
          <UserPlusIcon className="h-6 w-6 mr-3" />
          Enroll First Student
        </button>
      )}
    </div>
  </div>
);

// Enhanced Bulk Action Modal
const BulkActionModal = ({ selectedCount, onClose, onAction }) => (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
      <h2 className="text-2xl font-bold mb-4">Bulk Actions</h2>
      <p className="text-gray-600 mb-6">{selectedCount} students selected</p>
      <div className="space-y-3">
        <button 
          onClick={() => onAction('export_progress')} 
          className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Export Progress Reports
        </button>
        <button 
          onClick={() => onAction('bulk_attendance')} 
          className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
          Mark Bulk Attendance
        </button>
        <button 
          onClick={() => onAction('send_notification')} 
          className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
        >
          <EnvelopeIcon className="h-5 w-5 mr-2" />
          Send Notification
        </button>
        <button 
          onClick={() => onAction('generate_report')} 
          className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
        >
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Generate Report
        </button>
        <button 
          onClick={onClose} 
          className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default StudentsManagement;
