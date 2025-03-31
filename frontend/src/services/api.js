import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: true // Enable credentials for CORS
});

// Helper function to check server connectivity
const checkServerConnectivity = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, { 
      timeout: 5000,
      validateStatus: false // Don't throw on any status
    });
    return response.status === 200 && response.data?.status === 'ok';
  } catch {
    return false;
  }
};

// Add request interceptor to add auth token and handle requests
api.interceptors.request.use(
  async (config) => {
    // Check server connectivity before making any request
    const isServerUp = await checkServerConnectivity();
    if (!isServerUp) {
      throw new Error('Server is not responding. Please check if the server is running.');
    }

    // First look for token in localStorage (persistent login)
    let token = localStorage.getItem('token');
    
    // If not found in localStorage, check sessionStorage (temporary login)
    if (!token) {
      token = sessionStorage.getItem('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors and server connectivity issues
    if (!error.response || error.response.status === 0) {
      toast.error('Cannot connect to server. Please check your connection and try again.');
      return Promise.reject(new Error('Server connection failed'));
    }

    const { response: errorResponse } = error;

    // Handle unauthorized errors (401)
    if (errorResponse.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle forbidden errors (403)
    if (errorResponse.status === 403) {
      toast.error('You do not have permission to perform this action');
      return Promise.reject(error);
    }

    // Handle report generation errors (400)
    if (errorResponse.status === 400 && errorResponse.config.url.includes('/reports/')) {
      const message = errorResponse.data?.message || 'Invalid report parameters';
      
      // Check for specific report error messages
      if (errorResponse.data?.error === 'future_date') {
        toast.error('Reports cannot be generated for future dates');
      } else if (errorResponse.data?.error === 'date_range_invalid') {
        toast.error('Invalid date range. The start date must be before the end date.');
      } else if (errorResponse.data?.error === 'no_data') {
        toast.warning('No attendance data found for the selected period');
      } else {
        toast.error(message);
      }
      
      return Promise.reject(error);
    }

    // Handle validation errors (422)
    if (errorResponse.status === 422) {
      const message = errorResponse.data?.message || 'Validation failed';
      toast.error(message);
      return Promise.reject(error);
    }

    // Handle rate limit errors (429)
    if (errorResponse.status === 429) {
      const retryAfter = parseInt(errorResponse.headers['retry-after']) || 60;
      toast.warning(`Too many attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes.`);
      return Promise.reject(error);
    }

    // Handle server errors (500)
    if (errorResponse.status >= 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (credentials) => {
    try {
      console.log('Attempting login with:', { email: credentials.email, passwordProvided: !!credentials.password });
      const response = await api.post('/admin/login', credentials);

      // Log response structure for debugging
      console.log('Login response received:', {
        status: response.status,
        hasToken: !!response.data?.token || !!response.data?.accessToken,
        hasUser: !!response.data?.user || !!response.data?.admin,
        dataKeys: Object.keys(response.data || {})
      });

      // Check and store auth data when available
      if (response.data) {
        const token = response.data.token || response.data.accessToken;
        const userData = response.data.user || response.data.admin || response.data.userData;
        
        if (token) {
          localStorage.setItem('token', token);
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (!error.response) {
        toast.error('Cannot connect to server. Please check if the server is running.');
      }
      throw error;
    }
  },
  
  logout: async () => {
    try {
      // Make a request to the server to invalidate the token
      const response = await api.post('/admin/logout');
      
      // Clear local storage regardless of server response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      
      console.log('User logged out successfully');
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if the server request fails, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      
      if (!error.response) {
        toast.error('Cannot connect to server. Your session has been cleared locally.');
      }
      throw error;
    }
  },
  
  register: (userData) => api.post('/admin/register', userData),
  forgotPassword: async (email) => {
    try {
      console.log('Sending password reset request for email:', email);
      
      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }
      
      const response = await api.post('/admin/forgot-password', { email });
      
      console.log('Password reset request response:', {
        status: response.status,
        success: response.status === 200
      });
      
      return response;
    } catch (error) {
      console.error('Password reset request error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (!error.response) {
        toast.error('Cannot connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },
  resetPassword: async (token, password) => {
    try {
      console.log('Resetting password with token');
      
      if (!token) {
        throw new Error('Reset token is required');
      }
      
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      const response = await api.post(`/admin/reset-password/${token}`, { password });
      
      console.log('Password reset response:', {
        status: response.status,
        success: response.status === 200
      });
      
      return response;
    } catch (error) {
      console.error('Password reset error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (!error.response) {
        toast.error('Cannot connect to server. Please check your internet connection.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid or expired reset token');
      }
      throw error;
    }
  },
  getProfile: () => api.get('/admin/me'),
  updateProfile: async (data) => {
    try {
      console.log('Updating profile with data:', { ...data, passwordProvided: false });
      const response = await api.patch('/admin/profile', data);
      
      console.log('Profile update response:', {
        status: response.status,
        hasUpdatedUser: !!response.data?.admin || !!response.data?.user,
        dataKeys: Object.keys(response.data || {})
      });
      
      // Update user data in storage if update was successful
      if (response.data && (response.data.admin || response.data.user)) {
        const updatedUser = response.data.admin || response.data.user;
        
        // Update in the appropriate storage
        if (localStorage.getItem('token')) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else if (sessionStorage.getItem('token')) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      return response;
    } catch (error) {
      console.error('Profile update error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (!error.response) {
        toast.error('Cannot connect to server. Please check if the server is running.');
      }
      throw error;
    }
  },
  updatePassword: async (data) => {
    try {
      console.log('Updating password');
      
      if (!data.currentPassword || !data.newPassword) {
        throw new Error('Current password and new password are required');
      }
      
      if (data.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }
      
      const response = await api.post('/admin/update-password', data);
      
      console.log('Password update response:', {
        status: response.status,
        success: response.status === 200
      });
      
      return response;
    } catch (error) {
      console.error('Password update error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (!error.response) {
        toast.error('Cannot connect to server. Please check if the server is running.');
      } else if (error.response?.status === 401) {
        toast.error('Current password is incorrect');
      }
      throw error;
    }
  },
  
  // Add refresh token method
  refreshToken: () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // If there's no token to refresh, reject immediately
    if (!token) {
      return Promise.reject(new Error('No token available to refresh'));
    }
    
    // For now, this is a mock implementation that just returns the current token
    // In a real implementation, this would call the server to get a new token
    // based on a refresh token or other mechanism
    console.log('Token refresh requested - using current token as fallback');
    
    // Return the current token in the same format as the login response
    // This is a temporary solution until backend supports token refresh
    return Promise.resolve({
      data: {
        token: token
      }
    });
    
    // Uncomment this when backend supports token refresh
    // return api.post('/auth/refresh-token');
  },
};

// Student services with validation handling
export const studentService = {
  getAllStudents: async () => {
    try {
      const response = await api.get('/admin/students');
      return response;
    } catch (error) {
      if (!error.response) {
        toast.error('Network error. Please check your connection.');
      }
      throw error;
    }
  },
  registerStudent: async (data) => {
    // Convert index number to uppercase
    const formattedData = {
      ...data,
      indexNumber: data.indexNumber?.toUpperCase(),
      parent_telephone: data.parent_telephone?.trim() // Clean phone number
    };
    return api.post('/admin/students', formattedData);
  },
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  markAttendance: (data) => api.post('/admin/students/attendance', data),
  getScannedStudentsToday: () => api.get('/admin/students/scanned-today'),
  getAttendanceReport: (date) => api.get(`/admin/students/attendance-report?date=${date}`, {
    responseType: 'arraybuffer',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }),
  bulkImportStudents: (formData) => api.post('/admin/students/bulk-import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // New attendance history management methods
  getStudentAttendanceHistory: async (studentId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add optional query parameters if provided
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const queryString = queryParams.toString();
      const url = `/admin/students/${studentId}/attendance${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching student attendance history:', error);
      toast.error('Failed to fetch attendance history. Please try again.');
      throw error;
    }
  },
  
  clearAttendanceHistory: async (studentId) => {
    try {
      // Request confirmation from the user
      if (!window.confirm('Are you sure you want to clear all attendance history for this student? This action cannot be undone.')) {
        return { cancelled: true };
      }
      
      const response = await api.delete(`/admin/students/${studentId}/attendance/clear`);
      toast.success('Successfully cleared attendance history');
      return response.data;
    } catch (error) {
      console.error('Error clearing attendance history:', error);
      toast.error('Failed to clear attendance history. Please try again.');
      throw error;
    }
  },
  
  deleteAttendanceRecord: async (studentId, recordId) => {
    try {
      // Request confirmation from the user
      if (!window.confirm('Are you sure you want to delete this attendance record? This action cannot be undone.')) {
        return { cancelled: true };
      }
      
      const response = await api.delete(`/admin/students/${studentId}/attendance/${recordId}`);
      toast.success('Successfully deleted attendance record');
      return response.data;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      toast.error('Failed to delete attendance record. Please try again.');
      throw error;
    }
  }
};

// QR Code services
export const qrCodeService = {
  downloadStylishQRCode: async (studentId) => {
    try {
      const response = await api.get(`/admin/students/${studentId}/qr-code`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      if (!error.response) {
        toast.error('Network error. Please check your connection.');
      }
      throw error;
    }
  },
  
  markAttendance: async (qrData) => {
    try {
      // Make sure parent_telephone is present and properly formatted
      const sanitizedQrData = {
        ...qrData,
        parent_telephone: qrData.parent_telephone ? qrData.parent_telephone.replace(/\s+/g, '') : ''
      };
      
      // Add device info and location to the QR data
      const enrichedData = {
        qrCodeData: sanitizedQrData,
        deviceInfo: navigator.userAgent,
        scanLocation: 'QR Scanner App'
      };
      
      // Call the API to mark attendance
      const response = await api.post('/students/mark-attendance', enrichedData);
      
      // Log the complete response for debugging
      console.log('Full attendance API response:', JSON.stringify(response.data));
      
      return response;
    } catch (error) {
      console.error('Error marking attendance via QR code:', error);
      throw error;
    }
  },
  
  searchQRCode: async (searchParams) => {
    try {
      const response = await api.get('/students/search-qr', { params: searchParams });
      return response;
    } catch (error) {
      console.error('Error searching for QR code:', error);
      throw error;
    }
  },
  
  downloadQRCode: async (params) => {
    try {
      const response = await api.get('/students/download-qr-code', {
        params,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      throw error;
    }
  }
};

// Attendance service
export const attendanceService = {
  markAttendance: (data) => {
    // Add deviceInfo and scanLocation if not provided
    const attendanceData = {
      ...data,
      deviceInfo: data.deviceInfo || navigator.userAgent,
      scanLocation: data.scanLocation || 'Main Entrance'
    };
    return api.post('/admin/attendance', attendanceData);
  },
  
  // New method for manual attendance marking by admin
  markManualAttendance: async (studentId, status, options = {}) => {
    try {
      const attendanceData = {
        studentId,
        status,
        deviceInfo: navigator.userAgent,
        scanLocation: options.location || 'Manual Entry',
        adminNote: options.adminNote || 'Manually marked by admin',
        sendNotification: options.sendNotification !== false, // Default to true
        date: options.date || new Date().toISOString()
      };
      
      console.log('Marking manual attendance:', attendanceData);
      const response = await api.post('/admin/attendance', attendanceData);
      
      if (response.status === 200 || response.status === 201) {
        toast.success(`Student ${status === 'entered' ? 'checked in' : status === 'left' ? 'checked out' : 'marked as ' + status} successfully`);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error marking manual attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
      throw error;
    }
  },
  
  // Configure auto-checkout settings
  configureAutoCheckout: async (settings) => {
    try {
      const response = await api.post('/admin/attendance/auto-checkout/configure', settings);
      
      if (response.status === 200) {
        toast.success('Auto-checkout settings updated successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error configuring auto-checkout:', error);
      toast.error(error.response?.data?.message || 'Failed to update auto-checkout settings');
      throw error;
    }
  },
  
  // Get auto-checkout settings
  getAutoCheckoutSettings: async () => {
    try {
      const response = await api.get('/admin/attendance/auto-checkout/settings');
      return response.data;
    } catch (error) {
      console.error('Error getting auto-checkout settings:', error);
      return {
        enabled: false,
        time: '18:30',
        sendNotification: true
      };
    }
  },
  
  // Run auto-checkout manually (for testing or one-time execution)
  runAutoCheckout: async () => {
    try {
      const response = await api.post('/admin/attendance/auto-checkout/run');
      
      if (response.status === 200) {
        const { processed, failed } = response.data;
        toast.success(`Auto-checkout completed: ${processed} students processed, ${failed} failed`);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error running auto-checkout:', error);
      toast.error(error.response?.data?.message || 'Failed to run auto-checkout');
      throw error;
    }
  },
  
  markStudentAttendance: (data) => {
    // Ensure we pass deviceInfo and scanLocation if available
    const attendanceData = {
      ...data,
      deviceInfo: data.deviceInfo || navigator.userAgent,
      scanLocation: data.scanLocation || 'Main Entrance'
    };
    return api.post('/admin/attendance/student', attendanceData);
  },
  
  // QR code scan attendance marking
  markAttendanceByQR: (qrData) => {
    // Add device and location info to QR data
    const enrichedData = {
      qrCodeData: qrData,
      deviceInfo: navigator.userAgent,
      scanLocation: 'QR Scanner'
    };
    return api.post('/students/mark-attendance', enrichedData);
  },
  
  getTodayAttendance: () => api.get('/admin/attendance/today'),
  getRecentAttendance: () => api.get('/admin/attendance/recent'),
  getAttendanceByDate: (date) => {
    // Format date as YYYY-MM-DD
    const formattedDate = new Date(date).toISOString().split('T')[0];
    return api.get(`/admin/attendance/${formattedDate}`);
  },
  getAttendanceReport: (date) => {
    // Format date as YYYY-MM-DD
    const formattedDate = new Date(date).toISOString().split('T')[0];
    return api.get(`/admin/attendance/report?date=${formattedDate}`, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  },
  // Add the missing get method
  get: (url, config = {}) => api.get(url, config),
  // Add the missing getAllStudents method
  getAllStudents: () => api.get('/admin/students'),
  // New report generation functions with Excel support
  generateDailyReport: (params) => {
    // Deprecated - use reportService.generateReport instead
    console.warn('attendanceService.generateDailyReport is deprecated. Use reportService.generateReport("daily", params) instead');
    return reportService.generateReport('daily', params);
  },
  generateWeeklyReport: (params) => {
    // Deprecated - use reportService.generateReport instead
    console.warn('attendanceService.generateWeeklyReport is deprecated. Use reportService.generateReport("weekly", params) instead');
    return reportService.generateReport('weekly', params);
  },
  generateMonthlyReport: (params) => {
    // Deprecated - use reportService.generateReport instead
    console.warn('attendanceService.generateMonthlyReport is deprecated. Use reportService.generateReport("monthly", params) instead');
    return reportService.generateReport('monthly', params);
  },
  generateIndividualReport: (params) => {
    // Deprecated - use reportService.generateReport instead
    console.warn('attendanceService.generateIndividualReport is deprecated. Use reportService.generateReport("individual", params) instead');
    return reportService.generateReport('individual', params);
  },
  // Preview endpoints for report data - added better error handling and model version info
  getDailyReportPreview: (params) => {
    // Deprecated - use reportService.getDailyReportPreview instead
    console.warn('attendanceService.getDailyReportPreview is deprecated. Use reportService.getDailyReportPreview instead');
    return reportService.getDailyReportPreview(params);
  },
  getWeeklyReportPreview: (params) => {
    // Deprecated - use reportService.getWeeklyReportPreview instead
    console.warn('attendanceService.getWeeklyReportPreview is deprecated. Use reportService.getWeeklyReportPreview instead');
    return reportService.getWeeklyReportPreview(params);
  },
  getMonthlyReportPreview: (params) => {
    // Deprecated - use reportService.getMonthlyReportPreview instead
    console.warn('attendanceService.getMonthlyReportPreview is deprecated. Use reportService.getMonthlyReportPreview instead');
    return reportService.getMonthlyReportPreview(params);
  },
  getIndividualReportPreview: (params) => {
    // Deprecated - use reportService.getIndividualReportPreview instead
    console.warn('attendanceService.getIndividualReportPreview is deprecated. Use reportService.getIndividualReportPreview instead');
    return reportService.getIndividualReportPreview(params);
  },
  
  // Helper methods for formatting Excel reports
  getFormattedDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  },
  
  getDateRange: (startDate, endDate) => {
    return {
      startDate: attendanceService.getFormattedDate(startDate),
      endDate: attendanceService.getFormattedDate(endDate)
    };
  },
  
  // Helper function to format parameters for reports
  formatReportParams: (reportType, params) => {
    const formattedParams = { ...params };
    
    // Format date parameters consistently
    if (formattedParams.date) {
      formattedParams.date = attendanceService.getFormattedDate(formattedParams.date);
    }
    
    if (formattedParams.startDate) {
      formattedParams.startDate = attendanceService.getFormattedDate(formattedParams.startDate);
    }
    
    if (formattedParams.endDate) {
      formattedParams.endDate = attendanceService.getFormattedDate(formattedParams.endDate);
    }
    
    // Add report specific formatting parameters
    formattedParams.includeEntryTime = true;
    formattedParams.includeLeaveTime = true;
    formattedParams.includeDuration = true;
    formattedParams.includeLocation = true;
    
    return formattedParams;
  },
  
  // Generic report generation function that routes to the specific report type
  generateReport: (reportType, params, headers = {}) => {
    console.log(`Generating ${reportType} with params:`, params);
    
    // This method is deprecated - use reportService.generateReport instead
    console.warn('attendanceService.generateReport is deprecated. Please use reportService.generateReport instead.');
    
    // Route to the appropriate reportService method
    return reportService.generateReport(reportType.replace('AttendanceReport', ''), params, headers);
  },
  
  // Enhanced utility to check if a student can be checked out
  canCheckOut: (student) => {
    if (!student) return false;
    
    // Get today's attendance record if it exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecord = student.attendanceHistory?.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    // Can check out if student is entered but not yet left
    return todayRecord && 
           (todayRecord.status === 'entered' || todayRecord.status === 'present') && 
           !todayRecord.leaveTime;
  }
};

// Messaging service
export const messagingService = {
  // Message type constants - Updated to match backend schema
  MESSAGE_TYPES: {
    TEXT: 'manual',
    ATTENDANCE: 'attendance',
    NOTIFICATION: 'notification', 
    SYSTEM: 'system',
    TEMPLATE: 'template',
    TEST: 'test',
    AUTOMATED: 'automated'
  },

  formatAttendanceMessage: (studentData) => {
    const status = studentData.status === 'entered' ? 'Entered School' :
                  studentData.status === 'left' ? 'Left School' :
                  studentData.status === 'late' ? 'Arrived Late' : 'Marked Present';
    
    const timestamp = new Date(studentData.timestamp || studentData.entryTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Colombo'
    });

    return `🏫 Attendance Update

Student: ${studentData.name}
Index Number: ${studentData.indexNumber}
Status: ${status}
Time: ${timestamp}

Additional Details:
Email: ${studentData.student_email || studentData.email}
Parent Phone: ${studentData.parent_telephone}
Address: ${studentData.address}`;
  },

  sendMessage: async (data) => {
    try {
      const toastId = toast.loading('Sending message...');
      
      // Validate required fields before sending
      if (!data.phoneNumber) {
        toast.update(toastId, {
          render: 'Phone number is required',
          type: 'error',
          isLoading: false,
          autoClose: 3000
        });
        throw new Error('Phone number is required');
      }
      if (!data.message) {
        toast.update(toastId, {
          render: 'Message content is required',
          type: 'error',
          isLoading: false,
          autoClose: 3000
        });
        throw new Error('Message content is required');
      }

      // Format phone number
      const formattedPhone = data.phoneNumber.replace(/\s+/g, '');
      if (!formattedPhone.startsWith('+')) {
        data.phoneNumber = '+' + formattedPhone;
      }

      const response = await api.post('/whatsapp/send', {
        phoneNumber: data.phoneNumber,
        message: data.message,
        type: data.type || 'test'
      });

      toast.update(toastId, {
        render: `Message sent successfully to ${data.phoneNumber}`,
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.update(toastId, {
        render: error.response?.data?.message || 'Failed to send message',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
      throw error;
    }
  },

  sendBulkMessages: async (data) => {
    try {
      const toastId = toast.loading('Sending bulk messages...');
      
      const response = await api.post('/whatsapp/bulk', {
        studentIds: data.studentIds,
        message: data.message,
        type: 'notification'
      });

      const { summary } = response.data;
      toast.update(toastId, {
        render: `Messages sent: ${summary.successful} successful, ${summary.failed} failed`,
        type: summary.failed === 0 ? 'success' : 'warning',
        isLoading: false,
        autoClose: 5000
      });

      return response.data;
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      toast.error('Failed to send bulk messages');
      throw error;
    }
  },

  getWhatsAppStatus: async () => {
    try {
      const response = await api.get('/whatsapp/status');
      if (response.data?.status) {
        return {
          isReady: response.data.status.isReady,
          error: response.data.status.error,
          qrCode: response.data.status.qrCode
        };
      }
      return { isReady: false, error: null };
    } catch (error) {
      console.error('Error getting WhatsApp status:', error);
      throw error;
    }
  },

  getQRCode: async () => {
    try {
      const response = await api.get('/whatsapp/qr');
      return response.data;
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  },

  refreshQRCode: async () => {
    try {
      // First try to get the status to check current state
      await api.get('/whatsapp/status');
      
      // Then request refresh
      const response = await api.post('/whatsapp/qr/refresh');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to refresh QR code');
      }

      // Get new QR code
      const qrResponse = await api.get('/whatsapp/qr');
      return {
        qrCode: qrResponse.data.qrCode,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      throw error;
    }
  },

  sendQrCodeScanMessage: async (data) => {
    try {
      // Format the attendance message
      const message = messagingService.formatAttendanceMessage(data);
      
      // Format phone number
      const phoneNumber = data.parent_telephone?.replace(/\s+/g, '');
      
      if (!phoneNumber) {
        throw new Error('Parent phone number is required for sending attendance notification');
      }

      const response = await api.post('/admin/messaging/attendance', {
        studentId: data.id || data._id,
        message: message,
        phoneNumber: phoneNumber,
        type: 'attendance', // Keep using 'attendance'
        status: data.status,
        timestamp: data.timestamp || data.entryTime || new Date().toISOString()
      });

      console.log('Attendance message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  },

  logoutWhatsApp: async () => {
    try {
      const response = await api.post('/whatsapp/logout');
      if (response.status === 200) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to logout from WhatsApp');
    } catch (error) {
      console.error('Error logging out WhatsApp:', error);
      throw error;
    }
  }
};

// Report Services
const reportService = {
  getDailyReportPreview: async (params, headers = {}) => {
    return await api.get('/reports/daily/preview', { 
      params,
      headers: {
        ...headers,
        'preserve-mongodb-format': 'true',
        'time-format': 'preserve-null',
        'mongodb-date-format': 'true',
        'Content-Type': 'application/json'
      }
    });
  },
  
  getWeeklyReportPreview: async (params, headers = {}) => {
    return await api.get('/reports/weekly/preview', { 
      params, 
      headers: {
        ...headers,
        'preserve-mongodb-format': 'true',
        'time-format': 'preserve-null',
        'mongodb-date-format': 'true',
        'Content-Type': 'application/json'
      }
    });
  },
  
  getMonthlyReportPreview: async (params, headers = {}) => {
    return await api.get('/reports/monthly/preview', { 
      params,
      headers: {
        ...headers,
        'preserve-mongodb-format': 'true',
        'time-format': 'preserve-null',
        'mongodb-date-format': 'true',
        'Content-Type': 'application/json'
      }
    });
  },
  
  getIndividualReportPreview: async (params, headers = {}) => {
    return await api.get('/reports/individual/preview', { 
      params,
      headers: {
        ...headers,
        'preserve-mongodb-format': 'true',
        'time-format': 'preserve-null',
        'mongodb-date-format': 'true',
        'Content-Type': 'application/json'
      }
    });
  },
  
  generateReport: async (reportType, params, headers = {}) => {
    const reportEndpoints = {
      'daily': '/reports/dailyAttendanceReport',
      'weekly': '/reports/weeklyAttendanceReport',
      'monthly': '/reports/monthlyAttendanceReport',
      'individual': '/reports/individualStudentReport'
    };
    
    if (!reportEndpoints[reportType]) {
      throw new Error(`Unknown report type: ${reportType}`);
    }
    
    return await api.get(reportEndpoints[reportType], {
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Type': 'application/json',
        'preserve-mongodb-format': 'true',
        'time-format': 'preserve-null',
        'mongodb-date-format': 'true',
        ...headers
      }
    });
  }
};

// Export all services
export default {
  ...api,
  authService,
  attendanceService,
  studentService,
  messagingService,
  reportService
};

// Add named export for reportService
export { reportService };