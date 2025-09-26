import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, ChevronUpIcon, EyeIcon, PencilIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
const baseurl = 'https://backend.oratrics.in';

const TeacherHomeworkDashboard = () => {
    // State management
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [gradingMode, setGradingMode] = useState(false);
    const [gradeForm, setGradeForm] = useState({ grade: '', teacherFeedback: '' });

    // Filters and pagination state
    const [filters, setFilters] = useState({
        status: 'submitted',
        studentName: '',
        courseId: '',
        sortBy: 'submittedAt',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10
    });

    // UI state
    const [showFilters, setShowFilters] = useState(false);

    // Fetch submissions with current filters
    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit,
                ...filters
            });

            // Remove empty filters
            Object.keys(filters).forEach(key => {
                if (!filters[key]) {
                    queryParams.delete(key);
                }
            });

            const response = await fetch(`${baseurl}/api/newteachers/submissions?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch submissions');
            }

            if (data.success) {
                setSubmissions(data.data.submissions);
                setPagination(prev => ({
                    ...prev,
                    ...data.data.pagination
                }));
            } else {
                throw new Error(data.message || 'Failed to fetch submissions');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching submissions:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.limit]);

    // Initial load and when filters/pagination change
    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({
            ...prev,
            currentPage: 1 // Reset to first page when filtering
        }));
    };

    // Handle sorting
    const handleSort = (sortBy) => {
        const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
        setFilters(prev => ({
            ...prev,
            sortBy,
            sortOrder: newSortOrder
        }));
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        setPagination(prev => ({
            ...prev,
            currentPage: newPage
        }));
    };

    // Open submission details
    const openSubmissionDetails = (submission) => {
        setSelectedSubmission(submission);
        if (submission.status === 'submitted') {
            setGradeForm({
                grade: '',
                teacherFeedback: ''
            });
        } else if (submission.status === 'graded') {
            setGradeForm({
                grade: submission.grade || '',
                teacherFeedback: submission.teacherFeedback || ''
            });
        }
    };

    // Close submission details
    const closeSubmissionDetails = () => {
        setSelectedSubmission(null);
        setGradingMode(false);
        setGradeForm({ grade: '', teacherFeedback: '' });
    };

    // Handle grading submission
    const handleGradeSubmission = async () => {
        if (!selectedSubmission || !gradeForm.grade) {
            alert('Please enter a grade');
            return;
        }

        try {
            const response = await fetch(
                `${baseurl}/api/newteachers/grade/${selectedSubmission.enrollmentId}/${selectedSubmission.homeworkItemId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
                    },
                    body: JSON.stringify({
                        grade: parseFloat(gradeForm.grade),
                        teacherFeedback: gradeForm.teacherFeedback
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to grade submission');
            }

            if (data.success) {
                // Update local state
                setSubmissions(prev => 
                    prev.map(sub => 
                        sub.homeworkItemId === selectedSubmission.homeworkItemId
                            ? { ...sub, status: 'graded', grade: data.data.grade, teacherFeedback: data.data.teacherFeedback, gradedAt: data.data.gradedAt }
                            : sub
                    )
                );

                // Update selected submission
                setSelectedSubmission(prev => ({
                    ...prev,
                    status: 'graded',
                    grade: data.data.grade,
                    teacherFeedback: data.data.teacherFeedback,
                    gradedAt: data.data.gradedAt
                }));

                setGradingMode(false);
                alert('Homework graded successfully!');
            } else {
                throw new Error(data.message || 'Failed to grade submission');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
            console.error('Error grading submission:', err);
        }
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    // Get status badge color
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'assigned': return 'bg-yellow-100 text-yellow-800';
            case 'submitted': return 'bg-blue-100 text-blue-800';
            case 'graded': return 'bg-green-100 text-green-800';
            case 'missed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Render loading state [web:22][web:25]
    if (loading && submissions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading homework submissions...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && submissions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <XMarkIcon className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="mt-4 text-red-600">Error: {error}</p>
                    <button 
                        onClick={fetchSubmissions}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <h1 className="text-3xl font-bold text-gray-900">Homework Management</h1>
                        <p className="mt-2 text-gray-600">Manage and grade student homework submissions</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Filters & Search</h2>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <FunnelIcon className="h-4 w-4" />
                                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                            </button>
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="graded">Graded</option>
                                        <option value="missed">Missed</option>
                                    </select>
                                </div>

                                {/* Student Name Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={filters.studentName}
                                            onChange={(e) => handleFilterChange('studentName', e.target.value)}
                                            placeholder="Search by student name..."
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                </div>

                                {/* Sort By */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="submittedAt">Submission Date</option>
                                        <option value="assignedAt">Assignment Date</option>
                                        <option value="gradedAt">Graded Date</option>
                                        <option value="studentName">Student Name</option>
                                        <option value="homeworkTitle">Homework Title</option>
                                        <option value="grade">Grade</option>
                                    </select>
                                </div>

                                {/* Sort Order */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                                    <select
                                        value={filters.sortOrder}
                                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="desc">Descending</option>
                                        <option value="asc">Ascending</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900">
                                Homework Submissions ({pagination.totalRecords})
                            </h2>
                            {loading && (
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    <span>Loading...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No homework submissions found with current filters.</p>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button 
                                                    onClick={() => handleSort('studentName')}
                                                    className="flex items-center space-x-1 hover:text-gray-700"
                                                >
                                                    <span>Student</span>
                                                    {filters.sortBy === 'studentName' && (
                                                        filters.sortOrder === 'asc' ? 
                                                        <ChevronUpIcon className="h-4 w-4" /> : 
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button 
                                                    onClick={() => handleSort('homeworkTitle')}
                                                    className="flex items-center space-x-1 hover:text-gray-700"
                                                >
                                                    <span>Homework</span>
                                                    {filters.sortBy === 'homeworkTitle' && (
                                                        filters.sortOrder === 'asc' ? 
                                                        <ChevronUpIcon className="h-4 w-4" /> : 
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button 
                                                    onClick={() => handleSort('grade')}
                                                    className="flex items-center space-x-1 hover:text-gray-700"
                                                >
                                                    <span>Grade</span>
                                                    {filters.sortBy === 'grade' && (
                                                        filters.sortOrder === 'asc' ? 
                                                        <ChevronUpIcon className="h-4 w-4" /> : 
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button 
                                                    onClick={() => handleSort('submittedAt')}
                                                    className="flex items-center space-x-1 hover:text-gray-700"
                                                >
                                                    <span>Submitted</span>
                                                    {filters.sortBy === 'submittedAt' && (
                                                        filters.sortOrder === 'asc' ? 
                                                        <ChevronUpIcon className="h-4 w-4" /> : 
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {submissions.map((submission) => (
                                            <tr key={submission.homeworkItemId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{submission.studentName}</div>
                                                        <div className="text-sm text-gray-500">{submission.studentEmail}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{submission.homeworkTitle}</div>
                                                    <div className="text-sm text-gray-500">{submission.submissionType}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {submission.courseTitle}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(submission.status)}`}>
                                                        {submission.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {submission.grade !== null && submission.grade !== undefined ? 
                                                        `${submission.grade}/${submission.maxGrade}` : 
                                                        '-'
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(submission.submittedAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => openSubmissionDetails(submission)}
                                                        className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        <span>View</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing page {pagination.currentPage} of {pagination.totalPages} 
                                            ({pagination.totalRecords} total submissions)
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                                disabled={!pagination.hasPrevPage}
                                                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                            >
                                                Previous
                                            </button>
                                            
                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                const pageNumber = Math.max(1, pagination.currentPage - 2) + i;
                                                if (pageNumber > pagination.totalPages) return null;
                                                
                                                return (
                                                    <button
                                                        key={pageNumber}
                                                        onClick={() => handlePageChange(pageNumber)}
                                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                                            pageNumber === pagination.currentPage
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                        }`}
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}
                                            
                                            <button
                                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                disabled={!pagination.hasNextPage}
                                                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Submission Details Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">
                                Homework Submission Details
                            </h3>
                            <button
                                onClick={closeSubmissionDetails}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Submission Info */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Student Information</h4>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="font-medium">{selectedSubmission.studentName}</p>
                                            <p className="text-sm text-gray-600">{selectedSubmission.studentEmail}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Homework Details</h4>
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                            <p className="font-medium">{selectedSubmission.homeworkTitle}</p>
                                            <p className="text-sm text-gray-600">{selectedSubmission.homeworkDescription}</p>
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Type: {selectedSubmission.submissionType}</span>
                                                <span>Max Grade: {selectedSubmission.maxGrade}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Content</h4>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            {selectedSubmission.submittedText && (
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium mb-1">Text Submission:</p>
                                                    <p className="text-sm whitespace-pre-wrap">{selectedSubmission.submittedText}</p>
                                                </div>
                                            )}
                                            {selectedSubmission.submissionLink && (
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium mb-1">File Submission:</p>
                                                    <a 
                                                        href={selectedSubmission.submissionLink} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                                                    >
                                                        View Submitted File
                                                    </a>
                                                </div>
                                            )}
                                            {selectedSubmission.quizAnswers && selectedSubmission.quizAnswers.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium mb-2">Quiz Answers:</p>
                                                    <div className="space-y-2">
                                                        {selectedSubmission.quizAnswers.map((answer, index) => (
                                                            <div key={index} className="text-sm">
                                                                <span className="font-medium">Q{index + 1}:</span> {JSON.stringify(answer.answer)}
                                                                {answer.isCorrect !== undefined && (
                                                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                                                        answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Timeline</h4>
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                                            <p>Assigned: {formatDate(selectedSubmission.assignedAt)}</p>
                                            <p>Submitted: {formatDate(selectedSubmission.submittedAt)}</p>
                                            {selectedSubmission.gradedAt && (
                                                <p>Graded: {formatDate(selectedSubmission.gradedAt)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Grading Section */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Grading Section</h4>
                                        
                                        {selectedSubmission.status === 'graded' && !gradingMode ? (
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-lg font-semibold text-green-800">
                                                        Grade: {selectedSubmission.grade}/{selectedSubmission.maxGrade}
                                                    </span>
                                                    <button
                                                        onClick={() => setGradingMode(true)}
                                                        className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                        <span>Edit Grade</span>
                                                    </button>
                                                </div>
                                                {selectedSubmission.teacherFeedback && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 mb-1">Teacher Feedback:</p>
                                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSubmission.teacherFeedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Grade (out of {selectedSubmission.maxGrade})
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={selectedSubmission.maxGrade}
                                                        step="0.1"
                                                        value={gradeForm.grade}
                                                        onChange={(e) => setGradeForm(prev => ({ ...prev, grade: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Enter grade..."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Teacher Feedback (Optional)
                                                    </label>
                                                    <textarea
                                                        rows={6}
                                                        value={gradeForm.teacherFeedback}
                                                        onChange={(e) => setGradeForm(prev => ({ ...prev, teacherFeedback: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Provide feedback to the student..."
                                                        maxLength="1000"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {gradeForm.teacherFeedback.length}/1000 characters
                                                    </p>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={handleGradeSubmission}
                                                        disabled={!gradeForm.grade}
                                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                        <span>{selectedSubmission.status === 'graded' ? 'Update Grade' : 'Submit Grade'}</span>
                                                    </button>
                                                    {gradingMode && (
                                                        <button
                                                            onClick={() => setGradingMode(false)}
                                                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h4>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Status</p>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedSubmission.status)}`}>
                                                        {selectedSubmission.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Course</p>
                                                    <p className="font-medium">{selectedSubmission.courseTitle}</p>
                                                </div>
                                                {selectedSubmission.grade !== null && selectedSubmission.grade !== undefined && (
                                                    <div>
                                                        <p className="text-gray-600">Percentage</p>
                                                        <p className="font-medium">
                                                            {Math.round((selectedSubmission.grade / selectedSubmission.maxGrade) * 100)}%
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherHomeworkDashboard;
