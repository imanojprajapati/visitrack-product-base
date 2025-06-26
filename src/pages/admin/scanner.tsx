import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  QrCode,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MapPin,
  Building,
  Phone,
  Mail,
  Clock,
  Scan,
  RotateCcw,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface ScannedVisitor {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  company?: string;
  eventName: string;
  eventLocation: string;
  status: string;
  entryType: string;
  scannedAt: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  visitor?: ScannedVisitor;
  error?: string;
}

const QuickScanner = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentScan, setCurrentScan] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setCameraError('');
      console.log('Starting camera...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      // Try different camera constraints
      const constraints = [
        {
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        {
          video: true
        }
      ];

      let stream: MediaStream | null = null;
      
      for (const constraint of constraints) {
        try {
          console.log('Trying constraint:', constraint);
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('Camera stream obtained:', stream);
          break;
        } catch (constraintError) {
          console.log('Constraint failed:', constraintError);
          continue;
        }
      }

      if (!stream) {
        throw new Error('Unable to access camera with any constraints');
      }

      if (videoRef.current) {
        const video = videoRef.current;
        
        console.log('Setting video source...');
        video.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        const handleCanPlay = async () => {
          try {
            console.log('Video can play, attempting to start...');
            await video.play();
            console.log('Video started playing successfully');
            startScanLoop();
          } catch (playError) {
            console.error('Video play error:', playError);
            setCameraError('Unable to start video playback. Please try again.');
          }
        };

        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            handleCanPlay();
          }
        };

        const handleError = (error: any) => {
          console.error('Video error:', error);
          setCameraError('Video playback error occurred.');
        };

        // Add event listeners
        video.onloadedmetadata = handleLoadedMetadata;
        video.oncanplay = handleCanPlay;
        video.onerror = handleError;
        
        // Force load
        video.load();
        
        // Fallback attempts
        setTimeout(() => {
          if (video.readyState >= 2) {
            console.log('Fallback: Video ready, attempting play...');
            handleCanPlay();
          }
        }, 500);
        
        setTimeout(() => {
          if (video.readyState >= 1 && video.videoWidth > 0) {
            console.log('Second fallback: Video has metadata, attempting play...');
            handleCanPlay();
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      setCameraError(`Unable to access camera: ${error.message}`);
      toast({
        title: "Camera Error",
        description: `Unable to access camera: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const stopScanning = () => {
    console.log('Stopping scanner...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.oncanplay = null;
    }
    
    setIsScanning(false);
    setCameraError('');
  };

  const startScanLoop = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && isScanning && !processing) {
        scanQRCode();
      }
    }, 500); // Scan every 500ms
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    try {
      // Use jsQR library to decode QR code
      const { default: jsQR } = await import('jsqr');
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code && code.data && code.data !== currentScan) {
        setCurrentScan(code.data);
        await processQRCode(code.data);
      }
    } catch (error) {
      console.error('QR scanning error:', error);
    }
  };

  const processQRCode = async (qrData: string) => {
    if (processing) return;
    
    setProcessing(true);
    
    try {
      // Extract visitor ID from QR code data
      // Assuming QR code contains visitor ID or a URL with visitor ID
      let visitorId = qrData;
      
      // If QR code contains a URL, extract visitor ID
      if (qrData.includes('visitor=') || qrData.includes('visitorId=')) {
        const urlParams = new URLSearchParams(qrData.split('?')[1] || '');
        visitorId = urlParams.get('visitor') || urlParams.get('visitorId') || qrData;
      }
      
      // If it's a full URL, try to extract ID from path
      if (qrData.startsWith('http')) {
        const url = new URL(qrData);
        const pathParts = url.pathname.split('/');
        visitorId = pathParts[pathParts.length - 1] || qrData;
      }

      console.log('Processing QR code:', { original: qrData, extracted: visitorId });

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/scanner/qr-entry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorId: visitorId.trim(),
          qrData: qrData
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const scanResult: ScanResult = {
          success: true,
          message: result.message,
          visitor: {
            _id: result.visitorId,
            fullName: result.visitorName,
            email: result.visitorEmail || '',
            phoneNumber: result.visitorPhone || '',
            company: result.visitorCompany || '',
            eventName: result.eventName || '',
            eventLocation: result.eventLocation || '',
            status: result.newStatus,
            entryType: result.newEntryType,
            scannedAt: new Date().toLocaleString()
          }
        };

        setScanResults(prev => [scanResult, ...prev]);
        setScanCount(prev => prev + 1);

        toast({
          title: "✅ Scan Successful",
          description: `${result.visitorName} checked in via QR code`,
        });

        // Visual feedback
        setCurrentScan('');
        
      } else {
        const scanResult: ScanResult = {
          success: false,
          message: result.message || 'Scan failed',
          error: result.message
        };

        setScanResults(prev => [scanResult, ...prev]);

        toast({
          title: "❌ Scan Failed",
          description: result.message || 'Unable to process QR code',
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('QR processing error:', error);
      
      const scanResult: ScanResult = {
        success: false,
        message: 'Processing error',
        error: error.message
      };

      setScanResults(prev => [scanResult, ...prev]);

      toast({
        title: "❌ Processing Error",
        description: error.message || 'Unable to process QR code',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const clearResults = () => {
    setScanResults([]);
    setScanCount(0);
  };

  const testCamera = async () => {
    try {
      console.log('Testing camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Camera test successful:', stream);
      
      toast({
        title: "Camera Test Successful",
        description: "Camera is accessible and working",
      });
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      console.error('Camera test failed:', error);
      toast({
        title: "Camera Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              Quick Scanner
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Scan QR codes to check in visitors instantly
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Scanned: {scanCount}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Camera View */}
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  {isScanning ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                        controls={false}
                        style={{ objectFit: 'cover' }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                      {/* Scanning Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-green-400 rounded-lg w-48 h-48 relative">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                          {processing && (
                            <div className="absolute inset-0 bg-green-400 bg-opacity-20 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Status Indicator */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-500 text-white flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Scanning...
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <CameraOff className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Camera Off</p>
                        <p className="text-sm">Click "Start Scanning" to begin</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Error */}
                {cameraError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{cameraError}</AlertDescription>
                  </Alert>
                )}

                {/* Controls */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {!isScanning ? (
                      <Button
                        onClick={startScanning}
                        className="flex-1 flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Start Scanning
                      </Button>
                    ) : (
                      <Button
                        onClick={stopScanning}
                        variant="destructive"
                        className="flex-1 flex items-center gap-2"
                      >
                        <CameraOff className="w-4 h-4" />
                        Stop Scanning
                      </Button>
                    )}
                    
                    {scanResults.length > 0 && (
                      <Button
                        onClick={clearResults}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  {!isScanning && (
                    <Button
                      onClick={testCamera}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-3 h-3" />
                      Test Camera Access
                    </Button>
                  )}
                </div>

                {/* Debug Info */}
                {isScanning && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <div>Scanner Status: {isScanning ? 'Active' : 'Inactive'}</div>
                    <div>Video Ready State: {videoRef.current?.readyState || 'N/A'}</div>
                    <div>Video Dimensions: {videoRef.current?.videoWidth || 0} x {videoRef.current?.videoHeight || 0}</div>
                    <div>Stream Active: {streamRef.current?.active ? 'Yes' : 'No'}</div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Scan className="w-4 h-4" />
                    How to use:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Click "Start Scanning" to activate camera</li>
                    <li>• Point camera at QR code</li>
                    <li>• Scanner will automatically detect and process codes</li>
                    <li>• Scanner stays active for continuous scanning</li>
                    <li>• Results appear in real-time on the right</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Scan Results ({scanResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No scans yet</p>
                  <p className="text-sm">Start scanning to see results here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {scanResults.map((result, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        result.success
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            result.success ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {result.visitor?.scannedAt || new Date().toLocaleString()}
                        </span>
                      </div>

                      <p className={`text-sm mb-2 ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.message}
                      </p>

                      {result.visitor && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3" />
                            <span className="font-medium">{result.visitor.fullName}</span>
                            <Badge variant="outline" className="ml-auto">
                              {result.visitor.entryType}
                            </Badge>
                          </div>
                          
                          {result.visitor.eventName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {result.visitor.eventName}
                            </div>
                          )}
                          
                          {result.visitor.company && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="w-3 h-3" />
                              {result.visitor.company}
                            </div>
                          )}
                        </div>
                      )}

                      {result.error && (
                        <div className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded">
                          {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default QuickScanner; 