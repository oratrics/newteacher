import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  AcademicCapIcon,
  UserIcon,
  PlayIcon,
  BookOpenIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  TrophyIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  XMarkIcon,
  FireIcon,
  BellIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  Bars3Icon,
  TableCellsIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  UsersIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  CalendarIcon as CalendarIconSolid,
  ClockIcon as ClockIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';

// Real API Service
const API_BASE_URL = 'https://backend.oratrics.in/api';

const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('teacherToken');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

const teacherAPI = {
    getClasses: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/newteachers/classes${queryString ? `?${queryString}` : ''}`);
    },
    
    getCourses: () => {
        return apiCall('/newteachers/courses');
    },
    
    updateClassStatus: (enrollmentId, classScheduleId, data) =>
        apiCall(`/newteachers/classes/${enrollmentId}/${classScheduleId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
    
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
    
    manageTopics: (enrollmentId, classScheduleId, data) =>
        apiCall(`/newteachers/classes/${enrollmentId}/${classScheduleId}/topics`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
    
    addNotes: (enrollmentId, classScheduleId, data) =>
        apiCall(`/newteachers/classes/${enrollmentId}/${classScheduleId}/notes`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Toast System
const toast = {
    success: (message) => {
        console.log('✅ Success:', message);
        // You can replace this with your actual toast library
        alert(`Success: ${message}`);
    },
    error: (message) => {
        console.log('❌ Error:', message);
        alert(`Error: ${message}`);
    },
    info: (message) => {
        console.log('ℹ️ Info:', message);
        alert(`Info: ${message}`);
    }
};

// Modal Components
const AttendanceModal = ({ classItem, onClose, onSuccess }) => {
    const [status, setStatus] = useState('completed');
    const [lateReason, setLateReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await teacherAPI.markAttendance(
                classItem.enrollmentId,
                classItem.classScheduleId,
                { 
                    status, 
                    lateReason: status === 'late' ? lateReason : null,
                    attendedAt: new Date().toISOString()
                }
            );
            
            if (result.success) {
                onSuccess('Attendance marked successfully');
                onClose();
            } else {
                toast.error(result.message || 'Failed to mark attendance');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
                <p className="text-gray-600 mb-4">
                    Student: <strong>{classItem.studentName}</strong>
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                        >
                            <option value="completed">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                    </div>

                    {status === 'late' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Reason for being late</label>
                            <textarea
                                value={lateReason}
                                onChange={(e) => setLateReason(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                rows={3}
                                placeholder="Enter reason for being late..."
                            />
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Attendance'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TopicManagementModal = ({ classItem, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [topicUpdates, setTopicUpdates] = useState([]);

    useEffect(() => {
        if (classItem.allTopics) {
            setTopicUpdates(classItem.allTopics.map(topic => ({
                topicId: topic._id,
                status: topic.status,
                teacherNotes: topic.teacherNotes || ''
            })));
        }
    }, [classItem]);

    const handleStatusChange = (index, newStatus) => {
        setTopicUpdates(prev => prev.map((update, i) => 
            i === index ? { ...update, status: newStatus } : update
        ));
    };

    const handleNotesChange = (index, notes) => {
        setTopicUpdates(prev => prev.map((update, i) => 
            i === index ? { ...update, teacherNotes: notes } : update
        ));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await teacherAPI.manageTopics(
                classItem.enrollmentId, 
                classItem.classScheduleId, 
                { topicUpdates }
            );
            
            if (result.success) {
                onSuccess('Topics updated successfully');
                onClose();
            } else {
                toast.error(result.message || 'Failed to update topics');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Manage Topics</h2>
                <p className="text-gray-600 mb-4">
                    Student: <strong>{classItem.studentName}</strong> | Course: <strong>{classItem.courseName}</strong>
                </p>
                
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {classItem.allTopics && classItem.allTopics.length > 0 ? (
                        classItem.allTopics.map((topic, index) => (
                            <div key={topic._id} className={`p-4 rounded-lg border ${
                                topicUpdates[index]?.status === 'completed' 
                                    ? 'bg-green-50 border-green-200' 
                                    : topicUpdates[index]?.status === 'ongoing'
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{topic.topicTitle}</h4>
                                        <p className="text-sm text-gray-500">{topic.chapterTitle}</p>
                                    </div>
                                    <select
                                        value={topicUpdates[index]?.status || topic.status}
                                        onChange={(e) => handleStatusChange(index, e.target.value)}
                                        className="px-3 py-1 border rounded text-sm ml-4"
                                    >
                                        <option value="not-started">Not Started</option>
                                        <option value="ongoing">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teacher Notes
                                    </label>
                                    <textarea
                                        value={topicUpdates[index]?.teacherNotes || ''}
                                        onChange={(e) => handleNotesChange(index, e.target.value)}
                                        className="w-full p-2 border rounded text-sm"
                                        rows={2}
                                        placeholder="Add notes about this topic..."
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-8">No topics available for this course</p>
                    )}
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const PerformanceModal = ({ classItem, onClose, onSuccess }) => {
    const [score, setScore] = useState(classItem.performanceScore || '');
    const [feedback, setFeedback] = useState(classItem.performanceFeedback || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!score || score < 0 || score > 100) {
            toast.error('Please enter a valid score between 0 and 100');
            return;
        }
        
        if (!feedback.trim()) {
            toast.error('Please provide feedback');
            return;
        }

        setLoading(true);

        try {
            const result = await teacherAPI.addPerformance(
                classItem.enrollmentId,
                classItem.classScheduleId,
                { score: parseInt(score), feedback: feedback.trim() }
            );
            
            if (result.success) {
                onSuccess('Performance added successfully');
                onClose();
            } else {
                toast.error(result.message || 'Failed to add performance');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Add Performance</h2>
                <p className="text-gray-600 mb-4">
                    Student: <strong>{classItem.studentName}</strong>
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Score (0-100)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            required
                            placeholder="Enter score out of 100"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Feedback *</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            rows={4}
                            placeholder="Enter your feedback about student performance..."
                            required
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {feedback.length}/1000 characters
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Performance'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StudentInfoModal = ({ studentData, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Student Information</h2>
                
                <div className="space-y-4">
                    <div className="flex items-center space-x-4 mb-4">
                        <StudentAvatar avatar={studentData.studentAvatar} name={studentData.studentName} />
                        <div>
                            <h3 className="font-semibold text-lg">{studentData.studentName}</h3>
                            <p className="text-gray-600">{studentData.studentEmail}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Course</p>
                            <p className="font-medium">{studentData.courseName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Progress</p>
                            <p className="font-medium">{studentData.studentProgress || 0}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Classes Completed</p>
                            <p className="font-medium">{studentData.completedClasses || 0}/{studentData.totalClasses || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Topics Covered</p>
                            <p className="font-medium">{studentData.completedTopics || 0}/{studentData.totalTopicsInCourse || 0}</p>
                        </div>
                    </div>

                    {studentData.studentPhone && (
                        <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{studentData.studentPhone}</p>
                        </div>
                    )}

                    {studentData.parentName && (
                        <div>
                            <p className="text-sm text-gray-600">Parent Name</p>
                            <p className="font-medium">{studentData.parentName}</p>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const NotesModal = ({ classItem, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [pinned, setPinned] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !content.trim()) {
            toast.error('Title and content are required');
            return;
        }

        setLoading(true);

        try {
            const result = await teacherAPI.addNotes(
                classItem.enrollmentId,
                classItem.classScheduleId,
                { 
                    title: title.trim(), 
                    content: content.trim(),
                    tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                    pinned
                }
            );
            
            if (result.success) {
                onSuccess('Notes added successfully');
                onClose();
            } else {
                toast.error(result.message || 'Failed to add notes');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Add Notes</h2>
                <p className="text-gray-600 mb-4">
                    Student: <strong>{classItem.studentName}</strong>
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            required
                            maxLength={200}
                            placeholder="Enter note title..."
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Content *</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            rows={6}
                            placeholder="Enter your notes..."
                            required
                            maxLength={5000}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {content.length}/5000 characters
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            placeholder="Enter tags separated by commas..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Separate multiple tags with commas
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={pinned}
                                onChange={(e) => setPinned(e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium">Pin this note</span>
                        </label>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Notes'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Component
const ClassesManagement = () => {
    // === STATE MANAGEMENT ===
    const [classesData, setClassesData] = useState({
        todayClasses: [],
        upcomingClasses: [],
        pendingAttendance: [],
        allClasses: [],
        counts: {
            today: 0,
            upcoming: 0,
            pendingAttendance: 0,
            total: 0
        }
    });
    
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('today');
    const [viewMode, setViewMode] = useState('cards');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('asc');
    const [expandedCards, setExpandedCards] = useState(new Set());
    
    // Modal states
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showPerformanceModal, setShowPerformanceModal] = useState(false);
    const [showStudentInfoModal, setShowStudentInfoModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [error, setError] = useState(null);

    // === DATA FETCHING ===
    const fetchCourses = useCallback(async () => {
        try {
            const response = await teacherAPI.getCourses();
            if (response && response.success) {
                setCourses(response.data);
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
        }
    }, []);

    const fetchClasses = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            
            setError(null);
            
            const params = {};
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (statusFilter) params.status = statusFilter;
            if (dateFilter) params.date = dateFilter;
            if (courseFilter) params.courseId = courseFilter;
            if (priorityFilter) params.priority = priorityFilter;
            
            console.log('Fetching classes with params:', params);
            
            const response = await teacherAPI.getClasses(params);
            
            if (response && response.success) {
                console.log('Classes data received:', response.data);
                setClassesData(response.data);
                if (showRefreshing) {
                    toast.success('Classes refreshed successfully!');
                }
            } else {
                const errorMsg = response?.message || 'Failed to load classes';
                console.error('API Error:', errorMsg);
                setError(errorMsg);
                setClassesData({
                    todayClasses: [],
                    upcomingClasses: [],
                    pendingAttendance: [],
                    allClasses: [],
                    counts: { today: 0, upcoming: 0, pendingAttendance: 0, total: 0 }
                });
            }
        } catch (error) {
            console.error('Network error fetching classes:', error);
            const errorMsg = error.message || 'Network error: Unable to load classes';
            setError(errorMsg);
            setClassesData({
                todayClasses: [],
                upcomingClasses: [],
                pendingAttendance: [],
                allClasses: [],
                counts: { today: 0, upcoming: 0, pendingAttendance: 0, total: 0 }
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchTerm, statusFilter, dateFilter, courseFilter, priorityFilter]);

    // Initial load
    useEffect(() => {
        fetchCourses();
        fetchClasses();
    }, [fetchCourses, fetchClasses]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== '' || statusFilter !== '' || dateFilter !== '' || courseFilter !== '' || priorityFilter !== '') {
                fetchClasses();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, dateFilter, courseFilter, priorityFilter, fetchClasses]);

    // === ACTION HANDLERS ===
    const handleAction = useCallback((classItem, action) => {
        console.log('Handle action called:', { action, classItem });
        
        if (!classItem && action !== 'schedule_class') {
            toast.error('Invalid class data');
            return;
        }

        const enhancedClassItem = classItem ? {
            ...classItem,
            courseId: classItem.courseId || classItem.course?._id || classItem.course || null
        } : null;

        switch (action) {
            case 'start_class':
            case 'mark_attendance':
            case 'complete_attendance':
            case 'mark_missed':
                setSelectedClass(enhancedClassItem);
                setShowAttendanceModal(true);
                break;
                
            case 'manage_topics':
                setSelectedClass(enhancedClassItem);
                setShowTopicModal(true);
                break;
                
            case 'add_performance':
            case 'edit_performance':
                setSelectedClass(enhancedClassItem);
                setShowPerformanceModal(true);
                break;
                
            case 'view_student':
                setSelectedStudent(enhancedClassItem);
                setShowStudentInfoModal(true);
                break;
                
            case 'add_notes':
                setSelectedClass(enhancedClassItem);
                setShowNotesModal(true);
                break;
                
            case 'join_class':
                if (classItem.joinUrl) {
                    window.open(classItem.joinUrl, '_blank');
                    toast.success('Opening class meeting...');
                } else {
                    toast.info('Starting video call...');
                }
                break;
                
            case 'call_student':
                if (classItem.studentPhone) {
                    window.open(`tel:${classItem.studentPhone}`);
                } else {
                    toast.error('No phone number available');
                }
                break;
                
            case 'schedule_class':
                toast.info('Class scheduling feature coming soon!');
                break;
                
            default:
                console.warn('Unknown action:', action);
                toast.error('Unknown action requested');
                break;
        }
    }, []);

    const onSuccess = useCallback((message) => {
        toast.success(message || 'Action completed successfully!');
        fetchClasses(true);
        // Close all modals
        setShowAttendanceModal(false);
        setShowTopicModal(false);
        setShowPerformanceModal(false);
        setShowStudentInfoModal(false);
        setShowNotesModal(false);
        setSelectedClass(null);
        setSelectedStudent(null);
    }, [fetchClasses]);

    // === DATA PROCESSING ===
    const currentTabData = useMemo(() => {
        let data = [];
        switch (activeTab) {
            case 'today':
                data = classesData.todayClasses || [];
                break;
            case 'pending':
                data = classesData.pendingAttendance || [];
                break;
            case 'upcoming':
                data = classesData.upcomingClasses || [];
                break;
            case 'all':
                data = classesData.allClasses || [];
                break;
            default:
                data = [];
        }

        // Apply additional filters (these are client-side filters)
        let filteredData = data.filter(item => {
            if (courseFilter && item.courseId !== courseFilter) return false;
            if (priorityFilter && item.priority !== priorityFilter) return false;
            return true;
        });

        // Apply sorting
        filteredData.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.classDate || 0);
                    bValue = new Date(b.classDate || 0);
                    break;
                case 'student':
                    aValue = a.studentName?.toLowerCase() || '';
                    bValue = b.studentName?.toLowerCase() || '';
                    break;
                case 'course':
                    aValue = a.courseName?.toLowerCase() || '';
                    bValue = b.courseName?.toLowerCase() || '';
                    break;
                case 'status':
                    aValue = a.classStatus || '';
                    bValue = b.classStatus || '';
                    break;
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    aValue = priorityOrder[a.priority] || 0;
                    bValue = priorityOrder[b.priority] || 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filteredData;
    }, [activeTab, classesData, courseFilter, priorityFilter, sortBy, sortOrder]);

    // UI Handlers
    const toggleCardExpansion = useCallback((cardId) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cardId)) {
                newSet.delete(cardId);
            } else {
                newSet.add(cardId);
            }
            return newSet;
        });
    }, []);

    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('');
        setDateFilter('');
        setCourseFilter('');
        setPriorityFilter('');
        setSortBy('date');
        setSortOrder('asc');
        toast.success('Filters cleared');
    }, []);

    // === UTILITY FUNCTIONS ===
    const getTabTitle = () => {
        const tabTitles = {
            today: "Today's Classes",
            pending: "Classes Needing Attention", 
            upcoming: "Upcoming Classes",
            all: "All Classes"
        };
        return tabTitles[activeTab] || "Classes";
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // === LOADING STATE ===
    if (loading) {
        return <LoadingScreen />;
    }

    // === ERROR STATE ===
    if (error && classesData.allClasses.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Classes</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => fetchClasses()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { counts } = classesData;

    // === MAIN RENDER ===
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Enhanced Header */}
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-5"></div>
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-32 -translate-y-32 animate-pulse"></div>
                    <div className="absolute top-20 right-20 w-48 h-48 bg-yellow-300 opacity-10 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-pink-300 opacity-10 rounded-full animate-pulse delay-1000"></div>
                </div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="mb-6 lg:mb-0">
                            <div className="flex items-center mb-4">
                                <div className="p-4 bg-white bg-opacity-20 rounded-2xl mr-4">
                                    <FireIconSolid className="h-10 w-10 text-orange-300" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        {getGreeting()}, Teacher! 👋
                                    </h1>
                                    <p className="text-blue-100 text-lg">
                                        Manage your teaching schedule and track student progress
                                    </p>
                                </div>
                            </div>
                            
                            {/* Quick Stats in Header */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <HeaderStatCard 
                                    value={counts.today} 
                                    label="Today's Classes" 
                                    urgent={counts.today > 0} 
                                />
                                <HeaderStatCard 
                                    value={counts.pendingAttendance} 
                                    label="Need Attention" 
                                    urgent={counts.pendingAttendance > 0}
                                    className="animate-pulse"
                                />
                                <HeaderStatCard 
                                    value={counts.upcoming} 
                                    label="Upcoming" 
                                />
                                <HeaderStatCard 
                                    value={counts.total} 
                                    label="Total Classes" 
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col space-y-4">
                            {/* Action Buttons */}
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => fetchClasses(true)}
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
                {/* Enhanced Main Content Card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Enhanced Tabs */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 py-4">
                            <nav className="flex flex-wrap gap-2 mb-4 lg:mb-0">
                                {[
                                    { 
                                        id: 'today', 
                                        label: `Today (${counts.today})`, 
                                        urgent: counts.today > 0,
                                        icon: CalendarIconSolid,
                                        color: 'blue'
                                    },
                                    { 
                                        id: 'pending', 
                                        label: `Needs Attention (${counts.pendingAttendance})`, 
                                        urgent: counts.pendingAttendance > 0,
                                        icon: ExclamationTriangleIconSolid,
                                        color: 'red'
                                    },
                                    { 
                                        id: 'upcoming', 
                                        label: `Upcoming (${counts.upcoming})`,
                                        icon: ClockIconSolid,
                                        color: 'green'
                                    },
                                    { 
                                        id: 'all', 
                                        label: `All (${counts.total})`,
                                        icon: AcademicCapIconSolid,
                                        color: 'gray'
                                    }
                                ].map((tab) => (
                                    <TabButton
                                        key={tab.id}
                                        tab={tab}
                                        activeTab={activeTab}
                                        onClick={setActiveTab}
                                    />
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Enhanced Filters */}
                    <FiltersSection
                        activeTab={activeTab}
                        searchTerm={searchTerm}
                        statusFilter={statusFilter}
                        dateFilter={dateFilter}
                        courseFilter={courseFilter}
                        priorityFilter={priorityFilter}
                        courses={courses}
                        onSearchChange={setSearchTerm}
                        onStatusChange={setStatusFilter}
                        onDateChange={setDateFilter}
                        onCourseChange={setCourseFilter}
                        onPriorityChange={setPriorityFilter}
                        onClearFilters={clearFilters}
                        hasFilters={!!(searchTerm || statusFilter || dateFilter || courseFilter || priorityFilter)}
                    />

                    {/* Content Header */}
                    <ContentHeader
                        title={getTabTitle()}
                        count={currentTabData.length}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSortChange={setSortBy}
                        onSortOrderChange={setSortOrder}
                        viewMode={viewMode}
                    />

                    {/* Content */}
                    <div className="p-6">
                        {currentTabData.length === 0 ? (
                            <EmptyState activeTab={activeTab} onAction={handleAction} />
                        ) : (
                            <ContentRenderer
                                data={currentTabData}
                                viewMode={viewMode}
                                expandedCards={expandedCards}
                                onAction={handleAction}
                                onToggleExpand={toggleCardExpansion}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* All Modals */}
            {showAttendanceModal && selectedClass && (
                <AttendanceModal
                    classItem={selectedClass}
                    onClose={() => { setShowAttendanceModal(false); setSelectedClass(null); }}
                    onSuccess={onSuccess}
                />
            )}

            {showTopicModal && selectedClass && (
                <TopicManagementModal
                    classItem={selectedClass}
                    onClose={() => { setShowTopicModal(false); setSelectedClass(null); }}
                    onSuccess={onSuccess}
                />
            )}

            {showPerformanceModal && selectedClass && (
                <PerformanceModal
                    classItem={selectedClass}
                    onClose={() => { setShowPerformanceModal(false); setSelectedClass(null); }}
                    onSuccess={onSuccess}
                />
            )}

            {showStudentInfoModal && selectedStudent && (
                <StudentInfoModal
                    studentData={selectedStudent}
                    onClose={() => { setShowStudentInfoModal(false); setSelectedStudent(null); }}
                />
            )}

            {showNotesModal && selectedClass && (
                <NotesModal
                    classItem={selectedClass}
                    onClose={() => { setShowNotesModal(false); setSelectedClass(null); }}
                    onSuccess={onSuccess}
                />
            )}
        </div>
    );
};

// === COMPONENT PARTS ===

const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
            <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-30"></div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Loading Classes...</h2>
            <p className="text-gray-600 text-lg">Preparing your teaching command center ✨</p>
            <div className="mt-4 w-64 bg-gray-200 rounded-full h-2 mx-auto">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
            </div>
        </div>
    </div>
);

const HeaderStatCard = ({ value, label, urgent, className = "" }) => (
    <div className={`relative bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-3 ${className}`}>
        <div className={`text-2xl font-bold text-white ${urgent ? 'animate-pulse' : ''}`}>
            {value}
        </div>
        <div className="text-white text-sm">{label}</div>
        {urgent && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
        )}
    </div>
);

const ViewModeButton = ({ mode, currentMode, onClick, icon: Icon, label }) => (
    <button
        onClick={() => onClick(mode)}
        className={`px-3 py-2 rounded-lg transition-all flex items-center ${
            currentMode === mode ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'
        }`}
    >
        <Icon className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const TabButton = ({ tab, activeTab, onClick }) => (
    <button
        onClick={() => onClick(tab.id)}
        className={`py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 relative flex items-center space-x-2 ${
            activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-md'
        }`}
    >
        <tab.icon className="h-4 w-4" />
        <span>{tab.label}</span>
        {tab.urgent && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
        )}
    </button>
);

const FiltersSection = ({ 
    activeTab, 
    searchTerm, 
    statusFilter, 
    dateFilter, 
    courseFilter,
    priorityFilter,
    courses, 
    onSearchChange, 
    onStatusChange, 
    onDateChange,
    onCourseChange,
    onPriorityChange,
    onClearFilters,
    hasFilters 
}) => (
    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search students, courses, or topics..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
                />
            </div>
            
            <div className="flex flex-wrap gap-3">
                {activeTab === 'all' && (
                    <>
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="in-progress">In Progress</option>
                            <option value="missed">Missed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={courseFilter}
                            onChange={(e) => onCourseChange(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
                        >
                            <option value="">All Courses</option>
                            {courses.map(course => (
                                <option key={course._id} value={course._id}>{course.title}</option>
                            ))}
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => onPriorityChange(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
                        >
                            <option value="">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm"
                        />
                    </>
                )}

                {hasFilters && (
                    <button
                        onClick={onClearFilters}
                        className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 bg-white shadow-sm flex items-center"
                    >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    </div>
);

const ContentHeader = ({ 
    title, 
    count, 
    sortBy, 
    sortOrder, 
    onSortChange, 
    onSortOrderChange, 
    viewMode 
}) => (
    <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
                <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-600 mt-1">
                    {count} {count === 1 ? 'class' : 'classes'}
                </p>
            </div>
            
            <div className="flex items-center space-x-4">
                {/* Sort Controls */}
                <div className="flex items-center space-x-2">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="student">Sort by Student</option>
                        <option value="course">Sort by Course</option>
                        <option value="status">Sort by Status</option>
                        <option value="priority">Sort by Priority</option>
                    </select>
                    
                    <button
                        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const ContentRenderer = ({ 
    data, 
    viewMode, 
    expandedCards, 
    onAction, 
    onToggleExpand
}) => {
    switch (viewMode) {
        case 'table':
            return <ClassesTable classes={data} onAction={onAction} />;
        case 'list':
            return <ClassesList classes={data} onAction={onAction} />;
        default:
            return (
                <div className="space-y-6">
                    {data.map((classItem, index) => (
                        <EnhancedClassCard
                            key={`${classItem.classScheduleId || classItem.enrollmentId}-${index}`}
                            classItem={classItem}
                            onAction={onAction}
                            isExpanded={expandedCards.has(classItem.classScheduleId || classItem.enrollmentId)}
                            onToggleExpand={() => onToggleExpand(classItem.classScheduleId || classItem.enrollmentId)}
                        />
                    ))}
                </div>
            );
    }
};

// === CARD COMPONENTS ===

const EnhancedClassCard = ({ 
    classItem, 
    onAction, 
    isExpanded, 
    onToggleExpand
}) => {
    if (!classItem) return null;

    return (
        <ProductionClassCard 
            classItem={classItem} 
            onAction={onAction} 
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
        />
    );
};

const ProductionClassCard = ({ 
    classItem, 
    onAction, 
    isExpanded, 
    onToggleExpand
}) => {
    const formatDate = (date) => {
        if (!date) return 'No date';
        try {
            const classDate = new Date(date);
            if (isNaN(classDate.getTime())) return 'Invalid date';
            
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (classDate.toDateString() === today.toDateString()) return 'Today';
            if (classDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
            
            return classDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const formatTime = (time) => {
        if (!time) return 'No time';
        try {
            if (time.includes(':')) {
                return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
            return time;
        } catch {
            return time;
        }
    };

    const getStatusBadge = () => {
        const status = classItem.classStatus;
        const hasAttendance = classItem.hasAttendance;
        const hasPerformance = classItem.hasPerformance;
        
        if (status === 'completed' && hasAttendance && hasPerformance) {
            return { text: '✓ Complete', className: 'bg-green-100 text-green-800 border-green-200' };
        }
        if (status === 'completed' && !hasAttendance) {
            return { text: '⚠ Missing Attendance', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
        }
        if (status === 'completed' && !hasPerformance) {
            return { text: '⚠ Missing Performance', className: 'bg-orange-100 text-orange-800 border-orange-200' };
        }
        if (status === 'pending' && classItem.classDate && new Date(classItem.classDate) < new Date()) {
            return { text: '! Overdue', className: 'bg-red-100 text-red-800 border-red-200' };
        }
        if (status === 'pending') {
            return { text: '⏳ Scheduled', className: 'bg-blue-100 text-blue-800 border-blue-200' };
        }
        
        return { text: status || 'unknown', className: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    const statusBadge = getStatusBadge();
    const priorityColors = {
        urgent: 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50 shadow-red-100',
        high: 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-yellow-100',
        medium: 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-blue-100',
        low: 'border-gray-200 bg-white shadow-gray-100'
    };

    return (
        <div className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] shadow-lg ${
            priorityColors[classItem.priority] || priorityColors.low
        }`}>
            
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <StudentAvatar avatar={classItem.studentAvatar} name={classItem.studentName} />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                    </div>
                    
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 flex items-center">
                            {classItem.studentName}
                            {classItem.priority === 'urgent' && (
                                <FireIcon className="h-5 w-5 text-red-500 ml-2 animate-pulse" />
                            )}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1" />
                            {classItem.courseName}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {formatDate(classItem.classDate)}
                            </span>
                            <span className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {formatTime(classItem.classTime)}
                            </span>
                            <span className="flex items-center">
                                <BookOpenIcon className="h-4 w-4 mr-1" />
                                {classItem.completedTopics || 0}/{classItem.totalTopicsInCourse || 0} topics
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border-2 ${statusBadge.className}`}>
                        {statusBadge.text}
                    </span>
                    
                    {classItem.priority === 'urgent' && (
                        <span className="px-3 py-1 text-xs bg-red-500 text-white rounded-full animate-bounce font-bold">
                            URGENT
                        </span>
                    )}
                </div>
            </div>

            {/* Progress Section */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <ProgressCard
                    title="Overall Progress"
                    value={`${classItem.studentProgress || 0}%`}
                    color="blue"
                    icon={TrophyIcon}
                />
                <ProgressCard
                    title="Classes"
                    value={`${classItem.completedClasses || 0}/${classItem.totalClasses || 0}`}
                    color="green"
                    icon={CalendarIcon}
                />
                <ProgressCard
                    title="Topics"
                    value={`${classItem.completedTopics || 0}/${classItem.totalTopicsInCourse || 0}`}
                    color="purple"
                    icon={BookOpenIcon}
                />
                <ProgressCard
                    title="Performance"
                    value={classItem.performanceScore ? `${classItem.performanceScore}%` : 'N/A'}
                    color="yellow"
                    icon={StarIcon}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
                {getActionButtons(classItem, onAction)}
            </div>

            {/* Expand/Collapse Button */}
            <div className="flex justify-center">
                <button
                    onClick={onToggleExpand}
                    className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                    {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                    <span className="font-medium">{isExpanded ? 'Show Less Details' : 'Show More Details'}</span>
                </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="mt-6 pt-6 border-t-2 border-gray-100">
                    <ExpandedClassDetails classItem={classItem} onAction={onAction} />
                </div>
            )}
        </div>
    );
};

// Progress Card Component
const ProgressCard = ({ title, value, color, icon: Icon }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50 border-blue-100',
        green: 'from-green-500 to-green-600 text-green-600 bg-green-50 border-green-100',
        purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50 border-purple-100',
        yellow: 'from-yellow-500 to-yellow-600 text-yellow-600 bg-yellow-50 border-yellow-100'
    };

    return (
        <div className={`text-center p-4 rounded-xl border-2 transition-all hover:shadow-md ${colors[color].split(' ').slice(-3).join(' ')}`}>
            <div className={`p-3 rounded-xl bg-gradient-to-r ${colors[color].split(' ').slice(0, 2).join(' ')} w-fit mx-auto mb-2`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div className={`text-2xl font-bold ${colors[color].split(' ')[2]}`}>{value}</div>
            <p className="text-xs text-gray-600 mt-1">{title}</p>
        </div>
    );
};

// Action Buttons Generator
const getActionButtons = (classItem, onAction) => {
    const buttons = [];
    
    // Primary actions based on class status
    switch (classItem.actionRequired) {
        case 'start_class':
            buttons.push(
                <ActionButton
                    key="start"
                    onClick={() => onAction(classItem, 'start_class')}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    icon={PlayIcon}
                    text="Start Class"
                    pulse
                />
            );
            break;
        case 'mark_attendance':
            buttons.push(
                <ActionButton
                    key="attendance"
                    onClick={() => onAction(classItem, 'mark_attendance')}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    icon={CheckCircleIcon}
                    text="Mark Attendance"
                    pulse
                />
            );
            break;
        case 'add_performance':
            buttons.push(
                <ActionButton
                    key="performance"
                    onClick={() => onAction(classItem, 'add_performance')}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                    icon={StarIcon}
                    text="Add Performance"
                />
            );
            break;
    }

    // Secondary actions
    buttons.push(
        <ActionButton
            key="topics"
            onClick={() => onAction(classItem, 'manage_topics')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            icon={BookOpenIcon}
            text="Manage Topics"
        />
    );

    buttons.push(
        <ActionButton
            key="student"
            onClick={() => onAction(classItem, 'view_student')}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            icon={UserIcon}
            text="Student Info"
        />
    );

    buttons.push(
        <ActionButton
            key="notes"
            onClick={() => onAction(classItem, 'add_notes')}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            icon={DocumentTextIcon}
            text="Notes"
        />
    );

    // Communication buttons
    if (classItem.studentPhone) {
        buttons.push(
            <ActionButton
                key="call"
                onClick={() => onAction(classItem, 'call_student')}
                className="border-2 border-green-300 text-green-700 hover:bg-green-50"
                icon={PhoneIcon}
                text="Call Student"
            />
        );
    }

    if (classItem.joinUrl) {
        buttons.push(
            <ActionButton
                key="join"
                onClick={() => onAction(classItem, 'join_class')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                icon={VideoCameraIcon}
                text="Join Class"
            />
        );
    }

    return buttons;
};

// Action Button Component
const ActionButton = ({ onClick, className, icon: Icon, text, pulse }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center font-medium ${className} ${
            pulse ? 'animate-pulse' : ''
        }`}
    >
        <Icon className="h-4 w-4 mr-2" />
        {text}
    </button>
);

// Student Avatar Component
const StudentAvatar = ({ avatar, name }) => (
    <div className="relative">
        {avatar ? (
            <img
                src={avatar}
                alt={name}
                className="h-16 w-16 rounded-2xl object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                }}
            />
        ) : null}
        <div className={`h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg ${avatar ? 'hidden' : ''}`}>
            <span className="text-white font-bold text-xl">
                {name?.charAt(0) || 'S'}
            </span>
        </div>
    </div>
);

const EmptyState = ({ activeTab, onAction }) => {
    const getEmptyContent = () => {
        switch (activeTab) {
            case 'today':
                return {
                    icon: CalendarIconSolid,
                    title: 'No Classes Today! 🎉',
                    message: 'Take a well-deserved break and plan for tomorrow.',
                    action: 'Plan Tomorrow\'s Classes'
                };
            case 'pending':
                return {
                    icon: CheckCircleIconSolid,
                    title: 'All Caught Up! ✨',
                    message: 'No classes need your attention right now.',
                    action: null
                };
            case 'upcoming':
                return {
                    icon: ClockIconSolid,
                    title: 'No Upcoming Classes 📚',
                    message: 'Time to plan some lessons!',
                    action: 'Schedule New Class'
                };
            default:
                return {
                    icon: AcademicCapIconSolid,
                    title: 'No Classes Found 🚀',
                    message: 'Start by adding some students and scheduling classes!',
                    action: 'Get Started'
                };
        }
    };

    const content = getEmptyContent();

    return (
        <div className="text-center py-20">
            <div className="mb-8">
                <content.icon className="h-24 w-24 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">{content.message}</p>
            {content.action && (
                <button
                    onClick={() => onAction(null, 'schedule_class')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center mx-auto"
                >
                    <PlusIcon className="h-6 w-6 mr-3" />
                    {content.action}
                </button>
            )}
        </div>
    );
};

// Expanded Class Details Component
const ExpandedClassDetails = ({ classItem, onAction }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Topics */}
            <div className="space-y-4">
                <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Course Topics ({classItem.totalTopicsInCourse || 0})
                </h5>
                
                <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 rounded-xl p-4">
                    {classItem.allTopics && classItem.allTopics.length > 0 ? (
                        classItem.allTopics.slice(0, 10).map((topic, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                    topic.status === 'completed' 
                                        ? 'bg-green-50 border-green-200 text-green-800' 
                                        : topic.status === 'ongoing'
                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                        : 'bg-white border-gray-200 text-gray-600'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{topic.topicTitle}</p>
                                        <p className="text-sm text-gray-500">{topic.chapterTitle}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            topic.status === 'completed' 
                                                ? 'bg-green-100 text-green-700' 
                                                : topic.status === 'ongoing'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {topic.status === 'completed' ? '✓ Completed' : 
                                             topic.status === 'ongoing' ? '⏳ In Progress' : 
                                             '○ Not Started'}
                                        </span>
                                    </div>
                                </div>
                                {topic.teacherNotes && (
                                    <p className="mt-2 text-sm text-gray-600 italic">{topic.teacherNotes}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">No topics available</p>
                    )}
                    
                    {classItem.allTopics && classItem.allTopics.length > 10 && (
                        <div className="text-center pt-2">
                            <button
                                onClick={() => onAction(classItem, 'manage_topics')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                View all {classItem.allTopics.length} topics
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column - Class Details */}
            <div className="space-y-4">
                <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Class Details
                </h5>
                
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{classItem.duration || 60} minutes</span>
                    </div>
                    
                    {classItem.actualDuration && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Actual Duration:</span>
                            <span className="font-medium">{classItem.actualDuration} minutes</span>
                        </div>
                    )}
                    
                    <div className="flex justify-between">
                        <span className="text-gray-600">Attendance Status:</span>
                        <span className={`font-medium ${
                            classItem.hasAttendance ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {classItem.hasAttendance ? '✓ Marked' : '✗ Not Marked'}
                        </span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="text-gray-600">Performance:</span>
                        <span className={`font-medium ${
                            classItem.hasPerformance ? 'text-green-600' : 'text-gray-600'
                        }`}>
                            {classItem.performanceScore ? `${classItem.performanceScore}%` : 'Not Added'}
                        </span>
                    </div>
                    
                    {classItem.performanceFeedback && (
                        <div className="pt-3 border-t border-gray-200">
                            <p className="text-gray-600 mb-1">Feedback:</p>
                            <p className="text-sm italic">{classItem.performanceFeedback}</p>
                        </div>
                    )}
                </div>

                {/* Student Contact */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h6 className="font-medium text-blue-900 mb-2">Contact Information</h6>
                    {classItem.studentPhone && (
                        <div className="flex items-center space-x-2 mb-2">
                            <PhoneIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800">{classItem.studentPhone}</span>
                        </div>
                    )}
                    {classItem.parentName && (
                        <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800">Parent: {classItem.parentName}</span>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => onAction(classItem, 'call_student')}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                    >
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        Call
                    </button>
                    <button
                        onClick={() => onAction(classItem, 'join_class')}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                    >
                        <VideoCameraIcon className="h-4 w-4 mr-1" />
                        Video
                    </button>
                </div>
            </div>
        </div>
    );
};

// Table and List views
const ClassesTable = ({ classes, onAction }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((classItem) => (
                        <tr key={classItem.classScheduleId || classItem.enrollmentId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <StudentAvatar avatar={classItem.studentAvatar} name={classItem.studentName} />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{classItem.studentName}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classItem.courseName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(classItem.classDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classItem.classTime}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    classItem.classStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                    classItem.classStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {classItem.classStatus}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onAction(classItem, 'mark_attendance')}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        Attendance
                                    </button>
                                    <button
                                        onClick={() => onAction(classItem, 'view_student')}
                                        className="text-green-600 hover:text-green-900"
                                    >
                                        View
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ClassesList = ({ classes, onAction }) => {
    return (
        <div className="space-y-4">
            {classes.map((classItem) => (
                <div key={classItem.classScheduleId || classItem.enrollmentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                        <StudentAvatar avatar={classItem.studentAvatar} name={classItem.studentName} />
                        <div>
                            <h4 className="font-medium text-gray-900">{classItem.studentName}</h4>
                            <p className="text-sm text-gray-600">{classItem.courseName}</p>
                            <p className="text-xs text-gray-500">
                                {new Date(classItem.classDate).toLocaleDateString()} at {classItem.classTime}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            classItem.classStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            classItem.classStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {classItem.classStatus}
                        </span>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onAction(classItem, 'mark_attendance')}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                                Attendance
                            </button>
                            <button
                                onClick={() => onAction(classItem, 'view_student')}
                                className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
                            >
                                View
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClassesManagement;
