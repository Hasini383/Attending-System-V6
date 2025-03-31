import api from './api';

// Manual attendance marking
export const markAttendance = async (studentId, status, note = '', sendNotification = true) => {
  try {
    const response = await api.post('/admin/attendance/mark', {
      studentId,
      status,
      adminNote: note,
      sendNotification
    });
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

// Configure auto-checkout settings
export const configureAutoCheckout = async (settings) => {
  try {
    const response = await api.post('/admin/attendance/auto-checkout/configure', settings);
    return response.data;
  } catch (error) {
    console.error('Error configuring auto-checkout:', error);
    throw error;
  }
};

// Get auto-checkout settings
export const getAutoCheckoutSettings = async () => {
  try {
    const response = await api.get('/admin/attendance/auto-checkout/settings');
    return response.data;
  } catch (error) {
    console.error('Error getting auto-checkout settings:', error);
    throw error;
  }
};

// Run auto-checkout manually
export const runAutoCheckout = async () => {
  try {
    const response = await api.post('/admin/attendance/auto-checkout/run');
    return response.data;
  } catch (error) {
    console.error('Error running auto-checkout:', error);
    throw error;
  }
}; 