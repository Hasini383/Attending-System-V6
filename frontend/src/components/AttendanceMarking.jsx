import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/api';

const AttendanceMarking = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [status, setStatus] = useState('present');
  const [remarks, setRemarks] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await attendanceService.getTodayAttendance();
        setStudents(response.data.students || []);
      } catch (err) {
        setError('Failed to fetch students: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Handle QR code scanning
  const handleQRCodeScan = async (data) => {
    try {
      // In a real app, this would come from a QR code scanner
      // For demo purposes, we're using a mock QR code data
      const mockQRCodeData = {
        id: "60d21b4667d0d8992e610c85",
        name: "John Doe",
        indexNumber: "STU12345",
        student_email: "john@example.com",
        address: "123 Main St"
      };
      
      setQrCodeData(mockQRCodeData);
      setLoading(true);
      
      const response = await attendanceService.markAttendanceByQR(mockQRCodeData);
      
      setMessage(response.data.message);
      
      // Refresh the student list
      const updatedStudents = await attendanceService.getTodayAttendance();
      setStudents(updatedStudents.data.students || []);
    } catch (err) {
      setError('Failed to mark attendance: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle manual attendance marking by admin
  const handleManualAttendance = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await attendanceService.markAttendanceByAdmin({
        studentId: selectedStudent,
        status,
        remarks
      });
      
      setMessage(response.data.message);
      
      // Reset form
      setSelectedStudent('');
      setStatus('present');
      setRemarks('');
      
      // Refresh the student list
      const updatedStudents = await attendanceService.getTodayAttendance();
      setStudents(updatedStudents.data.students || []);
    } catch (err) {
      setError('Failed to mark attendance: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Attendance Marking</h2>
      
      {/* Error and success messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-8 mb-12">
        {/* QR Code Scanning Section */}
        <div className="flex-1 min-w-[300px] bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 pb-3 mb-4 border-b border-gray-200">
            Mark Attendance via QR Code
          </h3>
          <button 
            onClick={handleQRCodeScan} 
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Processing...' : 'Simulate QR Code Scan'}
          </button>
          
          {qrCodeData && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Scanned Data:</h4>
              <p className="text-gray-600">Name: {qrCodeData.name}</p>
              <p className="text-gray-600">Index Number: {qrCodeData.indexNumber}</p>
            </div>
          )}
        </div>
        
        {/* Manual Attendance Section */}
        <div className="flex-1 min-w-[300px] bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 pb-3 mb-4 border-b border-gray-200">
            Mark Attendance Manually (Admin)
          </h3>
          <form onSubmit={handleManualAttendance}>
            <div className="mb-4">
              <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
                Select Student:
              </label>
              <select 
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select Student --</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.indexNumber})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status:
              </label>
              <select 
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="entered">Entered</option>
                <option value="left">Left</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                Remarks:
              </label>
              <textarea 
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                loading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {loading ? 'Processing...' : 'Mark Attendance'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Today's Attendance List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Today's Attendance</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-2"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  // Get the latest attendance record
                  const latestAttendance = student.attendanceHistory && 
                    student.attendanceHistory.length > 0 ? 
                    student.attendanceHistory[student.attendanceHistory.length - 1] : null;
                  
                  return (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.indexNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          latestAttendance?.status === 'present' || latestAttendance?.status === 'entered' 
                            ? 'bg-green-100 text-green-800' 
                            : latestAttendance?.status === 'absent' 
                              ? 'bg-red-100 text-red-800'
                              : latestAttendance?.status === 'late'
                                ? 'bg-yellow-100 text-yellow-800'
                                : latestAttendance?.status === 'left'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}>
                          {latestAttendance?.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {latestAttendance?.entryTime ? 
                          new Date(latestAttendance.entryTime).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {latestAttendance?.leaveTime ? 
                          new Date(latestAttendance.leaveTime).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {latestAttendance?.remarks || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No attendance records for today.
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceMarking; 