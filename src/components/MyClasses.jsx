import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';

// Reusable ClassCard component
const ClassCard = ({ classData, onJoinClass }) => {
  const {
    studentName,
    studentTimezone,
    timeTeacher,
    classScheduleId,
    joinUrl,
    status,
    isRescheduleRequested,
  } = classData;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return { text: 'Upcoming', color: 'bg-green-600' };
      case 'pending':
        return { text: 'Pending', color: 'bg-yellow-500' };
      case 'completed':
        return { text: 'Completed', color: 'bg-blue-600' };
      default:
        return { text: 'N/A', color: 'bg-gray-500' };
    }
  };

  const statusBadge = getStatusBadge(status);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
      <div className="flex-1 space-y-1">
        <h3 className="text-xl font-semibold flex items-center">
          <User size={20} className="mr-2 text-blue-400" />
          {studentName}
        </h3>
        <p className="text-sm text-gray-400 flex items-center">
          <Clock size={16} className="mr-2" />
          Class Time: <span className="font-medium text-white ml-1">{timeTeacher}</span>
        </p>
        <p className="text-sm text-gray-400 flex items-center">
          <Calendar size={16} className="mr-2" />
          <span className="font-medium text-white ml-1">{studentTimezone}</span>
        </p>
        {isRescheduleRequested && (
          <div className="flex items-center text-yellow-500 text-sm">
            <RotateCcw size={16} className="mr-1" />
            Reschedule Requested
          </div>
        )}
      </div>
      <div className="flex flex-col items-end space-y-2">
        <span
          className={clsx(
            "text-xs font-bold px-2 py-1 rounded-full text-white",
            statusBadge.color
          )}
        >
          {statusBadge.text}
        </span>
        <button
          onClick={() => onJoinClass(classScheduleId)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
        >
          Join Class
        </button>
      </div>
    </div>
  );
};

// Main dashboard component
const MyClasses = () => {
  const [classesData, setClassesData] = useState({
    todayClasses: [],
    tomorrowClasses: [],
    dayAfterTomorrowClasses: [],
    pendingClasses: 0,
    totalClasses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const userString = localStorage.getItem('teacherUser');
  const user = userString ? JSON.parse(userString) : null;
  const userId = user ? user.id : null;

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`/api/teachers/new/testclasses`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('teacherToken')}` },
        });

        setClassesData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching class data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleJoinClass = (classScheduleId) => {
    navigate(`/live-class/${classScheduleId}`, { state: { userId: userId } });

    
  };

  const renderClassList = (classes, title) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
      {classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <ClassCard key={c.classScheduleId} classData={c} onJoinClass={handleJoinClass} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No classes scheduled for {title.toLowerCase()}.</p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <p className="text-xl">Loading your class schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-red-500">
        <p className="text-xl">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">My Classes Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
          <div className="p-3 bg-blue-600 rounded-full mr-4">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Classes</p>
            <p className="text-3xl font-bold">{classesData.totalClasses}</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
          <div className="p-3 bg-yellow-500 rounded-full mr-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Pending Classes</p>
            <p className="text-3xl font-bold">{classesData.pendingClasses}</p>
          </div>
        </div>
      </div>
      {renderClassList(classesData.todayClasses, "Today's Classes")}
      {renderClassList(classesData.tomorrowClasses, "Tomorrow's Classes")}
      {renderClassList(classesData.dayAfterTomorrowClasses, "Upcoming Classes")}
    </div>
  );
};

export default MyClasses;