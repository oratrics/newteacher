// components/TeacherDashboard/AttendanceMarking.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  BookOpenIcon,
  UserIcon,
  StarIcon 
} from '@heroicons/react/24/outline';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AttendanceMarking = ({ classScheduleId, studentData, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: 'completed',
    actualDuration: '',
    performanceScore: '',
    performanceFeedback: '',
    notes: '',
    topicsCompleted: []
  });
  
  const [courseTopics, setCourseTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (studentData?.course?._id) {
      fetchCourseTopics();
    }
  }, [studentData]);

  const fetchCourseTopics = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getCourseProgress(studentData.course._id, {
        studentId: studentData.student._id
      });
      
      if (response.success && response.data.progressData[0]) {
        setCourseTopics(response.data.progressData[0].chapters || []);
      }
    } catch (error) {
      toast.error('Failed to load course topics');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicToggle = (chapterId, topicNumber, topicTitle, chapterTitle) => {
    const topicId = `${chapterId}-${topicNumber}`;
    const isSelected = formData.topicsCompleted.find(t => 
      t.chapterId === chapterId && t.topicNumber === topicNumber
    );

    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        topicsCompleted: prev.topicsCompleted.filter(t => 
          !(t.chapterId === chapterId && t.topicNumber === topicNumber)
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        topicsCompleted: [...prev.topicsCompleted, {
          chapterId,
          topicNumber,
          topicStatus: 'completed',
          teacherNotes: ''
        }]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.status) {
      toast.error('Please select attendance status');
      return;
    }

    try {
      setSubmitLoading(true);
      
      const payload = {
        studentId: studentData.student._id,
        status: formData.status,
        actualDuration: parseInt(formData.actualDuration) || undefined,
        performance: {
          score: parseInt(formData.performanceScore) || undefined,
          feedback: formData.performanceFeedback || undefined
        },
        topicsCompleted: formData.topicsCompleted,
        notes: formData.notes || undefined
      };

      const response = await teacherAPI.markAttendance(classScheduleId, payload);
      
      if (response.success) {
        toast.success('Attendance marked successfully!');
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to mark attendance');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mark Attendance</h2>
              <p className="text-sm text-gray-600">
                {studentData?.student?.name} - {studentData?.course?.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Attendance Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Attendance Status
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'completed', label: 'Present & Completed', icon: CheckCircleIcon, color: 'green' },
                    { value: 'late', label: 'Late Attendance', icon: ClockIcon, color: 'yellow' },
                    { value: 'absent', label: 'Absent', icon: XCircleIcon, color: 'red' }
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value={option.value}
                          checked={formData.status === option.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="sr-only"
                        />
                        <div className={`flex items-center w-full p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.status === option.value 
                            ? `border-${option.color}-500 bg-${option.color}-50` 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <Icon className={`h-5 w-5 mr-3 ${
                            formData.status === option.value ? `text-${option.color}-600` : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            formData.status === option.value ? `text-${option.color}-900` : 'text-gray-700'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Class Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Class Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.actualDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualDuration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 60"
                  min="1"
                  max="180"
                />
              </div>

              {/* Performance */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  Performance Evaluation
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Performance Score (0-100)
                  </label>
                  <input
                    type="number"
                    value={formData.performanceScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, performanceScore: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 85"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for auto-evaluation based on attendance and topics
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Performance Feedback
                  </label>
                  <textarea
                    value={formData.performanceFeedback}
                    onChange={(e) => setFormData(prev => ({ ...prev, performanceFeedback: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Optional feedback about student performance..."
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Any additional notes about this class..."
                />
              </div>
            </div>

            {/* Right Column - Topics */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BookOpenIcon className="h-5 w-5 text-blue-500 mr-2" />
                Topics Covered Today
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading topics...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {courseTopics.length > 0 ? (
                    courseTopics.map((chapter) => (
                      <div key={chapter.chapterId} className="border-b border-gray-200 last:border-b-0">
                        <div className="px-4 py-3 bg-gray-50">
                          <h4 className="font-medium text-gray-900">{chapter.chapterTitle}</h4>
                          <p className="text-sm text-gray-600">
                            {chapter.completedTopics}/{chapter.totalTopics} completed
                          </p>
                        </div>
                        <div className="px-4 py-2">
                          {chapter.topics.map((topic) => {
                            const isSelected = formData.topicsCompleted.find(t => 
                              t.chapterId === chapter.chapterId && t.topicNumber === topic.topicNumber
                            );
                            
                            return (
                              <label key={topic.topicNumber} className="flex items-center py-2 cursor-pointer hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={!!isSelected}
                                  onChange={() => handleTopicToggle(
                                    chapter.chapterId, 
                                    topic.topicNumber, 
                                    topic.topicTitle,
                                    chapter.chapterTitle
                                  )}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <div className="ml-3">
                                  <span className="text-sm font-medium text-gray-900">
                                    Topic {topic.topicNumber}: {topic.topicTitle}
                                  </span>
                                  {topic.status === 'completed' && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                      Previously Completed
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpenIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">No topics found</p>
                    </div>
                  )}
                </div>
              )}
              
              {formData.topicsCompleted.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {formData.topicsCompleted.length} topic(s) selected for completion
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Mark Attendance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceMarking;
