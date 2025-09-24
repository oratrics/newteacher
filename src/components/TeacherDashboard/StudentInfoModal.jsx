// components/TeacherDashboard/Modals/AttendanceModal.jsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BookOpenIcon,
  StarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';
// Student Info Modal
const StudentInfoModal = ({ studentData, onClose, onAction }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {studentData.studentAvatar ? (
                  <img
                    src={studentData.studentAvatar}
                    alt={studentData.studentName}
                    className="h-16 w-16 rounded-2xl object-cover border-4 border-white"
                  />
                ) : (
                  <div className="h-16 w-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center border-4 border-white">
                    <span className="text-white font-bold text-xl">
                      {studentData.studentName?.charAt(0) || 'S'}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{studentData.studentName}</h2>
                <p className="text-indigo-100">{studentData.courseName} • Grade {studentData.studentGrade || 'N/A'}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-indigo-100">
                  <span>Progress: {studentData.studentProgress || 0}%</span>
                  <span>•</span>
                  <span>Classes: {studentData.completedClasses || 0}/{studentData.totalClasses || 0}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: UserIcon },
              { id: 'progress', label: 'Progress', icon: TrophyIcon },
              { id: 'performance', label: 'Performance', icon: StarIcon },
              { id: 'contact', label: 'Contact', icon: PhoneIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900 font-semibold">{studentData.studentName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{studentData.studentEmail || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Grade/Level</label>
                      <p className="text-gray-900">{studentData.studentGrade || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{studentData.studentPhone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Course:</span>
                      <span className="text-gray-900">{studentData.courseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Course Type:</span>
                      <span className="text-gray-900">{studentData.courseType || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Enrollment Date:</span>
                      <span className="text-gray-900">
                        {studentData.enrollmentDate ? 
                          new Date(studentData.enrollmentDate).toLocaleDateString() : 
                          'Not available'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {studentData.studentProgress || 0}%
                      </div>
                      <div className="text-sm text-blue-700">Overall Progress</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {studentData.completedClasses || 0}
                        </div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-600">
                          {studentData.totalClasses || 0}
                        </div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => onAction(studentData, 'call_student')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    Call Student
                  </button>
                  <button
                    onClick={() => onAction(studentData, 'join_class')}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <VideoCameraIcon className="h-5 w-5 mr-2" />
                    Start Class
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Overall Progress</h4>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {studentData.studentProgress || 0}%
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${studentData.studentProgress || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Completed Classes</h4>
                  <div className="text-3xl font-bold text-green-600">
                    {studentData.completedClasses || 0}
                  </div>
                  <div className="text-sm text-green-700">
                    out of {studentData.totalClasses || 0} total
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Topics Covered</h4>
                  <div className="text-3xl font-bold text-purple-600">
                    {studentData.completedTopics || 0}
                  </div>
                  <div className="text-sm text-purple-700">
                    out of {studentData.totalTopicsInCourse || 0} topics
                  </div>
                </div>
              </div>

              {/* Topic Progress would go here */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic Progress</h3>
                <p className="text-gray-600">Detailed topic progress tracking would be displayed here...</p>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Latest Performance</h4>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {studentData.performanceScore || 'N/A'}
                    {studentData.performanceScore && '%'}
                  </div>
                  <div className="text-sm text-yellow-700">
                    {studentData.performanceFeedback || 'No feedback available'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Performance History</h4>
                  <p className="text-gray-600">Performance trends and history would be displayed here...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span>{studentData.studentPhone || 'No phone number'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 text-gray-400">✉️</div>
                    <span>{studentData.studentEmail || 'No email address'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span>{studentData.parentName || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span>{studentData.parentPhone || 'No phone number'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Notes Modal

// Export all modals
export default StudentInfoModal

