// components/TeacherDashboard/PendingActions.jsx - PRODUCTION VERSION
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { 
  ClockIcon as Hourglass,
  ClipboardDocumentCheckIcon as ClipboardList,
  BookOpenIcon as BookOpen,
  CalendarDaysIcon as CalendarDays,
  CurrencyDollarIcon as DollarSign,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PendingActions = ({ 
  data, 
  onActionClick, 
  onRefresh, 
  loading = false, 
  className = '' 
}) => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Generate actions from all data sources
  const generateActionsFromData = (homepageData) => {
    if (!homepageData) return [];

    const actions = [];

    // 1. ATTENDANCE ACTIONS
    if (homepageData.pendingAttendance && Array.isArray(homepageData.pendingAttendance)) {
      homepageData.pendingAttendance.forEach(pa => {
        actions.push({
          id: `attendance_${pa.classScheduleId}`,
          type: 'attendance',
          message: pa.message || `Mark attendance for ${pa.student?.name} - ${pa.course?.title}`,
          student: pa.student?.name,
          studentId: pa.student?._id,
          classScheduleId: pa.classScheduleId,
          enrollmentId: pa.enrollmentId,
          daysOverdue: pa.daysOverdue,
          urgent: pa.daysOverdue > 7,
          priority: pa.urgencyLevel || 'medium',
          actionData: pa.actionData,
          classDate: pa.classDate
        });
      });
    }

    // 2. HOMEWORK ACTIONS
    if (homepageData.pendingHomework && Array.isArray(homepageData.pendingHomework)) {
      homepageData.pendingHomework.forEach(hw => {
        actions.push({
          id: `homework_${hw.homeworkId}`,
          type: 'homework',
          message: hw.message || `Grade homework by ${hw.student?.name}`,
          student: hw.student?.name,
          studentId: hw.student?._id,
          homeworkId: hw.homeworkId,
          daysWaiting: hw.daysWaiting,
          priority: hw.daysWaiting > 5 ? 'high' : 'medium',
          actionData: hw.actionData,
          title: hw.title
        });
      });
    }

    // 3. RESCHEDULE ACTIONS
    if (homepageData.rescheduleRequests && Array.isArray(homepageData.rescheduleRequests)) {
      homepageData.rescheduleRequests.forEach(rr => {
        actions.push({
          id: `reschedule_${rr.classScheduleId}`,
          type: 'reschedule',
          message: rr.message || `Handle reschedule request from ${rr.student?.name}`,
          student: rr.student?.name,
          studentId: rr.student?._id,
          classScheduleId: rr.classScheduleId,
          priority: 'medium',
          actionData: rr.actionData,
          originalDate: rr.originalDate,
          requestedDate: rr.requestedDate,
          reason: rr.reason
        });
      });
    }

    // 4. DEMO FEEDBACK ACTIONS (if you have demo functionality)
    if (homepageData.demoFeedbacks && Array.isArray(homepageData.demoFeedbacks)) {
      homepageData.demoFeedbacks.forEach(df => {
        actions.push({
          id: `demo_${df.demoId}`,
          type: 'demo-feedback',
          message: df.message || `Provide feedback for ${df.student?.name}'s demo`,
          student: df.student?.name,
          studentId: df.student?._id,
          demoId: df.demoId,
          priority: 'high',
          actionData: df.actionData
        });
      });
    }

    // Sort by priority and urgency
    return actions.sort((a, b) => {
      const priorityOrder = { critical: 4, urgent: 3, high: 2, medium: 1, low: 0 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Secondary sort by days overdue/waiting
      const aUrgency = a.daysOverdue || a.daysWaiting || 0;
      const bUrgency = b.daysOverdue || b.daysWaiting || 0;
      return bUrgency - aUrgency;
    });
  };

  const actions = generateActionsFromData(data);
  const totalActions = actions.length;

  // Count by type
  const actionCounts = actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    acc.total++;
    return acc;
  }, { attendance: 0, homework: 0, reschedule: 0, 'demo-feedback': 0, total: 0 });

  // Handle action clicks
  const handleActionClick = async (action) => {
    console.log('📋 Handling action:', action.type, 'for', action.student);

    try {
      if (onActionClick) {
        await onActionClick(action);
        return;
      }

      // Default handling if no custom handler provided
      switch (action.type) {
        case 'attendance':
          console.log('Navigate to attendance for:', action.student);
          navigate(`/teacher/students/${action.studentId}/attendance`, {
            state: { 
              classScheduleId: action.classScheduleId,
              enrollmentId: action.enrollmentId,
              action: 'mark-attendance' 
            }
          });
          break;

        case 'homework':
          console.log('Navigate to homework grading for:', action.student);
          navigate(`/teacher/homework/${action.homeworkId}/grade`, {
            state: {
              studentId: action.studentId,
              action: 'grade-homework'
            }
          });
          break;

        case 'reschedule':
          console.log('Navigate to reschedule handling for:', action.student);
          navigate(`/teacher/schedule/reschedule/${action.classScheduleId}`, {
            state: {
              studentId: action.studentId,
              action: 'handle-reschedule'
            }
          });
          break;

        case 'demo-feedback':
          console.log('Navigate to demo feedback for:', action.student);
          navigate(`/teacher/demos/${action.demoId}/feedback`, {
            state: {
              studentId: action.studentId,
              action: 'provide-feedback'
            }
          });
          break;

        default:
          console.warn('Unknown action type:', action.type);
          toast.warn('Action not implemented yet');
      }
    } catch (error) {
      console.error('Error handling action:', error);
      toast.error('Failed to handle action');
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
        toast.success('Actions refreshed!');
      } catch (error) {
        toast.error('Failed to refresh');
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Action configuration
  const actionConfig = {
    attendance: {
      icon: ClipboardList,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      buttonText: 'Mark',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    homework: {
      icon: BookOpen,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      buttonText: 'Grade',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    reschedule: {
      icon: CalendarDays,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      buttonText: 'Handle',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    },
    'demo-feedback': {
      icon: DollarSign,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      buttonText: 'Feedback',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
    }
  };

  // Header actions
  const headerActions = (
    <div className="flex items-center space-x-3">
      {/* Action counts */}
      {totalActions > 0 && (
        <div className="flex items-center space-x-1">
          {Object.entries(actionCounts).map(([type, count]) => {
            if (type === 'total' || count === 0) return null;
            const config = actionConfig[type];
            if (!config) return null;
            
            return (
              <div 
                key={type}
                className={`px-2 py-1 rounded-full ${config.bgColor} ${config.textColor} text-xs font-semibold flex items-center`}
              >
                <config.icon className="w-3 h-3 mr-1" />
                {count}
              </div>
            );
          })}
        </div>
      )}

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 disabled:opacity-50"
          title="Refresh actions"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );

  return (
    <Card 
      titleText="Actions Needed!" 
      titleIcon={totalActions > 0 ? ExclamationTriangleIcon : CheckCircleIcon}
      variant={totalActions > 0 ? "error" : "success"}
      className={className}
      headerActions={headerActions}
      subtitle={totalActions > 0 ? `${totalActions} pending actions require attention` : "All caught up! No pending actions."}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Loading actions...</p>
          </div>
        </div>
      ) : totalActions === 0 ? (
        <div className="text-center py-12">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending actions. Great work staying on top of everything!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {actions.map((action) => {
            const config = actionConfig[action.type] || {
              icon: BellIcon,
              color: 'gray',
              bgColor: 'bg-gray-50',
              textColor: 'text-gray-600',
              buttonText: 'Handle',
              buttonColor: 'bg-gray-600 hover:bg-gray-700'
            };

            return (
              <div 
                key={action.id}
                className={`
                  relative flex items-center justify-between 
                  bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-200
                  hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]
                  ${action.urgent ? 'border-red-300 bg-red-50' : ''}
                `}
              >
                {/* Urgency indicator */}
                {action.urgent && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                )}

                {/* Action content */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={`p-3 ${config.bgColor} rounded-xl flex-shrink-0`}>
                    <config.icon className={`w-5 h-5 ${config.textColor}`} />
                  </div>

                  {/* Message and details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium text-sm mb-1 truncate">
                      {action.message}
                    </p>
                    
                    {/* Additional details */}
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {action.student && (
                        <span>👤 {action.student}</span>
                      )}
                      
                      {action.daysOverdue && (
                        <span className={action.daysOverdue > 7 ? 'text-red-600' : action.daysOverdue > 3 ? 'text-yellow-600' : ''}>
                          ⏰ {action.daysOverdue} days overdue
                        </span>
                      )}
                      
                      {action.daysWaiting && (
                        <span>⏳ {action.daysWaiting} days waiting</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button 
                  onClick={() => handleActionClick(action)}
                  disabled={loading}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-semibold text-white
                    transition-all duration-300 transform hover:scale-105
                    shadow-md hover:shadow-lg disabled:opacity-50
                    ${config.buttonColor}
                  `}
                >
                  {config.buttonText}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default PendingActions;
