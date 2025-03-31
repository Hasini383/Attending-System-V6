import React, { useState, useRef, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { toast } from 'react-toastify';
import { qrCodeService, messagingService } from '../services/api';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [scanning, setScanning] = useState(true);
  
  // Request camera permission on component mount
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasPermission(false);
        setError('Camera access denied. Please enable camera permissions in your browser settings.');
      }
    };
    
    requestCameraPermission();
    
    // Cleanup function
    return () => {
      // Stop scanning if component unmounts
      setScanning(false);
    };
  }, []);
  
  // Function to handle QR code scan
  const handleScan = async (data) => {
    if (data && !loading) {
      try {
        setLoading(true);
        console.log('QR code scanned:', data);
        
        // Attempt to parse QR data
        let qrData;
        try {
          qrData = JSON.parse(data.text);
        } catch (e) {
          // If not valid JSON, use as is
          qrData = { rawData: data.text };
          throw new Error('Invalid QR code format. Please scan a valid student QR code.');
        }
        
        // Check for required fields
        if (!qrData.indexNumber || !qrData.name) {
          throw new Error('Invalid QR code. Missing required student information.');
        }
        
        // Add empty parent_telephone if not present in QR data
        if (!qrData.parent_telephone) {
          qrData.parent_telephone = '';
        }

        // Mark attendance using the QR code service - use the same endpoint as DigitalQRScanner
        const response = await qrCodeService.markAttendance(qrData);
        console.log('API response:', response);
      
        if (!response.data) {
          throw new Error('Invalid response from server');
        }
        
        // Process the response data - same way as DigitalQRScanner
        const processedData = {
          id: response.data.studentInfo?.id,
          indexNumber: response.data.studentInfo?.indexNumber || qrData.indexNumber,
          name: response.data.studentInfo?.name || qrData.name,
          status: response.data.attendanceStatus || 'entered',
          timestamp: new Date().toISOString(),
          messageStatus: response.data.studentInfo?.messageStatus || response.data.messageStatus || 'pending',
          parent_telephone: response.data.studentInfo?.parent_telephone || qrData.parent_telephone,
          student_email: response.data.studentInfo?.student_email || response.data.student?.student_email || '',
          address: response.data.studentInfo?.address || response.data.student?.address || ''
        };
        
        // Store the scanned data
        setScannedData(processedData);
        
        // Show success toast with student name and status
        toast.success(`${processedData.name}'s attendance ${processedData.status === 'left' ? 'exit' : 'entry'} recorded!`);
        
        // Call the success callback if provided
        if (onScanSuccess) {
          onScanSuccess(processedData);
        }
        
        // Stop scanning after successful scan
        setScanning(false);
      } catch (error) {
        console.error('Error processing QR code:', error);
        // Set error message
        setError(error.message || 'Failed to process QR code');
        // Show error toast
        toast.error(error.message || 'Failed to process QR code');
        // Call error callback if provided
        if (onScanError) {
          onScanError(error);
        }
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleError = (err) => {
    console.error('QR Scanner error:', err);
    setError('Error accessing camera: ' + err.message);
    if (onScanError) {
      onScanError(err);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg shadow">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Processing...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <svg className="w-10 h-10 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-red-600 mb-2 text-center">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setScanning(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Render camera permission denied state
  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <svg className="w-10 h-10 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-red-600 mb-2 text-center">Camera access denied. Please enable camera permissions in your browser settings.</p>
      </div>
    );
  }
  
  // Render success state
  if (scannedData) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
        <svg className="w-10 h-10 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <h3 className="text-lg font-medium text-green-800">Attendance Recorded</h3>
        <p className="text-green-600 mb-2 text-center">{scannedData.name} - {scannedData.indexNumber}</p>
        <button 
          onClick={() => {
            setScannedData(null);
            setScanning(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Scan Another
        </button>
      </div>
    );
  }
  
  // Render QR scanner with increased width and height
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg shadow-lg border-2 border-blue-300">
        {scanning && (
          <QrReader
            constraints={{ 
              facingMode: 'environment',
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              aspectRatio: 1.33333
            }}
            onResult={handleScan}
            onError={handleError}
            className="w-full h-full"
            scanDelay={500}
            videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div className="absolute inset-0 border-4 border-dashed border-blue-500 pointer-events-none z-10"></div>
      </div>
      <p className="mt-4 text-gray-600 text-center">Position the QR code within the frame to scan</p>
    </div>
  );
};

export default QRScanner; 