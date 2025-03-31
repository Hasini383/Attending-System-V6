import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { messagingService } from '../services/api';
import QRCode from 'qrcode.react';
import { Phone, LogOut, SendHorizontal, RefreshCcw, Shield, Clock, Settings, Users, AlertCircle } from 'lucide-react';

const WhatsAppManagementPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [whatsappStatus, setWhatsappStatus] = useState({ isReady: false, error: null });
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [messageStats, setMessageStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoReconnect: true,
    notifyOnDisconnect: true,
    reconnectAttempts: 3,
    sessionTimeout: 24
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/whatsapp' } });
      return;
    }

    if (!isAdmin) {
      navigate('/');
      return;
    }

    const checkStatus = async () => {
      try {
        const status = await messagingService.getWhatsAppStatus();
        setWhatsappStatus(status);
        if (!status.isReady && status.qrCode) {
          setQrCode(status.qrCode);
        }
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        toast.error('Failed to check WhatsApp status. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (whatsappStatus.isReady) {
      setConnectionHistory(prev => [
        {
          timestamp: new Date(),
          event: 'Connected',
          status: 'success'
        },
        ...prev
      ]);
    }
  }, [whatsappStatus.isReady]);

  const handleLogout = async () => {
    try {
      await messagingService.logoutWhatsApp();
      toast.success('WhatsApp logged out successfully');
      setWhatsappStatus({ isReady: false, error: null });
      setQrCode(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to logout from WhatsApp');
    }
  };

  const handleSendTestMessage = async () => {
    if (!testNumber || !testMessage) {
      toast.error('Please enter both number and message');
      return;
    }

    try {
      const result = await messagingService.sendMessage({
        phoneNumber: testNumber,
        message: testMessage,
        type: 'test'
      });
      
      // Clear message input on success
      if (result.success) {
        setTestMessage('');
        // Update message stats
        setMessageStats(prev => ({
          ...prev,
          total: prev.total + 1,
          successful: prev.successful + 1
        }));
      }
    } catch (error) {
      // Update message stats on failure
      setMessageStats(prev => ({
        ...prev,
        total: prev.total + 1,
        failed: prev.failed + 1
      }));
    }
  };

  const handleRefreshQR = async () => {
    try {
      setLoading(true);
      const result = await messagingService.refreshQRCode();
      if (result.qrCode) {
        setQrCode(result.qrCode);
        toast.success('QR code refreshed');
      }
    } catch (error) {
      toast.error('Failed to refresh QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (newSettings) => {
    try {
      setSettings(newSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleEmergencyLogout = async () => {
    if (window.confirm('Are you sure you want to force logout? This will clear all WhatsApp sessions.')) {
      try {
        await messagingService.logoutWhatsApp();
        toast.success('Emergency logout successful');
        setWhatsappStatus({ isReady: false, error: null });
        setQrCode(null);
        setConnectionHistory(prev => [
          {
            timestamp: new Date(),
            event: 'Emergency Logout',
            status: 'warning'
          },
          ...prev
        ]);
      } catch (error) {
        toast.error('Emergency logout failed');
      }
    }
  };

  useEffect(() => {
    let timer;
    if (qrCode) {
      timer = setTimeout(() => {
        setQrCode(null);
        toast.info('QR code expired. Please refresh to get a new one.');
      }, 60000);
    }
    return () => clearTimeout(timer);
  }, [qrCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">WhatsApp Integration</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage your WhatsApp connection and messaging settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
          {whatsappStatus.isReady && (
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Connection Status</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${whatsappStatus.isReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="dark:text-gray-200">
                  {whatsappStatus.isReady ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {!whatsappStatus.isReady && (
                <button
                  onClick={handleRefreshQR}
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4 mr-1" />
                  Refresh QR
                </button>
              )}
            </div>
            {whatsappStatus.error && (
              <p className="mt-2 text-red-500">{whatsappStatus.error}</p>
            )}
          </div>

          {/* QR Code Section */}
          {!whatsappStatus.isReady && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Scan QR Code</h2>
              <div className="flex flex-col items-center">
                {qrCode ? (
                  <div className="p-4 bg-white rounded-lg">
                    <QRCode 
                      value={qrCode} 
                      size={256} 
                      level="H" 
                      includeMargin={true}
                      key={refreshKey}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-64 h-64 bg-gray-100 dark:bg-slate-700 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Open WhatsApp on your phone and scan this QR code to connect
                </p>
              </div>
            </div>
          )}

          {/* Connection History */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Connection History</h2>
            <div className="max-h-60 overflow-y-auto">
              {connectionHistory.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 ${
                    index !== connectionHistory.length - 1 ? 'border-b dark:border-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-3 ${
                      entry.status === 'success' ? 'bg-green-500' :
                      entry.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="dark:text-gray-300">{entry.event}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Test Message Section */}
          {whatsappStatus.isReady && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Send Test Message</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
                      <Phone className="h-5 w-5" />
                    </span>
                    <input
                      type="text"
                      value={testNumber}
                      onChange={(e) => setTestNumber(e.target.value)}
                      placeholder="Enter phone number with country code"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border dark:bg-slate-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your test message"
                  />
                </div>
                <button
                  onClick={handleSendTestMessage}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <SendHorizontal className="w-5 h-5 mr-2" />
                  Send Test Message
                </button>
              </div>
            </div>
          )}

          {/* Message Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Message Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Messages', value: messageStats.total, icon: Users },
                { label: 'Successful', value: messageStats.successful, icon: Shield },
                { label: 'Failed', value: messageStats.failed, icon: AlertCircle },
                { label: 'Pending', value: messageStats.pending, icon: Clock }
              ].map((stat, index) => (
                <div key={index} className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <stat.icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          {showSettings && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Settings</h2>
              <div className="space-y-4">
                <button
                  onClick={handleEmergencyLogout}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Emergency Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppManagementPage;
