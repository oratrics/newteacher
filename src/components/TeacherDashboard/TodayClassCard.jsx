// components/TeacherDashboard/TodayClassCard.jsx
import React from 'react';
import { 
  ClockIcon, 
  UserIcon, 
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

const TodayClassCard = ({ classData, onMarkAttendance }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{classData.studentName}</h3>
            <p className="text-sm text-gray-500">{classData.courseName}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(classData.status)}`}>
          {classData.status}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="h-4 w-4 mr-1" />
          {classData.classTime}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <AcademicCapIcon className="h-4 w-4 mr-1" />
          {classData.completedTopics}/{classData.totalTopics} topics
        </div>
      </div>

      {classData.status === 'pending' && (
        <div className="mt-3 flex space-x-2">
          <button 
            onClick={() => onMarkAttendance(classData.classScheduleId)}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Mark Completed
          </button>
          <button className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Mark Absent
          </button>
        </div>
      )}
    </div>
  );
};

export default TodayClassCard;
