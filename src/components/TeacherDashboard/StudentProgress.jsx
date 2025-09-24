// components/TeacherDashboard/StudentProgress.jsx
import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { teacherAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ProgressBar from '../common/ProgressBar';
// import TopicProgressModal from './TopicProgressModal';

const StudentProgress = ({ studentId, onClose }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentProgress();
    }
  }, [studentId, selectedCourse]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = selectedCourse ? { courseId: selectedCourse } : {};
      const response = await teacherAPI.getStudentProgress(studentId, params);
      
      if (response.success) {
        setStudentData(response.data);
        // Set first course as default if none selected
        if (!selectedCourse && response.data.length > 0) {
          setSelectedCourse(response.data[0].enrollment.course._id);
        }
      } else {
        setError(response.message || 'Failed to load student progress');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTopic = async (chapterId, topicNumber, status) => {
    try {
      const response = await teacherAPI.markTopicCompletion({
        studentId,
        courseId: selectedCourse,
        chapterId,
        topicNumber,
        status,
        teacherNotes: `Marked as ${status} by teacher`
      });

      if (response.success) {
        toast.success('Topic status updated successfully!');
        fetchStudentProgress(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to update topic');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update topic');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Progress</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button 
                onClick={fetchStudentProgress}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentProgress = studentData?.find(p => p.enrollment.course._id === selectedCourse);
  const student = currentProgress?.enrollment?.student;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white min-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
              {student?.avatar ? (
                <img 
                  src={student.avatar} 
                  alt={student.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {student?.name?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student?.name}</h2>
              <p className="text-gray-600">{student?.email} • Grade {student?.grade}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Course Selector */}
        {studentData && studentData.length > 1 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {studentData.map((progress) => (
                <option key={progress.enrollment.course._id} value={progress.enrollment.course._id}>
                  {progress.enrollment.course.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentProgress && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Overall Progress</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {currentProgress.enrollment.progress}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Classes Completed</p>
                    <p className="text-2xl font-bold text-green-900">
                      {currentProgress.enrollment.completedClasses}/{currentProgress.enrollment.bookedClasses}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Topics Completed</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {currentProgress.chapters?.reduce((acc, ch) => acc + ch.completedTopics, 0) || 0}/
                      {currentProgress.chapters?.reduce((acc, ch) => acc + ch.totalTopics, 0) || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center">
                  <TrophyIcon className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Avg. Performance</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {student?.statistics?.averagePerformance || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapter Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-blue-600 mr-2" />
                  Chapter Progress
                </h3>
              </div>
              
              <div className="p-6">
                {currentProgress.chapters && currentProgress.chapters.length > 0 ? (
                  <div className="space-y-6">
                    {currentProgress.chapters.map((chapter) => (
                      <div key={chapter.chapterId} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{chapter.chapterTitle}</h4>
                            <p className="text-sm text-gray-600">
                              {chapter.completedTopics} of {chapter.totalTopics} topics completed
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {chapter.completionPercentage}%
                            </div>
                          </div>
                        </div>
                        
                        <ProgressBar 
                          percentage={chapter.completionPercentage} 
                          color="blue"
                          height="h-2"
                        />
                        
                        {/* Topics Grid */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {chapter.topics.map((topic) => {
                            const statusColors = {
                              'completed': 'bg-green-100 text-green-800 border-green-200',
                              'ongoing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                              'not-started': 'bg-gray-100 text-gray-600 border-gray-200'
                            };
                            
                            return (
                              <div 
                                key={topic.topicNumber}
                                className={`p-3 rounded-lg border ${statusColors[topic.status]} cursor-pointer hover:shadow-sm transition-shadow`}
                                onClick={() => {
                                  setSelectedChapter({
                                    ...chapter,
                                    currentTopic: topic
                                  });
                                  setShowTopicModal(true);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm">
                                      Topic {topic.topicNumber}
                                    </p>
                                    <p className="text-xs opacity-90">
                                      {topic.topicTitle}
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    {topic.status === 'completed' && (
                                      <CheckCircleIcon className="h-4 w-4" />
                                    )}
                                    {topic.status === 'ongoing' && (
                                      <ClockIcon className="h-4 w-4" />
                                    )}
                                  </div>
                                </div>
                                
                                {topic.completedAt && (
                                  <p className="text-xs opacity-75 mt-1">
                                    Completed: {new Date(topic.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedChapter(chapter);
                              setShowTopicModal(true);
                            }}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Manage Topics
                          </button>
                          <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No Progress Data</h3>
                    <p className="mt-2 text-gray-600">No chapter progress found for this student.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Topic Progress Modal */}
        {/* {showTopicModal && selectedChapter && (
          <TopicProgressModal
            chapter={selectedChapter}
            studentId={studentId}
            courseId={selectedCourse}
            onClose={() => {
              setShowTopicModal(false);
              setSelectedChapter(null);
            }}
            onUpdate={(chapterId, topicNumber, status) => {
              handleMarkTopic(chapterId, topicNumber, status);
              setShowTopicModal(false);
              setSelectedChapter(null);
            }}
          />
        )} */}
      </div>
    </div>
  );
};

export default StudentProgress;
