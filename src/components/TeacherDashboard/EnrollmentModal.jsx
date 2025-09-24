// components/TeacherDashboard/modals/EnrollmentModal.jsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EnrollmentModal = ({ student, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('new'); // new, existing, modify
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  
  // New Enrollment State
  const [newEnrollment, setNewEnrollment] = useState({
    studentId: student?._id || '',
    courseId: '',
    startDate: new Date().toISOString().split('T')[0],
    totalClasses: 20,
    classesPerWeek: 2,
    classTime: '16:00',
    classDuration: 60,
    notes: ''
  });

  // Existing Enrollment Management
  const [existingEnrollments, setExistingEnrollments] = useState([]);

  useEffect(() => {
    loadInitialData();
    if (student) {
      loadStudentEnrollments();
    }
  }, [student]);

  const loadInitialData = async () => {
    try {
      // Load available courses and students
      const [coursesRes, studentsRes] = await Promise.all([
        teacherAPI.getCourses(),
        teacherAPI.getAllStudents()
      ]);

      setCourses(coursesRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    }
  };

  const loadStudentEnrollments = async () => {
    if (!student?._id) return;
    
    try {
      const response = await teacherAPI.getStudentEnrollments(student._id);
      setExistingEnrollments(response.data || []);
    } catch (error) {
      console.error('Error loading student enrollments:', error);
    }
  };

  const handleCreateEnrollment = async () => {
    try {
      setLoading(true);

      if (!newEnrollment.studentId || !newEnrollment.courseId) {
        toast.error('Please select both student and course');
        return;
      }

      const payload = {
        studentId: newEnrollment.studentId,
        courseId: newEnrollment.courseId,
        startDate: newEnrollment.startDate,
        totalClasses: parseInt(newEnrollment.totalClasses),
        classesPerWeek: parseInt(newEnrollment.classesPerWeek),
        classTime: newEnrollment.classTime,
        classDuration: parseInt(newEnrollment.classDuration),
        notes: newEnrollment.notes
      };

      const response = await teacherAPI.createEnrollment(payload);

      if (response.success) {
        toast.success('Student enrolled successfully!');
        onSuccess && onSuccess('Student enrolled successfully');
        onClose();
      } else {
        toast.error(response.message || 'Failed to create enrollment');
      }
    } catch (error) {
      console.error('Error creating enrollment:', error);
      toast.error(error.message || 'Failed to create enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyEnrollment = async (enrollmentId, modifications) => {
    try {
      setLoading(true);

      const response = await teacherAPI.modifyEnrollment(enrollmentId, modifications);

      if (response.success) {
        toast.success('Enrollment modified successfully!');
        loadStudentEnrollments(); // Reload data
        onSuccess && onSuccess('Enrollment modified successfully');
      } else {
        toast.error(response.message || 'Failed to modify enrollment');
      }
    } catch (error) {
      console.error('Error modifying enrollment:', error);
      toast.error(error.message || 'Failed to modify enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to delete this enrollment?')) {
      return;
    }

    try {
      setLoading(true);

      const response = await teacherAPI.deleteEnrollment(enrollmentId);

      if (response.success) {
        toast.success('Enrollment deleted successfully!');
        loadStudentEnrollments(); // Reload data
        onSuccess && onSuccess('Enrollment deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete enrollment');
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error(error.message || 'Failed to delete enrollment');
    } finally {
      setLoading(false);
    }
  };

  const generateClassSchedule = () => {
    const { startDate, totalClasses, classesPerWeek, classTime, classDuration } = newEnrollment;
    
    if (!startDate || !totalClasses || !classesPerWeek || !classTime) {
      return [];
    }

    const schedule = [];
    const start = new Date(startDate);
    let currentDate = new Date(start);
    let classCount = 0;
    
    const daysInterval = Math.ceil(7 / classesPerWeek);

    while (classCount < totalClasses) {
      schedule.push({
        classNumber: classCount + 1,
        date: new Date(currentDate).toDateString(),
        time: classTime,
        duration: classDuration
      });
      
      classCount++;
      currentDate.setDate(currentDate.getDate() + daysInterval);
    }

    return schedule;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'new':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Create New Enrollment</h3>
            
            {/* Student Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                <select
                  value={newEnrollment.studentId}
                  onChange={(e) => setNewEnrollment(prev => ({ ...prev, studentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!student}
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} - {s.email}
                    </option>
                  ))}
                </select>
                {student && (
                  <p className="text-sm text-blue-600 mt-1">
                    Pre-selected: {student.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
                <select
                  value={newEnrollment.courseId}
                  onChange={(e) => setNewEnrollment(prev => ({ ...prev, courseId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a course...</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.title} - {course.courseType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newEnrollment.startDate}
                  onChange={(e) => setNewEnrollment(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Classes</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newEnrollment.totalClasses}
                  onChange={(e) => setNewEnrollment(prev => ({ ...prev, totalClasses: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Classes Per Week</label>
                <select
                  value={newEnrollment.classesPerWeek}
                  onChange={(e) => setNewEnrollment(prev => ({ ...prev, classesPerWeek: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">1 class per week</option>
                  <option value="2">2 classes per week</option>
                  <option value="3">3 classes per week</option>
                  <option value="4">4 classes per week</option>
                  <option value="5">5 classes per week</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Time</label>
                <input
                  type="time"
                  value={newEnrollment.classTime}
                  onChange={(e) => setNewEnrollment(prev => ({ ...prev, classTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class Duration (minutes)</label>
                <select
                  value={newEnrollment.classDuration}
                  onChange={(e) => setNewEnrollment(prev => ({ ...prev, classDuration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={newEnrollment.notes}
                onChange={(e) => setNewEnrollment(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this enrollment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Schedule Preview */}
            {newEnrollment.startDate && newEnrollment.totalClasses && newEnrollment.classesPerWeek && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Schedule Preview (First 5 Classes)</h4>
                <div className="space-y-2">
                  {generateClassSchedule().slice(0, 5).map((classItem, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-blue-800">
                        Class {classItem.classNumber}: {classItem.date}
                      </span>
                      <span className="text-blue-600">
                        {classItem.time} ({classItem.duration} min)
                      </span>
                    </div>
                  ))}
                  {newEnrollment.totalClasses > 5 && (
                    <p className="text-xs text-blue-600 text-center">
                      ... and {newEnrollment.totalClasses - 5} more classes
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleCreateEnrollment}
              disabled={loading || !newEnrollment.studentId || !newEnrollment.courseId}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Creating Enrollment...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Create Enrollment
                </>
              )}
            </button>
          </div>
        );

      case 'existing':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Manage Existing Enrollments</h3>
            
            {student ? (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {student.name} - {student.email}
                  </h4>
                  <p className="text-sm text-gray-600">Grade: {student.grade}</p>
                </div>

                {existingEnrollments.length > 0 ? (
                  <div className="space-y-4">
                    {existingEnrollments.map((enrollment, index) => (
                      <ExistingEnrollmentCard
                        key={enrollment._id}
                        enrollment={enrollment}
                        onModify={(modifications) => handleModifyEnrollment(enrollment._id, modifications)}
                        onDelete={() => handleDeleteEnrollment(enrollment._id)}
                        loading={loading}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No existing enrollments found for this student</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Please select a student from the main view to manage their enrollments</p>
              </div>
            )}
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-600 rounded-xl">
              <UserPlusIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enrollment Management</h2>
              <p className="text-gray-600">Create new enrollments or manage existing ones</p>
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
            { id: 'new', label: 'New Enrollment', icon: PlusIcon },
            { id: 'existing', label: 'Manage Existing', icon: AcademicCapIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-green-600 border-b-2 border-green-500 bg-white'
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

// Existing Enrollment Card Component
const ExistingEnrollmentCard = ({ enrollment, onModify, onDelete, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    totalClasses: enrollment.totalClasses || 0,
    classTime: enrollment.classTime || '',
    notes: enrollment.notes || ''
  });

  const handleSave = () => {
    onModify(editData);
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            {enrollment.course?.title || 'Unknown Course'}
          </h4>
          <p className="text-sm text-gray-600">
            Course Type: {enrollment.course?.courseType || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Enrolled: {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
            enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {enrollment.status || 'Active'}
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Classes</label>
              <input
                type="number"
                value={editData.totalClasses}
                onChange={(e) => setEditData(prev => ({ ...prev, totalClasses: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Time</label>
              <input
                type="time"
                value={editData.classTime}
                onChange={(e) => setEditData(prev => ({ ...prev, classTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <p className="font-semibold">{enrollment.progress || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="font-semibold">{enrollment.totalClasses || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="font-semibold">{enrollment.completedClasses || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Class Time</p>
              <p className="font-semibold">{enrollment.classTime || 'Not set'}</p>
            </div>
          </div>

          {enrollment.notes && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{enrollment.notes}</p>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentModal;
