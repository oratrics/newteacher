// components/TeacherDashboard/AttendanceManagement.jsx - COMPREHENSIVE & BEAUTIFUL
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  BellIcon,
  FireIcon,
  SparklesIcon,
  StarIcon,
  XMarkIcon,
  CheckIcon,
  ClipboardIcon,
  GlobeAltIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  BoltIcon,
  BeakerIcon,
  WifiIcon,
  SignalIcon,
  EyeIcon,
  CogIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  MinusIcon,
  TableCellsIcon,
  Bars3Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import {
  CalendarIcon as CalendarIconSolid,
  ClockIcon as ClockIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  FireIcon as FireIconSolid,
  SparklesIcon as SparklesIconSolid,
  StarIcon as StarIconSolid,
  BoltIcon as BoltIconSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// === API CONFIGURATION ===
const API_BASE_URL = 'https://backend.oratrics.in/api';

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('teacherToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const attendanceAPI = {
  getPendingAttendance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/newteachers/attendance/pending${queryString ? `?${queryString}` : ''}`);
  },

  markAttendance: (data) =>
    apiCall('/newteachers/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkMarkAttendance: (data) =>
    apiCall('/newteachers/attendance/bulk-mark', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  rescheduleClass: (data) =>
    apiCall('/newteachers/class/reschedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelClass: (data) =>
    apiCall('/newteachers/class/cancel', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStatistics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/newteachers/attendance/statistics${queryString ? `?${queryString}` : ''}`);
  }
};

// === TIMEZONE UTILITIES ===
const getTimezoneAbbreviation = (timezone) => {
  const abbreviations = {
    'Asia/Kolkata': 'IST',
    'Asia/Dubai': 'GST',
    'Europe/London': 'GMT',
    'America/New_York': 'EST',
    'America/Los_Angeles': 'PST',
    'Australia/Sydney': 'AEST',
    'Asia/Singapore': 'SGT',
    'Asia/Tokyo': 'JST',
    'Europe/Berlin': 'CET'
  };
  return abbreviations[timezone] || timezone.split('/')[1];
};

const formatTimeInTimezone = (dateTime, timezone) => {
  try {
    return new Date(dateTime).toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return new Date(dateTime).toLocaleString();
  }
};

// === MAIN COMPONENT ===
const AttendanceManagement = () => {
  // === STATE MANAGEMENT ===
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all', // 'all', 'pending', 'overdue', 'rescheduled'
    studentId: '',
    courseId: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'table', 'calendar'
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [teacherTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Modal states
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Real-time clock
  const intervalRef = useRef(null);

  // === REAL-TIME CLOCK ===
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // === DATA FETCHING ===
  const fetchPendingAttendance = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('🔍 Fetching pending attendance with params:', params);

      const response = await attendanceAPI.getPendingAttendance(params);

      if (response && response.success) {
        setPendingAttendance(response.data || []);
        
        if (showRefreshing) {
          toast.success('📋 Attendance data refreshed!');
        }
      } else {
        throw new Error(response?.message || 'Failed to fetch attendance data');
      }

    } catch (err) {
      console.error('❌ Error fetching attendance:', err);
      setError(err.message);
      if (showRefreshing) {
        toast.error('Failed to refresh attendance data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, searchTerm, currentPage, itemsPerPage]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await attendanceAPI.getStatistics(filters);
      if (response && response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, [filters]);

  // === INITIAL LOAD ===
  useEffect(() => {
    fetchPendingAttendance();
    fetchStatistics();
  }, [fetchPendingAttendance, fetchStatistics]);

  // === ACTION HANDLERS ===
  const handleMarkAttendance = useCallback((attendanceItem) => {
    setSelectedAttendance(attendanceItem);
    setShowMarkModal(true);
  }, []);

  const handleReschedule = useCallback((attendanceItem) => {
    setSelectedAttendance(attendanceItem);
    setShowRescheduleModal(true);
  }, []);

  const handleBulkAction = useCallback(() => {
    if (selectedItems.size === 0) {
      toast.error('Please select items first');
      return;
    }
    setShowBulkModal(true);
  }, [selectedItems]);

  const handleSelectItem = useCallback((id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === pendingAttendance.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(pendingAttendance.map(item => item.classScheduleId)));
    }
  }, [selectedItems, pendingAttendance]);

  const onSuccess = useCallback((message) => {
    toast.success(message);
    fetchPendingAttendance(true);
    fetchStatistics();
    setSelectedItems(new Set());
    // Close all modals
    setShowMarkModal(false);
    setShowRescheduleModal(false);
    setShowBulkModal(false);
    setSelectedAttendance(null);
  }, [fetchPendingAttendance, fetchStatistics]);

  // === COMPUTED VALUES ===
  const filteredData = useMemo(() => {
    return pendingAttendance.filter(item => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        item.student?.name?.toLowerCase().includes(search) ||
        item.course?.title?.toLowerCase().includes(search) ||
        item.actualStatus?.toLowerCase().includes(search)
      );
    });
  }, [pendingAttendance, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const urgentCount = useMemo(() => {
    return pendingAttendance.filter(item => ['critical', 'high'].includes(item.urgency)).length;
  }, [pendingAttendance]);

  // === UTILITY FUNCTIONS ===
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTimeUntilClass = useCallback((classDate) => {
    const now = currentTime;
    const classTime = new Date(classDate);
    const diffMs = classTime - now;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffMs < 0) {
      const daysPast = Math.abs(diffDays);
      return { text: `${daysPast} days overdue`, color: 'text-red-600', urgent: true };
    }
    
    return { text: `in ${diffDays} days`, color: 'text-blue-600', urgent: false };
  }, [currentTime]);

  // === LOADING STATE ===
  if (loading) {
    return <AttendanceLoadingScreen />;
  }

  // === ERROR STATE ===
  if (error && pendingAttendance.length === 0) {
    return <AttendanceErrorScreen error={error} onRetry={() => fetchPendingAttendance()} />;
  }

  // === MAIN RENDER ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* FUTURISTIC HEADER */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-32 -translate-y-32 animate-pulse"></div>
          <div className="absolute top-20 right-20 w-48 h-48 bg-yellow-300 opacity-10 rounded-full animate-bounce"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <ClipboardDocumentCheckIcon className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                    <SparklesIcon className="h-4 w-4 text-yellow-900" />
                  </div>
                </div>
                
                <div className="ml-4">
                  <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                    {getGreeting()}, Teacher! 
                    <FireIconSolid className="h-10 w-10 text-orange-400 ml-3 animate-pulse" />
                  </h1>
                  <p className="text-purple-100 text-lg">
                    Smart attendance management system ⚡
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AttendanceStatCard
                  icon={ClipboardDocumentListIcon}
                  value={pendingAttendance.length}
                  label="Pending Items"
                  color="blue"
                  urgent={pendingAttendance.length > 0}
                />
                <AttendanceStatCard
                  icon={ExclamationTriangleIconSolid}
                  value={urgentCount}
                  label="Urgent"
                  color="red"
                  urgent={urgentCount > 0}
                />
                <AttendanceStatCard
                  icon={CheckCircleIconSolid}
                  value={selectedItems.size}
                  label="Selected"
                  color="green"
                />
                <AttendanceStatCard
                  icon={CalendarIconSolid}
                  value={statistics?.attendanceCompletionRate?.toFixed(0) || 0}
                  label="Completion %"
                  color="purple"
                />
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-4">
              {/* Time Display */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <ClockIconSolid className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white font-mono">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-sm text-purple-200">
                      {getTimezoneAbbreviation(teacherTimezone)} - Teaching Time
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchPendingAttendance(true)}
                  disabled={refreshing}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg font-semibold backdrop-blur-sm"
                >
                  <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Syncing...' : 'Refresh'}
                </button>

                <button
                  onClick={() => setShowStatisticsModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg font-semibold backdrop-blur-sm"
                >
                  <DocumentChartBarIcon className="h-5 w-5 mr-2" />
                  Statistics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ENHANCED FILTERS & CONTROLS */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FunnelIcon className="h-6 w-6 text-gray-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Smart Filters & Controls</h2>
              </div>
              <div className="flex items-center space-x-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-200 rounded-lg p-1">
                  <ViewModeButton
                    mode="cards"
                    currentMode={viewMode}
                    onClick={setViewMode}
                    icon={Bars3Icon}
                    label="Cards"
                  />
                  <ViewModeButton
                    mode="table"
                    currentMode={viewMode}
                    onClick={setViewMode}
                    icon={TableCellsIcon}
                    label="Table"
                  />
                  <ViewModeButton
                    mode="calendar"
                    currentMode={viewMode}
                    onClick={setViewMode}
                    icon={CalendarDaysIcon}
                    label="Calendar"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students, courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="rescheduled">Rescheduled</option>
              </select>

              {/* Date Range */}
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
              />
              
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
              />

              {/* Bulk Actions */}
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkAction}
                  className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center"
                >
                  <ClipboardIcon className="h-4 w-4 mr-2" />
                  Bulk ({selectedItems.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Content Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
                <p className="text-gray-600 mt-1">
                  {filteredData.length} items • {selectedItems.size} selected
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  {selectedItems.size === pendingAttendance.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {paginatedData.length === 0 ? (
              <AttendanceEmptyState />
            ) : (
              <AttendanceContentRenderer
                data={paginatedData}
                viewMode={viewMode}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onMarkAttendance={handleMarkAttendance}
                onReschedule={handleReschedule}
                teacherTimezone={teacherTimezone}
                getTimeUntilClass={getTimeUntilClass}
              />
            )}

            {/* Pagination */}
            {filteredData.length > itemsPerPage && (
              <AttendancePagination
                currentPage={currentPage}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showMarkModal && selectedAttendance && (
          <MarkAttendanceModal
            attendanceItem={selectedAttendance}
            onClose={() => {
              setShowMarkModal(false);
              setSelectedAttendance(null);
            }}
            onSuccess={onSuccess}
          />
        )}

        {showRescheduleModal && selectedAttendance && (
          <RescheduleModal
            attendanceItem={selectedAttendance}
            onClose={() => {
              setShowRescheduleModal(false);
              setSelectedAttendance(null);
            }}
            onSuccess={onSuccess}
          />
        )}

        {showBulkModal && (
          <BulkActionModal
            selectedItems={Array.from(selectedItems)}
            selectedData={pendingAttendance.filter(item => selectedItems.has(item.classScheduleId))}
            onClose={() => setShowBulkModal(false)}
            onSuccess={onSuccess}
          />
        )}

        {showStatisticsModal && statistics && (
          <StatisticsModal
            statistics={statistics}
            onClose={() => setShowStatisticsModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// === COMPONENT PARTS ===

const AttendanceLoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
    <div className="text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-24 h-24 border-4 border-pink-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse' }}></div>
        <ClipboardDocumentCheckIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white animate-pulse" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Loading Attendance System ⚡</h2>
      <p className="text-purple-300 text-lg">Analyzing attendance patterns and student data...</p>
    </div>
  </div>
);

const AttendanceErrorScreen = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-900 flex items-center justify-center">
    <div className="text-center max-w-md p-6">
      <ExclamationTriangleIconSolid className="mx-auto h-20 w-20 text-red-400 mb-6 animate-bounce" />
      <h2 className="text-3xl font-bold text-white mb-4">System Error Detected</h2>
      <p className="text-red-300 mb-6 bg-red-900/30 p-4 rounded-lg font-mono text-sm">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 font-semibold"
      >
        🔄 Retry System
      </button>
    </div>
  </div>
);

const AttendanceStatCard = ({ icon: Icon, value, label, color, urgent }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-orange-500',
    yellow: 'from-yellow-500 to-orange-500'
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all duration-300 ${urgent ? 'animate-pulse ring-2 ring-red-400/50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {urgent && value > 0 && (
          <div className="animate-bounce">
            <ExclamationTriangleIconSolid className="h-5 w-5 text-red-400" />
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-purple-200 text-sm">{label}</div>
      </div>
    </div>
  );
};

const ViewModeButton = ({ mode, currentMode, onClick, icon: Icon, label }) => (
  <button
    onClick={() => onClick(mode)}
    className={`px-3 py-2 rounded-lg transition-all flex items-center ${
      currentMode === mode ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-300'
    }`}
  >
    <Icon className="h-4 w-4 mr-1" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// Content Renderer Component
const AttendanceContentRenderer = ({ 
  data, 
  viewMode, 
  selectedItems, 
  onSelectItem, 
  onMarkAttendance, 
  onReschedule, 
  teacherTimezone,
  getTimeUntilClass 
}) => {
  if (viewMode === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <AttendanceTableRow
                key={item.classScheduleId}
                item={item}
                isSelected={selectedItems.has(item.classScheduleId)}
                onSelectItem={() => onSelectItem(item.classScheduleId)}
                onMarkAttendance={() => onMarkAttendance(item)}
                onReschedule={() => onReschedule(item)}
                teacherTimezone={teacherTimezone}
                getTimeUntilClass={getTimeUntilClass}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (viewMode === 'calendar') {
    return <AttendanceCalendarView data={data} onMarkAttendance={onMarkAttendance} />;
  }

  // Default: Cards view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item) => (
        <AttendanceCard
          key={item.classScheduleId}
          item={item}
          isSelected={selectedItems.has(item.classScheduleId)}
          onSelectItem={() => onSelectItem(item.classScheduleId)}
          onMarkAttendance={() => onMarkAttendance(item)}
          onReschedule={() => onReschedule(item)}
          teacherTimezone={teacherTimezone}
          getTimeUntilClass={getTimeUntilClass}
        />
      ))}
    </div>
  );
};

// Attendance Card Component
const AttendanceCard = ({ 
  item, 
  isSelected, 
  onSelectItem, 
  onMarkAttendance, 
  onReschedule, 
  teacherTimezone,
  getTimeUntilClass 
}) => {
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'from-red-500 to-pink-600 animate-pulse ring-2 ring-red-400/50';
      case 'high': return 'from-orange-500 to-red-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      case 'rescheduled': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const teacherTime = formatTimeInTimezone(item.classDate, teacherTimezone);
  const timeUntil = getTimeUntilClass(item.classDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] ${
        isSelected ? 'border-purple-400 bg-purple-50 ring-4 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`bg-gradient-to-r ${getUrgencyColor(item.urgency)} p-4 rounded-t-2xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelectItem}
              className="w-5 h-5 text-white border-white rounded focus:ring-white"
            />
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {(item.student?.name || 'S').charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{item.student?.name || 'Unknown Student'}</h3>
              <p className="text-white/80 text-sm">{item.course?.title || 'Unknown Course'}</p>
            </div>
          </div>
          
          {item.urgency === 'critical' && (
            <div className="animate-bounce">
              <FireIconSolid className="h-6 w-6 text-yellow-300" />
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Time Information */}
        <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
          <div className="flex items-center space-x-3 mb-2">
            <CalendarIconSolid className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-bold text-gray-900">{teacherTime}</div>
              <div className="text-xs text-blue-600">
                Teacher Time ({getTimezoneAbbreviation(teacherTimezone)})
              </div>
            </div>
          </div>
          
          <div className={`text-center p-2 rounded-lg ${timeUntil.urgent ? 'bg-red-100' : 'bg-blue-100'}`}>
            <span className={`font-bold ${timeUntil.color}`}>
              ⏰ {timeUntil.text}
            </span>
          </div>
        </div>

        {/* Status Information */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(item.actualStatus)}`}>
              {(item.actualStatus || 'pending').toUpperCase()}
            </span>
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
              item.urgency === 'critical' ? 'bg-red-100 text-red-700 animate-pulse' :
              item.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
              item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {item.urgency?.toUpperCase() || 'LOW'}
            </span>
          </div>

          {item.daysOverdue > 0 && (
            <div className="text-sm text-red-600 font-semibold">
              🚨 {item.daysOverdue} days overdue
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onMarkAttendance}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Mark
            </button>
            <button
              onClick={onReschedule}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Reschedule
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Table Row Component
const AttendanceTableRow = ({ 
  item, 
  isSelected, 
  onSelectItem, 
  onMarkAttendance, 
  onReschedule, 
  teacherTimezone,
  getTimeUntilClass 
}) => {
  const teacherTime = formatTimeInTimezone(item.classDate, teacherTimezone);
  const timeUntil = getTimeUntilClass(item.classDate);

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-purple-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelectItem}
          className="w-4 h-4 text-purple-600 border-gray-300 rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">
              {(item.student?.name || 'S').charAt(0)}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-bold text-gray-900">{item.student?.name || 'Unknown'}</div>
            <div className="text-sm text-gray-500">Grade {item.student?.grade || 'N/A'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-gray-900">{item.course?.title || 'Unknown Course'}</div>
        <div className="text-sm text-gray-500">{item.course?.courseType || 'N/A'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-gray-900">{teacherTime}</div>
        <div className={`text-sm ${timeUntil.color}`}>{timeUntil.text}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          item.actualStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          item.actualStatus === 'overdue' ? 'bg-red-100 text-red-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {(item.actualStatus || 'pending').toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
          item.urgency === 'critical' ? 'bg-red-100 text-red-700' :
          item.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
          item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {item.urgency?.toUpperCase() || 'LOW'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={onMarkAttendance}
            className="text-green-600 hover:text-green-900 transition-colors"
            title="Mark Attendance"
          >
            <CheckCircleIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onReschedule}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            title="Reschedule"
          >
            <ClockIcon className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Empty State Component
const AttendanceEmptyState = () => (
  <div className="text-center py-20">
    <div className="mb-8">
      <CheckCircleIconSolid className="h-24 w-24 text-gray-300 mx-auto animate-pulse" />
    </div>
    <h3 className="text-3xl font-bold text-gray-900 mb-4">All Caught Up! 🎉</h3>
    <p className="text-gray-600 text-lg max-w-md mx-auto">
      No pending attendance items found. Great job staying on top of your attendance management!
    </p>
  </div>
);

// Pagination Component
const AttendancePagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
      <div className="flex items-center text-sm text-gray-700">
        Showing {startItem} to {endItem} of {totalItems} items
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        
        <span className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">
          {currentPage}
        </span>
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Calendar View Component (Placeholder)
const AttendanceCalendarView = ({ data, onMarkAttendance }) => (
  <div className="text-center py-20">
    <CalendarDaysIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
    <h3 className="text-2xl font-bold text-gray-900 mb-4">Calendar View</h3>
    <p className="text-gray-600 mb-6">Calendar view coming soon with advanced scheduling features!</p>
    <button className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
      Enable Calendar View
    </button>
  </div>
);

// === MODAL COMPONENTS (Placeholder - implement as needed) ===
const MarkAttendanceModal = ({ attendanceItem, onClose, onSuccess }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">{attendanceItem?.student?.name}</h3>
          <p className="text-gray-600">{attendanceItem?.course?.title}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              // Implement mark as present
              onSuccess('Marked as present');
            }}
            className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
          >
            ✅ Present
          </button>
          <button
            onClick={() => {
              // Implement mark as absent
              onSuccess('Marked as absent');
            }}
            className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
          >
            ❌ Absent
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const RescheduleModal = ({ attendanceItem, onClose, onSuccess }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Reschedule Class</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">{attendanceItem?.student?.name}</h3>
          <p className="text-gray-600">{attendanceItem?.course?.title}</p>
        </div>
        
        <div className="space-y-3">
          <input
            type="date"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
            min={new Date().toISOString().split('T')[0]}
          />
          <input
            type="time"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Reason for rescheduling..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
            rows={3}
          />
        </div>
        
        <button
          onClick={() => onSuccess('Class rescheduled successfully')}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
        >
          🔄 Reschedule Class
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const BulkActionModal = ({ selectedItems, selectedData, onClose, onSuccess }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Bulk Actions</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-semibold">{selectedItems.length} items selected</p>
          <div className="text-sm text-gray-600 mt-2 max-h-32 overflow-y-auto">
            {selectedData.map((item, index) => (
              <div key={index} className="flex justify-between py-1">
                <span>{item.student?.name}</span>
                <span className="text-xs">{item.course?.title}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSuccess(`Bulk marked ${selectedItems.length} items as present`)}
            className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
          >
            ✅ All Present
          </button>
          <button
            onClick={() => onSuccess(`Bulk marked ${selectedItems.length} items as absent`)}
            className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
          >
            ❌ All Absent
          </button>
        </div>
        
        <button
          onClick={() => onSuccess('Bulk reschedule initiated')}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
        >
          🔄 Bulk Reschedule
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const StatisticsModal = ({ statistics, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Statistics</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
            <h3 className="font-bold text-blue-900">Total Classes</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalClasses}</p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
            <h3 className="font-bold text-green-900">Completed</h3>
            <p className="text-3xl font-bold text-green-600">{statistics.completedClasses}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
            <h3 className="font-bold text-purple-900">Attendance Rate</h3>
            <p className="text-3xl font-bold text-purple-600">{statistics.attendanceCompletionRate?.toFixed(1)}%</p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
            <h3 className="font-bold text-orange-900">Pending</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.classesPending}</p>
          </div>
        </div>
      </div>
      
      {/* Additional statistics can be added here */}
    </motion.div>
  </motion.div>
);

export default AttendanceManagement;
