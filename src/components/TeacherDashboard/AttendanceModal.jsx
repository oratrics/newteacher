// components/TeacherDashboard/modals/AttendanceManagementModal.jsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  BookOpenIcon,
  StarIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ClockIcon as ClockIconSolid,
  CalendarIcon as CalendarIconSolid
} from '@heroicons/react/24/solid';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AttendanceManagementModal = ({ classItem, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('mark'); // mark, cancel, reschedule, extra
  const [loading, setLoading] = useState(false);
  
  // Mark Attendance State
  const [attendanceData, setAttendanceData] = useState({
    status: 'present',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: '',
    topicsCovered: [],
    performanceScore: '',
    feedback: ''
  });

  // Cancel Class State
  const [cancelData, setCancelData] = useState({
    reason: '',
    addToEnd: true
  });

  // Reschedule State
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });

  // Extra Class State
  const [extraClassData, setExtraClassData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: 60,
    notes: '',
    deductFromRemaining: true,
    topicsCovered: [],
    performanceScore: '',
    feedback: ''
  });

  const [availableTopics, setAvailableTopics] = useState([]);

  useEffect(() => {
    if (classItem && classItem.course) {
      loadAvailableTopics();
    }
  }, [classItem]);

  const loadAvailableTopics = () => {
    // Mock topics - in real app, fetch from course data
    const topics = [
      { id: '1', chapterId: 'ch1', chapterTitle: 'Introduction', topicNumber: 1, topicTitle: 'Basic Concepts' },
      { id: '2', chapterId: 'ch1', chapterTitle: 'Introduction', topicNumber: 2, topicTitle: 'Key Principles' },
      { id: '3', chapterId: 'ch2', chapterTitle: 'Advanced Topics', topicNumber: 1, topicTitle: 'Deep Dive' },
    ];
    setAvailableTopics(topics);
  };

  const handleMarkAttendance = async () => {
    if (!classItem) return;

    try {
      setLoading(true);

      const payload = {
        studentId: classItem.studentId || classItem._id,
        courseId: classItem.courseId || classItem.course?._id,
        classScheduleId: classItem.classScheduleId || classItem._id,
        status: attendanceData.status,
        date: `${attendanceData.date}T${attendanceData.time}`,
        notes: attendanceData.notes,
        topicsCovered: attendanceData.topicsCovered,
        performanceScore: attendanceData.performanceScore ? parseFloat(attendanceData.performanceScore) : null,
        feedback: attendanceData.feedback
      };

      console.log('Marking attendance with payload:', payload);

      const response = await teacherAPI.markAttendance(payload);

      if (response.success) {
        toast.success('Attendance marked successfully!');
        onSuccess && onSuccess('Attendance marked successfully');
        onClose();
      } else {
        toast.error(response.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClass = async () => {
    if (!classItem) return;

    try {
      setLoading(true);

      const payload = {
        studentId: classItem.studentId || classItem._id,
        courseId: classItem.courseId || classItem.course?._id,
        classScheduleId: classItem.classScheduleId || classItem._id,
        reason: cancelData.reason,
        addToEnd: cancelData.addToEnd
      };

      const response = await teacherAPI.cancelClass(payload);

      if (response.success) {
        toast.success('Class cancelled successfully!');
        onSuccess && onSuccess('Class cancelled successfully');
        onClose();
      } else {
        toast.error(response.message || 'Failed to cancel class');
      }
    } catch (error) {
      console.error('Error cancelling class:', error);
      toast.error(error.message || 'Failed to cancel class');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleClass = async () => {
    if (!classItem) return;

    try {
      setLoading(true);

      const payload = {
        studentId: classItem.studentId || classItem._id,
        courseId: classItem.courseId || classItem.course?._id,
        classScheduleId: classItem.classScheduleId || classItem._id,
        newDate: rescheduleData.newDate,
        newTime: rescheduleData.newTime,
        reason: rescheduleData.reason
      };

      const response = await teacherAPI.rescheduleClass(payload);

      if (response.success) {
        toast.success('Class rescheduled successfully!');
        onSuccess && onSuccess('Class rescheduled successfully');
        onClose();
      } else {
        toast.error(response.message || 'Failed to reschedule class');
      }
    } catch (error) {
      console.error('Error rescheduling class:', error);
      toast.error(error.message || 'Failed to reschedule class');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtraClass = async () => {
    if (!classItem) return;

    try {
      setLoading(true);

      const payload = {
        studentId: classItem.studentId || classItem._id,
        courseId: classItem.courseId || classItem.course?._id,
        date: `${extraClassData.date}T${extraClassData.time}`,
        time: extraClassData.time,
        duration: extraClassData.duration,
        notes: extraClassData.notes,
        deductFromRemaining: extraClassData.deductFromRemaining,
        topicsCovered: extraClassData.topicsCovered,
        performanceScore: extraClassData.performanceScore ? parseFloat(extraClassData.performanceScore) : null,
        feedback: extraClassData.feedback
      };

      const response = await teacherAPI.addExtraClass(payload);

      if (response.success) {
        toast.success('Extra class added successfully!');
        onSuccess && onSuccess('Extra class added successfully');
        onClose();
      } else {
        toast.error(response.message || 'Failed to add extra class');
      }
    } catch (error) {
      console.error('Error adding extra class:', error);
      toast.error(error.message || 'Failed to add extra class');
    } finally {
      setLoading(false);
    }
  };

  const addTopicToCovered = (topicId, currentTopics, setCurrentTopics) => {
    const topic = availableTopics.find(t => t.id === topicId);
    if (topic && !currentTopics.find(ct => ct.id === topicId)) {
      setCurrentTopics([...currentTopics, { ...topic, notes: '' }]);
    }
  };

  const removeTopicFromCovered = (topicId, currentTopics, setCurrentTopics) => {
    setCurrentTopics(currentTopics.filter(t => t.id !== topicId));
  };

  const updateTopicNotes = (topicId, notes, currentTopics, setCurrentTopics) => {
    setCurrentTopics(currentTopics.map(t => 
      t.id === topicId ? { ...t, notes } : t
    ));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mark':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Mark Class Attendance</h3>
            
            {/* Attendance Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Attendance Status</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'present', label: 'Present', icon: CheckCircleIconSolid, color: 'green' },
                  { value: 'absent', label: 'Absent', icon: XCircleIconSolid, color: 'red' },
                  { value: 'late', label: 'Late', icon: ClockIconSolid, color: 'yellow' },
                  { value: 'excused', label: 'Excused', icon: CalendarIconSolid, color: 'blue' }
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setAttendanceData(prev => ({ ...prev, status: status.value }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      attendanceData.status === status.value
                        ? `border-${status.color}-500 bg-${status.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <status.icon className={`h-6 w-6 mx-auto mb-2 ${
                      attendanceData.status === status.value ? `text-${status.color}-600` : 'text-gray-400'
                    }`} />
                    <div className={`text-sm font-medium ${
                      attendanceData.status === status.value ? `text-${status.color}-800` : 'text-gray-600'
                    }`}>
                      {status.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={attendanceData.date}
                  onChange={(e) => setAttendanceData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={attendanceData.time}
                  onChange={(e) => setAttendanceData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Topics Covered (only if present) */}
            {attendanceData.status === 'present' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Topics Covered</label>
                <TopicSelector
                  availableTopics={availableTopics}
                  selectedTopics={attendanceData.topicsCovered}
                  onAddTopic={(topicId) => addTopicToCovered(topicId, attendanceData.topicsCovered, 
                    (topics) => setAttendanceData(prev => ({ ...prev, topicsCovered: topics })))}
                  onRemoveTopic={(topicId) => removeTopicFromCovered(topicId, attendanceData.topicsCovered,
                    (topics) => setAttendanceData(prev => ({ ...prev, topicsCovered: topics })))}
                  onUpdateNotes={(topicId, notes) => updateTopicNotes(topicId, notes, attendanceData.topicsCovered,
                    (topics) => setAttendanceData(prev => ({ ...prev, topicsCovered: topics })))}
                />
              </div>
            )}

            {/* Performance Score (only if present) */}
            {attendanceData.status === 'present' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Performance Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={attendanceData.performanceScore}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, performanceScore: e.target.value }))}
                    placeholder="0-100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                  <input
                    type="text"
                    value={attendanceData.feedback}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Performance feedback"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={attendanceData.notes}
                onChange={(e) => setAttendanceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this class..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleMarkAttendance}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Marking Attendance...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Mark Attendance
                </>
              )}
            </button>
          </div>
        );

      case 'cancel':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Cancel Scheduled Class</h3>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm">
                  This will cancel the scheduled class. You can optionally add a makeup class at the end.
                </p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason</label>
              <textarea
                rows={3}
                value={cancelData.reason}
                onChange={(e) => setCancelData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please provide a reason for cancellation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Add Makeup Class Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="addToEnd"
                checked={cancelData.addToEnd}
                onChange={(e) => setCancelData(prev => ({ ...prev, addToEnd: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="addToEnd" className="text-sm font-medium text-gray-700">
                Add makeup class after the last scheduled class
              </label>
            </div>

            {/* Action Button */}
            <button
              onClick={handleCancelClass}
              disabled={loading || !cancelData.reason.trim()}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Cancelling Class...
                </>
              ) : (
                <>
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Cancel Class
                </>
              )}
            </button>
          </div>
        );

      case 'reschedule':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Reschedule Class</h3>
            
            {/* Current Schedule Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Current Schedule:</h4>
              <p className="text-blue-800 text-sm">
                Date: {classItem?.classDate ? new Date(classItem.classDate).toLocaleDateString() : 'N/A'}<br/>
                Time: {classItem?.classTime || 'N/A'}
              </p>
            </div>

            {/* New Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                <input
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, newDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                <input
                  type="time"
                  value={rescheduleData.newTime}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, newTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rescheduling</label>
              <textarea
                rows={3}
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please provide a reason for rescheduling..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleRescheduleClass}
              disabled={loading || !rescheduleData.newDate || !rescheduleData.newTime}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Rescheduling Class...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Reschedule Class
                </>
              )}
            </button>
          </div>
        );

      case 'extra':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Add Extra Class</h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <AcademicCapIcon className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800 text-sm">
                  Record an extra class that was conducted outside the regular schedule.
                </p>
              </div>
            </div>

            {/* Date, Time, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={extraClassData.date}
                  onChange={(e) => setExtraClassData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={extraClassData.time}
                  onChange={(e) => setExtraClassData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={extraClassData.duration}
                  onChange={(e) => setExtraClassData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Deduct from Remaining Classes Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="deductFromRemaining"
                checked={extraClassData.deductFromRemaining}
                onChange={(e) => setExtraClassData(prev => ({ ...prev, deductFromRemaining: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="deductFromRemaining" className="text-sm font-medium text-gray-700">
                Deduct this class from remaining scheduled classes
              </label>
            </div>
            
            {extraClassData.deductFromRemaining && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  ⚠️ This will mark the last scheduled class as "replaced by extra class"
                </p>
              </div>
            )}

            {/* Topics Covered */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Topics Covered</label>
              <TopicSelector
                availableTopics={availableTopics}
                selectedTopics={extraClassData.topicsCovered}
                onAddTopic={(topicId) => addTopicToCovered(topicId, extraClassData.topicsCovered, 
                  (topics) => setExtraClassData(prev => ({ ...prev, topicsCovered: topics })))}
                onRemoveTopic={(topicId) => removeTopicFromCovered(topicId, extraClassData.topicsCovered,
                  (topics) => setExtraClassData(prev => ({ ...prev, topicsCovered: topics })))}
                onUpdateNotes={(topicId, notes) => updateTopicNotes(topicId, notes, extraClassData.topicsCovered,
                  (topics) => setExtraClassData(prev => ({ ...prev, topicsCovered: topics })))}
              />
            </div>

            {/* Performance Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Performance Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={extraClassData.performanceScore}
                  onChange={(e) => setExtraClassData(prev => ({ ...prev, performanceScore: e.target.value }))}
                  placeholder="0-100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                <input
                  type="text"
                  value={extraClassData.feedback}
                  onChange={(e) => setExtraClassData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Performance feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={extraClassData.notes}
                onChange={(e) => setExtraClassData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this extra class..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddExtraClass}
              disabled={loading || !extraClassData.date || !extraClassData.time}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Adding Extra Class...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Extra Class
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
              <p className="text-gray-600">
                Student: {classItem?.studentName || 'Unknown Student'} | 
                Course: {classItem?.courseName || 'Unknown Course'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { id: 'mark', label: 'Mark Attendance', icon: CheckCircleIcon, color: 'green' },
            { id: 'cancel', label: 'Cancel Class', icon: XCircleIcon, color: 'red' },
            { id: 'reschedule', label: 'Reschedule', icon: CalendarIcon, color: 'blue' },
            { id: 'extra', label: 'Extra Class', icon: PlusIcon, color: 'purple' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? `text-${tab.color}-600 border-b-2 border-${tab.color}-500 bg-white`
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

// Topic Selector Component
const TopicSelector = ({ 
  availableTopics, 
  selectedTopics, 
  onAddTopic, 
  onRemoveTopic, 
  onUpdateNotes 
}) => {
  return (
    <div className="space-y-4">
      {/* Available Topics */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Available Topics</label>
        <select
          onChange={(e) => e.target.value && onAddTopic(e.target.value)}
          value=""
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select topic to add...</option>
          {availableTopics
            .filter(topic => !selectedTopics.find(st => st.id === topic.id))
            .map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.chapterTitle} - {topic.topicTitle}
              </option>
            ))}
        </select>
      </div>

      {/* Selected Topics */}
      {selectedTopics.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Topics to Cover</label>
          <div className="space-y-2">
            {selectedTopics.map((topic) => (
              <div key={topic.id} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm text-blue-900">
                    {topic.chapterTitle} - {topic.topicTitle}
                  </div>
                  <input
                    type="text"
                    placeholder="Add notes for this topic..."
                    value={topic.notes || ''}
                    onChange={(e) => onUpdateNotes(topic.id, e.target.value)}
                    className="mt-1 w-full px-2 py-1 text-xs border border-blue-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => onRemoveTopic(topic.id)}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagementModal;
