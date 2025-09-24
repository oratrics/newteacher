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
const NotesModal = ({ classItem, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: `Class Notes - ${new Date(classItem.classDate).toLocaleDateString()}`,
    content: '',
    pinned: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noteData = {
        ...formData,
        studentId: classItem.studentId,
        classScheduleId: classItem.classScheduleId,
        createdAt: new Date()
      };

      const response = await teacherAPI.addNote(noteData);
      
      if (response && response.success) {
        toast.success('Note saved successfully!');
        onSuccess('Class note added successfully!');
        onClose();
      } else {
        toast.error(response?.message || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                <DocumentTextIcon className="h-7 w-7 mr-3" />
                Class Notes
              </h2>
              <p className="text-green-100">
                {classItem.studentName} • {classItem.courseName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter note title..."
                  />
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={(e) => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Pin this note</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Write your notes about this class:

• Student's understanding and participation
• Key concepts covered
• Areas that need more attention
• Homework assigned
• Any behavioral observations
• Follow-up actions needed
• Parent communication notes"
                />
              </div>

              {/* Quick Templates */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Note Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Student showed excellent understanding of today's lesson.",
                    "Needs additional practice with problem-solving techniques.",
                    "Great participation and engagement throughout the class.",
                    "Homework assigned: Practice exercises 1-10.",
                    "Recommend additional review session before next class.",
                    "Parent meeting scheduled to discuss progress."
                  ].map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        content: prev.content + (prev.content ? '\n• ' : '• ') + template 
                      }))}
                      className="text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      • {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Class: {new Date(classItem.classDate).toLocaleDateString()} at {classItem.classTime}
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
                type="submit"
                disabled={loading || !formData.content.trim()}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 disabled:opacity-50 transition-all transform hover:scale-105 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Save Note
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


export default NotesModal;
