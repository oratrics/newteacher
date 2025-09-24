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
// Performance Modal
const PerformanceModal = ({ classItem, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    score: classItem.performanceScore || 85,
    feedback: classItem.performanceFeedback || '',
    status: 'completed'
  });

  const [categories, setCategories] = useState({
    understanding: 85,
    participation: 80,
    homework: 90,
    behavior: 95
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const performanceData = {
        ...formData,
        score: parseInt(formData.score),
        categories: categories,
        date: new Date()
      };

      const response = await teacherAPI.addPerformance(classItem.classScheduleId, performanceData);
      
      if (response && response.success) {
        toast.success('Performance added successfully!');
        onSuccess('Performance record updated!');
        onClose();
      } else {
        toast.error(response?.message || 'Failed to add performance');
      }
    } catch (error) {
      console.error('Error adding performance:', error);
      toast.error(error.message || 'Failed to add performance');
    } finally {
      setLoading(false);
    }
  };

  const updateOverallScore = () => {
    const average = Object.values(categories).reduce((sum, val) => sum + val, 0) / Object.values(categories).length;
    setFormData(prev => ({ ...prev, score: Math.round(average) }));
  };

  const handleCategoryChange = (category, value) => {
    setCategories(prev => {
      const updated = { ...prev, [category]: parseInt(value) };
      // Auto-update overall score
      const average = Object.values(updated).reduce((sum, val) => sum + val, 0) / Object.values(updated).length;
      setFormData(prevForm => ({ ...prevForm, score: Math.round(average) }));
      return updated;
    });
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                <StarIcon className="h-7 w-7 mr-3" />
                Performance Assessment
              </h2>
              <p className="text-yellow-100">
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
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Category Scores */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-yellow-600" />
                    Category Scores
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'understanding', label: 'Concept Understanding', icon: '🧠' },
                      { key: 'participation', label: 'Class Participation', icon: '🗣️' },
                      { key: 'homework', label: 'Homework Completion', icon: '📝' },
                      { key: 'behavior', label: 'Class Behavior', icon: '😊' }
                    ].map((category) => (
                      <div key={category.key} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            <span className="mr-2">{category.icon}</span>
                            {category.label}
                          </label>
                          <span className={`text-2xl font-bold ${getScoreColor(categories[category.key])}`}>
                            {categories[category.key]}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={categories[category.key]}
                          onChange={(e) => handleCategoryChange(category.key, e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Poor</span>
                          <span>Average</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Score Display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Overall Score</h4>
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(formData.score)}`}>
                      {formData.score}%
                    </div>
                    <div className={`text-2xl font-bold mb-4 ${getScoreColor(formData.score)}`}>
                      Grade: {getGrade(formData.score)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="font-medium text-gray-700">Performance Level</div>
                        <div className={`font-bold ${getScoreColor(formData.score)}`}>
                          {formData.score >= 90 ? 'Excellent' :
                           formData.score >= 80 ? 'Good' :
                           formData.score >= 70 ? 'Satisfactory' :
                           formData.score >= 60 ? 'Needs Improvement' : 'Poor'}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="font-medium text-gray-700">Class Date</div>
                        <div className="font-bold text-gray-900">
                          {new Date(classItem.classDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Feedback */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-yellow-600" />
                    Detailed Feedback
                  </h3>
                  
                  <textarea
                    value={formData.feedback}
                    onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                    rows={12}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="Provide detailed feedback about the student's performance in this class:

• What concepts did they understand well?
• Which areas need more practice?
• How was their participation and engagement?
• Any specific achievements or improvements?
• Suggestions for future learning..."
                  />
                </div>

                {/* Quick Feedback Templates */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Templates</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "Excellent understanding of today's concepts. Keep up the great work!",
                      "Good participation but needs more practice with problem-solving.",
                      "Shows improvement in understanding. Continue practicing at home.",
                      "Struggled with some concepts. Recommend additional review sessions."
                    ].map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          feedback: prev.feedback + (prev.feedback ? '\n\n' : '') + template 
                        }))}
                        className="text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Performance assessment for {new Date(classItem.classDate).toLocaleDateString()}
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
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:from-yellow-600 hover:to-orange-700 disabled:opacity-50 transition-all transform hover:scale-105 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <StarIcon className="h-5 w-5 mr-2" />
                    Save Performance
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
export default PerformanceModal;