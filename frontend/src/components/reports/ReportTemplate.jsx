import React from 'react';
import { DateTime } from 'luxon';

// Helper to format dates in reports
const formatReportDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    if (date instanceof Date) {
      return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_FULL);
    }
    
    if (typeof date === 'string') {
      return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
    }
    
    // Last resort
    const fallbackDate = new Date(date);
    if (!isNaN(fallbackDate.getTime())) {
      return DateTime.fromJSDate(fallbackDate).toLocaleString(DateTime.DATE_FULL);
    }
    
    return 'N/A';
  } catch (e) {
    console.warn(`Error formatting date: ${date}`, e);
    return 'N/A';
  }
};

// ReportTemplate component for generating downloadable reports
const ReportTemplate = ({ 
  reportType, 
  reportData, 
  selectedDate,
  startDate,
  endDate,
  schoolInfo = {
    name: 'Attendance System',
    address: '123 School Street, Colombo',
    phone: '+94 11 123 4567',
    email: 'info@attendance.edu'
  } 
}) => {
  // Get report title based on type
  const getReportTitle = () => {
    switch (reportType) {
      case 'daily':
        return `Daily Attendance Report - ${formatReportDate(selectedDate)}`;
      case 'weekly':
        return `Weekly Attendance Report - ${formatReportDate(startDate)} to ${formatReportDate(endDate)}`;
      case 'monthly':
        return `Monthly Attendance Report - ${formatReportDate(startDate)} to ${formatReportDate(endDate)}`;
      case 'individual':
        const studentName = reportData?.student?.name || 'Student';
        return `Individual Attendance Report - ${studentName}`;
      default:
        return 'Attendance Report';
    }
  };

  // Different table layout based on report type
  const renderReportTable = () => {
    switch (reportType) {
      case 'daily':
        return renderDailyReportTable();
      case 'weekly':
        return renderWeeklyReportTable();
      case 'monthly':
        return renderMonthlyReportTable();
      case 'individual':
        return renderIndividualReportTable();
      default:
        return <p className="text-center text-gray-500">No report data available</p>;
    }
  };

  // Daily report table
  const renderDailyReportTable = () => {
    const students = reportData?.students || reportData?.data || [];
    
    if (!students || students.length === 0) {
      return <p className="text-center text-gray-500">No attendance data for this date</p>;
    }
    
    return (
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">No.</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Index Number</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Entry Time</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Leave Time</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
              <td className="border border-gray-300 px-4 py-2">{student.name || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{student.indexNumber || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{student.status || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">
                {student.entryTime ? new Date(student.entryTime).toLocaleTimeString() : 'N/A'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {student.leaveTime ? new Date(student.leaveTime).toLocaleTimeString() : 'N/A'}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {student.duration || (
                  student.entryTime && student.leaveTime ? 
                  calculateDuration(student.entryTime, student.leaveTime) : 
                  'N/A'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Weekly report table
  const renderWeeklyReportTable = () => {
    const students = reportData?.students || [];
    
    if (!students || students.length === 0) {
      return <p className="text-center text-gray-500">No attendance data for this week</p>;
    }
    
    return (
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">No.</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Index Number</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Days Present</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Days Absent</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Attendance Rate</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
              <td className="border border-gray-300 px-4 py-2">{student.name || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{student.indexNumber || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{student.daysPresent || 0}</td>
              <td className="border border-gray-300 px-4 py-2">{student.daysAbsent || 0}</td>
              <td className="border border-gray-300 px-4 py-2">
                {typeof student.attendanceRate === 'number' 
                  ? `${student.attendanceRate.toFixed(1)}%` 
                  : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Monthly report table
  const renderMonthlyReportTable = () => {
    const students = reportData?.students || [];
    
    if (!students || students.length === 0) {
      return <p className="text-center text-gray-500">No attendance data for this month</p>;
    }
    
    return (
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">No.</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Index Number</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Month</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Days Present</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Days Absent</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Attendance Rate</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
              <td className="border border-gray-300 px-4 py-2">{student.name || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{student.indexNumber || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{student.month || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{student.daysPresent || 0}</td>
              <td className="border border-gray-300 px-4 py-2">{student.daysAbsent || 0}</td>
              <td className="border border-gray-300 px-4 py-2">
                {typeof student.attendanceRate === 'number' 
                  ? `${student.attendanceRate.toFixed(1)}%` 
                  : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Individual student report table
  const renderIndividualReportTable = () => {
    const student = reportData?.student || {};
    const records = student.attendanceRecords || [];
    
    if (!records || records.length === 0) {
      return <p className="text-center text-gray-500">No attendance records for this student</p>;
    }
    
    return (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Student Information</h3>
          <table className="w-full border-collapse border border-gray-300 mb-6">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold">Name</td>
                <td className="border border-gray-300 px-4 py-2">{student.name || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold">Index Number</td>
                <td className="border border-gray-300 px-4 py-2">{student.indexNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold">Total Days Present</td>
                <td className="border border-gray-300 px-4 py-2">{student.daysPresent || 0}</td>
                <td className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold">Total Days Absent</td>
                <td className="border border-gray-300 px-4 py-2">{student.daysAbsent || 0}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold">Attendance Rate</td>
                <td className="border border-gray-300 px-4 py-2" colSpan="3">
                  {typeof student.attendanceRate === 'number' 
                    ? `${student.attendanceRate.toFixed(1)}%` 
                    : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Attendance Records</h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">No.</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Entry Time</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Leave Time</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {record.date ? formatReportDate(record.date) : 'N/A'}
                </td>
                <td className="border border-gray-300 px-4 py-2">{record.status || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {record.entryTime ? new Date(record.entryTime).toLocaleTimeString() : 'N/A'}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {record.leaveTime ? new Date(record.leaveTime).toLocaleTimeString() : 'N/A'}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {record.duration || (
                    record.entryTime && record.leaveTime ? 
                    calculateDuration(record.entryTime, record.leaveTime) : 
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  // Helper to calculate duration between two times
  const calculateDuration = (entryTime, leaveTime) => {
    if (!entryTime || !leaveTime) return 'N/A';
    
    try {
      const entry = new Date(entryTime);
      const leave = new Date(leaveTime);
      
      if (isNaN(entry.getTime()) || isNaN(leave.getTime())) {
        return 'N/A';
      }
      
      const diff = leave - entry;
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 60) {
        return `${minutes} min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'N/A';
    }
  };

  // Generate the report template
  return (
    <div id="report-template" className="bg-white p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">{schoolInfo.name}</h1>
        <p className="text-gray-600">{schoolInfo.address}</p>
        <p className="text-gray-600">{schoolInfo.phone} | {schoolInfo.email}</p>
      </div>
      
      {/* Report Title */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-2">{getReportTitle()}</h2>
      </div>
      
      {/* Report Date */}
      <div className="mb-6 text-right">
        <p className="text-sm text-gray-600">Report Generated: {formatReportDate(new Date())}</p>
      </div>
      
      {/* Report Table */}
      <div className="mb-6">
        {renderReportTable()}
      </div>
      
      {/* Summary */}
      {reportData && (
        <div className="mt-6 pt-4 border-t border-gray-300">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p>Total Students: {reportData.totalStudents || reportData.students?.length || 0}</p>
          {reportType !== 'individual' && (
            <>
              <p>Present: {reportData.totalPresent || 0}</p>
              <p>Absent: {reportData.totalAbsent || 0}</p>
              {reportData.averageAttendance && (
                <p>Average Attendance Rate: {reportData.averageAttendance.toFixed(1)}%</p>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-10 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
        <p>This is an official report generated by {schoolInfo.name} Attendance System.</p>
        <p>For any inquiries, please contact the administration office.</p>
      </div>
    </div>
  );
};

export default ReportTemplate; 