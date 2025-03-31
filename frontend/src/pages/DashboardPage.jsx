import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle, ArrowRightCircle, XCircle, RefreshCw, Clock, QrCode } from 'lucide-react';
import { studentService, attendanceService } from '../services/api';
import { toast } from 'react-toastify';
import { DateTime } from 'luxon';
import Chart from 'chart.js/auto';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Helper functions for date/time handling
const getDateRange = () => {
  const now = DateTime.now().setZone('Asia/Colombo');
  const startOfDay = now.startOf('day').toJSDate();
  return { startOfDay };
};

const formatTime = (time) => {
  if (!time) return '-';
  
  try {
    // Try parsing as Date object first
    if (time instanceof Date) {
      return DateTime.fromJSDate(time)
        .setZone('Asia/Colombo')
        .toLocaleString(DateTime.TIME_WITH_SECONDS);
    }
    
    // Then try as ISO string
    const parsedTime = DateTime.fromISO(time);
    if (parsedTime.isValid) {
      return parsedTime.setZone('Asia/Colombo').toLocaleString(DateTime.TIME_WITH_SECONDS);
    }
    
    // Last resort, try as JS Date constructor
  return DateTime.fromJSDate(new Date(time))
      .setZone('Asia/Colombo')
    .toLocaleString(DateTime.TIME_WITH_SECONDS);
  } catch (e) {
    console.warn(`Invalid time format: ${time}`, e);
    return '-';
  }
};

const getStatusBadge = (status) => {
  if (!status) return 'px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  
  const baseClasses = 'px-2.5 py-0.5 rounded-full text-xs font-medium';
  const statusLower = status.toLowerCase();
  
  if (statusLower === 'present' || statusLower === 'entered') {
      return `${baseClasses} bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 text-green-800 dark:text-green-100`;
  } else if (statusLower === 'left') {
      return `${baseClasses} bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 text-blue-800 dark:text-blue-100`;
  } else if (statusLower === 'late') {
    return `${baseClasses} bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-900 text-yellow-800 dark:text-yellow-100`;
  } else if (statusLower === 'absent') {
      return `${baseClasses} bg-gradient-to-r from-red-100 to-red-200 dark:from-red-800 dark:to-red-900 text-red-800 dark:text-red-100`;
  }
  
  return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200`;
};

// Enhanced StatsCard component
const StatsCard = ({ title, count, total, color, icon }) => (
  <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          <span className={`text-${color}-600 dark:text-${color}-400`}>{count}</span>
          {total !== undefined && <span className="text-gray-400 dark:text-gray-500 text-lg ml-1">/ {total}</span>}
        </p>
      </div>
      <div className={`p-3.5 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-500 dark:from-${color}-600 dark:to-${color}-700 text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

// Enhanced Search and Filter components
const SearchFilter = ({ searchQuery, setSearchQuery, filterStatus, setFilterStatus }) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-6">
    <div className="relative flex-grow">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search students..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 w-full px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-white shadow-sm"
      />
    </div>
    <select
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
      className="px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-white shadow-sm"
    >
      <option value="all">All Statuses</option>
      <option value="present">Present</option>
      <option value="absent">Absent</option>
      <option value="left">Left</option>
      <option value="late">Late</option>
    </select>
  </div>
);

// Add Modal component for QR code display
const QRCodeModal = ({ isOpen, onClose, student }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Don't render if modal isn't open or student is undefined
  if (!isOpen) return null;
  
  // If student is null/undefined, show error
  if (!student) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-gradient-to-b from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-scaleIn">
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center py-8">
            <div className="text-red-500 dark:text-red-400 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">Student data unavailable</p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Cannot display QR code - student data is missing</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-md hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 shadow-md transition-all transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Ensure student has an _id property before attempting to load QR code
  const studentId = student._id || student.id;
  const hasValidId = typeof studentId === 'string' || typeof studentId === 'number';
  
  if (!hasValidId) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-gradient-to-b from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-scaleIn">
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center py-8">
            <div className="text-red-500 dark:text-red-400 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">Invalid student data</p>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Unable to display QR code - missing student ID</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-md hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 shadow-md transition-all transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Refresh QR code with timestamp to avoid caching
  const qrCodeUrl = `/api/admin/students/${studentId}/qr-code?timestamp=${Date.now()}&retry=${retryCount}`;
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-scaleIn">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-4 border-b border-blue-100 dark:border-blue-800 pb-2">
          {student?.name || 'Student'} QR Code
        </h3>
        
        <div className="flex flex-col items-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mb-4"></div>
              <p className="text-blue-600 dark:text-blue-400">Loading QR Code...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 dark:text-red-400 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium">Failed to load QR code</p>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{error}</p>
              <button 
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setRetryCount(prev => prev + 1);
                }}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-md hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 shadow-md transition-all duration-300 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-md border border-blue-100 dark:border-blue-800">
                <img 
                  src={qrCodeUrl}
                  alt={`QR Code for ${student?.name || 'Student'}`}
                  className="w-64 h-64 object-contain rounded-md transform transition-transform duration-500 hover:scale-105"
                  onLoad={() => setLoading(false)}
                  onError={(e) => {
                    setLoading(false);
                    setError("Unable to load QR code image");
                  }}
                />
              </div>
              <div className="mt-6 text-center">
                <p className="font-medium text-blue-900 dark:text-blue-300 text-lg">{student?.name || 'N/A'}</p>
                <p className="text-blue-600 dark:text-blue-400 font-mono">{student?.indexNumber || 'N/A'}</p>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-700 shadow transition-all duration-300 transform hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced StudentTable component with QR code icon
const StudentTable = ({ students, loading, onShowQRCode }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400"></div>
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="text-center py-16 bg-gradient-to-b from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-blue-100 dark:border-blue-900">
        <svg className="mx-auto h-12 w-12 text-blue-300 dark:text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="mt-4 text-blue-600 dark:text-blue-400 font-medium">No students found</p>
        <p className="text-blue-400 dark:text-blue-500 text-sm mt-1">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-xl border border-gray-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800">
          <tr>
            <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-white">
              Student
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-white">
              Index Number
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-white">
              Email
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-white">
              Status
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-white">
              Entry Time
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-white">
              Leave Time
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-white">
              QR Code
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          {students.map((student, index) => (
            <tr key={student.uniqueKey} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-700/50'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150`}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center text-white font-medium shadow-md">
                    {student.name.substring(0, 1)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                {student.indexNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {student.student_email || student.email || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={getStatusBadge(student.status)}>
                  {student.displayStatus || (student.status?.charAt(0).toUpperCase() + student.status?.slice(1)) || 'Unknown'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-1" />
                {formatTime(student.entryTime)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <ArrowRightCircle className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-1" />
                {formatTime(student.leaveTime)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <button
                  onClick={() => onShowQRCode(student)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"
                  title="Show QR Code"
                >
                  <QrCode className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentCount: 0,
    leftCount: 0,
    absentCount: 0,
    lateCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Add state for QR code modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Handle opening the QR code modal
  const handleShowQRCode = (student) => {
    // Skip if student is undefined or has no ID
    if (!student) {
      console.error("Cannot show QR code - student is undefined");
      toast.warning("Cannot show QR code - missing student data");
      return;
    }
    
    // Check for a valid ID (either _id or id)
    const studentId = student._id || student.id;
    if (!studentId) {
      console.error("Cannot show QR code - student has no ID", student);
      toast.warning("Cannot show QR code - student ID is missing");
      return;
    }
    
    console.log("Showing QR code for student:", { 
      id: studentId,
      name: student.name || "Unknown", 
      indexNumber: student.indexNumber || "N/A" 
    });
    
    setSelectedStudent(student);
    setQrModalOpen(true);
  };

  // Handle closing the QR code modal
  const handleCloseQRModal = () => {
    setQrModalOpen(false);
    setTimeout(() => setSelectedStudent(null), 300); // Clear selection after animation
  };

  const fetchRecentActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's attendance
      const attendanceResponse = await attendanceService.getTodayAttendance();
      console.log('Dashboard attendance response:', attendanceResponse);
      
      // Handle potential undefined response
      if (!attendanceResponse || !attendanceResponse.data) {
        setRecentActivity([]);
        setStats({
          totalStudents: 0,
          presentCount: 0,
          leftCount: 0,
          absentCount: 0,
          lateCount: 0
        });
        setLoading(false);
        return;
      }
      
      const { students, totalCount, presentCount, absentCount, lateCount } = attendanceResponse.data;
      
      // If no students data or empty array, just set empty results
      if (!students || students.length === 0) {
        setRecentActivity([]);
        setStats({
          totalStudents: totalCount || 0,
          presentCount: presentCount || 0,
          leftCount: 0,
          absentCount: absentCount || 0,
          lateCount: lateCount || 0
        });
        setLoading(false);
        return;
      }
      
      // Process students data with today's attendance
      const processedStudents = students.map(student => {
        // Make sure we have a valid unique key for React
        const uniqueKey = student._id || student.id || Math.random().toString(36).substring(7);
        
        try {
          // Find today's attendance record (if we have a valid student object with attendanceHistory)
          let todayRecord = null;
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          
          if (student?.attendanceHistory && Array.isArray(student.attendanceHistory)) {
            todayRecord = student.attendanceHistory.find(record => 
              record.date && record.date.startsWith(today)
            );
          }
          
          // Parse entry and leave times (if available in today's record)
          let entryTime = null;
          let leaveTime = null;
          
          if (todayRecord) {
            entryTime = todayRecord.entryTime;
            leaveTime = todayRecord.leaveTime;
          }
          
          // Determine current display status based on status field or attendance record
          let displayStatus = student.status;
          let currentStatus = student.status;
          
          if (todayRecord) {
            // Use the status from today's record if available
            currentStatus = todayRecord.status;
            
            // Normalize status for display
            if (currentStatus) {
              const statusLower = currentStatus.toLowerCase();
              if (statusLower === 'entered') {
                displayStatus = 'Present';
              } else if (statusLower === 'left') {
                displayStatus = 'Left';
              } else {
                // Capitalize first letter
                displayStatus = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
              }
            }
          }
          
          // Use either first/last name combination or the name field
          const studentName = student.firstName && student.lastName
            ? `${student.firstName} ${student.lastName}`
            : student.name || 'Unknown Student';
            
          // Use the most specific email available
          const email = student.student_email || student.email || null;

          return {
            ...student,
            uniqueKey,
            name: studentName,
            email,
            student_email: student.student_email,
            displayStatus,
            status: currentStatus,
            entryTime,
            leaveTime,
            // Add a timestamp property for sorting (use entry time if available)
            timestamp: entryTime ? new Date(entryTime).getTime() : 0
          };
        } catch (err) {
          console.error('Error processing student data:', err);
          // Return a minimal valid student object even if processing fails
          return {
            uniqueKey: uniqueKey,
            name: student.name || student.firstName || 'Unknown Student',
            indexNumber: student.indexNumber || 'N/A',
            status: student.status || 'Unknown',
            displayStatus: student.status || 'Unknown',
            entryTime: null,
            leaveTime: null,
            timestamp: 0,
            _id: student._id || student.id
          };
        }
      });
      
      // Sort by most recent entry time first
      const sortedActivity = processedStudents.sort((a, b) => b.timestamp - a.timestamp);
      
      // Calculate left count (not provided by the API)
      const leftCount = processedStudents.filter(s => 
        s.status && s.status.toLowerCase() === 'left'
      ).length;

      setRecentActivity(sortedActivity);
      setStats({
        totalStudents: totalCount || 0,
        presentCount: presentCount || 0,
        leftCount: leftCount || 0,
        absentCount: absentCount || 0,
        lateCount: lateCount || 0
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setError('Failed to load dashboard data');
      // Set empty data on error
      setRecentActivity([]);
      setStats({
        totalStudents: 0,
        presentCount: 0,
        leftCount: 0,
        absentCount: 0,
        lateCount: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered students based on search and status filter
  const filteredStudents = useMemo(() => {
    return recentActivity.filter(student => {
      const matchesSearch = 
        (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (student.indexNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (student.student_email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [recentActivity, searchQuery, filterStatus]);

  // Icons for stats cards
  const statsIcons = {
    total: <Users className="h-6 w-6 text-white" />,
    present: <CheckCircle className="h-6 w-6 text-white" />,
    left: <ArrowRightCircle className="h-6 w-6 text-white" />,
    absent: <XCircle className="h-6 w-6 text-white" />
  };

  useEffect(() => {
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchRecentActivity]);

  const handleRefresh = () => {
    fetchRecentActivity();
    toast.info('Refreshing attendance data...');
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">Dashboard</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300 transform hover:scale-105"
          >
            <RefreshCw className="h-5 w-5 mr-2 animate-pulse" />
            Refresh Data
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatsCard
            title="Total Students"
            count={stats.totalStudents}
            color="blue"
            icon={statsIcons.total}
          />
          <StatsCard
            title="Present"
            count={stats.presentCount}
            total={stats.totalStudents}
            color="green"
            icon={statsIcons.present}
          />
          <StatsCard
            title="Left"
            count={stats.leftCount}
            total={stats.totalStudents}
            color="blue"
            icon={statsIcons.left}
          />
          <StatsCard
            title="Absent"
            count={stats.absentCount}
            total={stats.totalStudents}
            color="red"
            icon={statsIcons.absent}
          />
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">Today's Attendance</h2>
          
          <SearchFilter 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            filterStatus={filterStatus} 
            setFilterStatus={setFilterStatus} 
          />
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <StudentTable 
            students={filteredStudents} 
            loading={loading} 
            onShowQRCode={handleShowQRCode}
          />
        </div>
        
        {/* QR Code Modal */}
        <QRCodeModal 
          isOpen={qrModalOpen} 
          onClose={handleCloseQRModal} 
          student={selectedStudent}
        />
      </div>
    </div>
  );
};

export default DashboardPage;

// Add these to your global CSS file (or as a style tag)
`
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-scaleIn {
  animation: scaleIn 0.3s ease-out;
}
`