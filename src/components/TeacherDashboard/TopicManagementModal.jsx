// TopicManagementModal.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TopicManagementModal = ({ classItem, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('TopicManagementModal classItem:', classItem);
    
    if (classItem.allTopics && classItem.allTopics.length > 0) {
      setTopics(classItem.allTopics.map(topic => ({
        ...topic,
        tempNotes: topic.teacherNotes || '',
        hasChanges: false,
        originalStatus: topic.status
      })));
    }
  }, [classItem]);

  const handleStatusChange = (topicIndex, newStatus) => {
    setTopics(prev => prev.map((topic, index) => 
      index === topicIndex 
        ? { 
            ...topic, 
            status: newStatus, 
            hasChanges: true,
            completedAt: newStatus === 'completed' ? new Date() : null
          }
        : topic
    ));
  };

  const handleNotesChange = (topicIndex, notes) => {
    setTopics(prev => prev.map((topic, index) => 
      index === topicIndex 
        ? { ...topic, tempNotes: notes, hasChanges: true }
        : topic
    ));
  };

// TopicManagementModal.jsx - Enhanced CourseId handling
const handleSaveAll = async () => {
  setLoading(true);
  
  try {
    const changedTopics = topics.filter(topic => topic.hasChanges);
    
    if (changedTopics.length === 0) {
      toast.info('No changes to save');
      setLoading(false);
      return;
    }

    console.log('Saving topics for classItem:', classItem);
    console.log('Changed topics:', changedTopics);

    // FIXED: Enhanced courseId extraction
    let courseId = null;
    
    // Try multiple ways to get courseId with detailed logging
    if (classItem.courseId) {
      courseId = classItem.courseId;
      console.log('Found courseId from classItem.courseId:', courseId);
    } else if (classItem.course && classItem.course._id) {
      courseId = classItem.course._id;
      console.log('Found courseId from classItem.course._id:', courseId);
    } else if (classItem.course && typeof classItem.course === 'string') {
      courseId = classItem.course;
      console.log('Found courseId from classItem.course string:', courseId);
    } else if (classItem.enrollmentId) {
      // If we still don't have courseId, try to use classScheduleId only
      console.log('No courseId found, will try with classScheduleId only');
      courseId = null; // We'll handle this in the backend
    }

    console.log('Final courseId to use:', courseId);
    console.log('Using studentId:', classItem.studentId);
    console.log('Using classScheduleId:', classItem.classScheduleId);

    if (!courseId && !classItem.classScheduleId) {
      throw new Error('Neither Course ID nor Class Schedule ID found - cannot update topics');
    }

    let successCount = 0;
    const errors = [];

    // Save each changed topic with better error handling
    for (const topic of changedTopics) {
      try {
        const topicData = {
          studentId: classItem.studentId,
          chapterId: topic.chapterId,
          topicNumber: topic.topicNumber,
          status: topic.status,
          teacherNotes: topic.tempNotes,
          classScheduleId: classItem.classScheduleId
        };

        // Only include courseId if we have it
        if (courseId) {
          topicData.courseId = courseId;
        }

        console.log('Updating topic with data:', topicData);

        const response = await teacherAPI.updateTopicStatus(topicData);
        
        if (response && response.success) {
          successCount++;
          console.log(`Successfully updated topic: ${topic.topicTitle}`);
        } else {
          const errorMsg = response?.message || 'Unknown error';
          console.error(`Failed to update ${topic.topicTitle}:`, errorMsg);
          errors.push(`Failed to update ${topic.topicTitle}: ${errorMsg}`);
        }
      } catch (error) {
        console.error(`Error updating topic ${topic.topicTitle}:`, error);
        errors.push(`Failed to update ${topic.topicTitle}: ${error.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Updated ${successCount} topics successfully!`);
      onSuccess(`${successCount} topics updated successfully!`);
      
      if (errors.length === 0) {
        onClose();
      }
    }

    if (errors.length > 0) {
      console.error('Topic update errors:', errors);
      toast.error(`${errors.length} topics failed to update. Check console for details.`);
      errors.forEach(error => console.error(error));
    }

  } catch (error) {
    console.error('Error in handleSaveAll:', error);
    toast.error(error.message || 'Failed to update topics');
  } finally {
    setLoading(false);
  }
};


  // Group topics by chapter
  const topicsByChapter = topics.reduce((acc, topic) => {
    const chapterTitle = topic.chapterTitle || 'Unknown Chapter';
    if (!acc[chapterTitle]) {
      acc[chapterTitle] = [];
    }
    acc[chapterTitle].push(topic);
    return acc;
  }, {});

  const filteredTopics = topics.filter(topic => {
    const matchesChapter = selectedChapter === 'all' || topic.chapterTitle === selectedChapter;
    const matchesSearch = searchTerm === '' || 
      topic.topicTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.chapterTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChapter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'ongoing':
        return '⏳';
      default:
        return '⭕';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Topic Management</h2>
              <p className="text-purple-100">
                {classItem.studentName} • {classItem.courseName}
              </p>
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-purple-200 mt-1">
                  Debug: Student ID: {classItem.studentId} | Class ID: {classItem.classScheduleId}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          {/* Debug Panel (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg text-xs">
              <strong>Debug Info:</strong><br/>
              Student ID: {classItem.studentId}<br/>
              Course ID: {classItem.courseId || classItem.course?._id || classItem.course}<br/>
              Course Name: {classItem.courseName}<br/>
              Class Schedule ID: {classItem.classScheduleId}<br/>
              Topics Count: {topics.length}<br/>
              Changed Topics: {topics.filter(t => t.hasChanges).length}
            </div>
          )}

          {/* Filters and Stats */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Chapters</option>
                {Object.keys(topicsByChapter).map(chapter => (
                  <option key={chapter} value={chapter}>{chapter}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span>Completed: {topics.filter(t => t.status === 'completed').length}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                <span>In Progress: {topics.filter(t => t.status === 'ongoing').length}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span>Not Started: {topics.filter(t => t.status === 'not-started').length}</span>
              </div>
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-4">
            {filteredTopics.length === 0 ? (
              <div className="text-center py-12">
                <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No topics found</p>
                <p className="text-gray-500 text-sm">Try adjusting your search or filter</p>
              </div>
            ) : (
              filteredTopics.map((topic, index) => (
                <div 
                  key={`${topic.chapterId}-${topic.topicNumber}-${index}`} 
                  className={`border-2 rounded-xl p-6 transition-all ${
                    topic.hasChanges ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Topic Info */}
                    <div className="lg:col-span-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{topic.topicNumber}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {topic.topicTitle}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">{topic.chapterTitle}</p>
                          
                          {topic.topicDescription && (
                            <p className="text-xs text-gray-500">{topic.topicDescription}</p>
                          )}

                          {topic.completedAt && (
                            <p className="text-xs text-green-600 mt-2 font-medium">
                              ✅ Completed: {new Date(topic.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Control */}
                    <div className="lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={topic.status}
                        onChange={(e) => handleStatusChange(index, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="not-started">Not Started</option>
                        <option value="ongoing">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      
                      <div className="mt-3">
                        <span className={`px-3 py-1 text-xs rounded-full border font-medium ${getStatusColor(topic.status)}`}>
                          {getStatusIcon(topic.status)} {topic.status.replace('-', ' ').replace('_', ' ').toUpperCase()}
                        </span>
                        {topic.hasChanges && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-bold">
                            CHANGED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Teacher Notes */}
                    <div className="lg:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teacher Notes
                      </label>
                      <textarea
                        value={topic.tempNotes}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Add notes about this topic, student understanding, areas to review..."
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {topics.filter(t => t.hasChanges).length} topics have changes
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={loading || topics.filter(t => t.hasChanges).length === 0}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 transition-all transform hover:scale-105 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Save All Changes ({topics.filter(t => t.hasChanges).length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicManagementModal;
