import { useState, useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

const useQRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // Start the scanner
  const startScanner = useCallback(async () => {
    setError(null);
    setScannedData(null);
    setScanning(true);

    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Use the back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start processing frames once video is playing
        videoRef.current.onloadedmetadata = () => {
          animationRef.current = requestAnimationFrame(processFrame);
        };
      }
    } catch (err) {
      setError('Failed to access camera: ' + err.message);
      setScanning(false);
    }
  }, []);

  // Stop the scanner
  const stopScanner = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, []);

  // Process a frame to detect QR codes
  const processFrame = useCallback(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    // Make sure video is playing
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data for processing
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR to detect QR codes
      const code = jsQR(
        imageData.data,
        imageData.width,
        imageData.height,
        {
          inversionAttempts: "dontInvert",
        }
      );
      
      if (code) {
        console.log("QR Code detected:", code.data);
        
        try {
          // Try to parse as JSON
          const qrData = JSON.parse(code.data);
          setScannedData(qrData);
          stopScanner();
          return;
        } catch (e) {
          // If not valid JSON, use raw data
          setScannedData({ rawData: code.data });
          stopScanner();
          return;
        }
      }
    } catch (err) {
      console.error('Error processing frame:', err);
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(processFrame);
  }, [scanning, stopScanner]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return {
    videoRef,
    canvasRef,
    scanning,
    scannedData,
    error,
    startScanner,
    stopScanner
  };
};

export default useQRScanner; 