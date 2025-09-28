"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Video, BookOpen, BarChart3, Camera, AlertTriangle, CheckCircle, Clock, VideoOff, User, UserCheck, UserX } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function TeacherDashboard() {
  // API state
  const [apiUrl] = useState('http://localhost:8000');
  const [useTracking, setUseTracking] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [faces, setFaces] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [continuousProcessing, setContinuousProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const animationRef = useRef<number>(0);

  // API client functions
  const healthCheck = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiUrl}/`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const getStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/status`);
      if (!response.ok) throw new Error('Failed to get status');
      const data = await response.json();
      setStatus(data);
      return { success: true, data };
    } catch (err) {
      setError(`Error getting status: ${err}`);
      return { success: false, error: err };
    }
  };

  const getAllFaces = async () => {
    try {
      const response = await fetch(`${apiUrl}/faces`);
      if (!response.ok) throw new Error('Failed to get faces');
      const data = await response.json();
      setFaces(data.faces || []);
      return { success: true, data };
    } catch (err) {
      setError(`Error getting faces: ${err}`);
      return { success: false, error: err };
    }
  };

  const analyzeFrame = async (imageBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'frame.jpg');
      formData.append('use_tracking', useTracking.toString());
      
      const response = await fetch(`${apiUrl}/analyze_frame`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to analyze frame');
      const data = await response.json();
      
      // Set all analysis data
      const analysisResult = {
        headCount: data.head_count,
        names: data.names,
        faceInfo: data.face_info,
        trackingEnabled: data.tracking_enabled,
        message: data.message,
        timestamp: new Date(),
        image: data.image ? `data:image/jpeg;base64,${data.image}` : null,
        id: Date.now() // Simple ID for key prop
      };
      
      setAnalysisData(analysisResult);
      
      // Add to history only if we have a processed image (keep only last 12)
      if (data.image) {
        setAnalysisHistory(prev => {
          const newHistory = [analysisResult, ...prev].slice(0, 12);
          return newHistory;
        });
      }
      
      // Set processed image for display
      if (data.image) {
        setProcessedImage(`data:image/jpeg;base64,${data.image}`);
      }
      
      return { success: true, data };
    } catch (err) {
      setError(`Error analyzing frame: ${err}`);
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  // Camera functions
  const toggleCamera = async () => {
    if (isCameraOn) {
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      setContinuousProcessing(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        setStream(mediaStream);
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(`Error accessing camera: ${err}`);
      }
    }
  };

  // Capture frame from video
  const captureFrame = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) {
        resolve(null);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    });
  };

  // Process frames continuously
  const processFrames = async () => {
    if (!isCameraOn || isProcessing || !continuousProcessing) return;
    
    const blob = await captureFrame();
    if (!blob) return;
    
    await analyzeFrame(blob);
    
    // Process frames at approximately 5fps to avoid overwhelming the API
    setTimeout(() => {
      if (continuousProcessing) {
        animationRef.current = requestAnimationFrame(processFrames);
      }
    }, 200);
  };

  // Capture a single frame
  const captureSingleFrame = async () => {
    const blob = await captureFrame();
    if (!blob) return;
    
    await analyzeFrame(blob);
  };

  // Toggle continuous processing
  const toggleContinuousProcessing = () => {
    if (continuousProcessing) {
      setContinuousProcessing(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      setContinuousProcessing(true);
      animationRef.current = requestAnimationFrame(processFrames);
    }
  };

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      const isHealthy = await healthCheck();
      if (!isHealthy) {
        setError('API server is not running. Please start it first.');
        return;
      }
      
      await getStatus();
      await getAllFaces();
    };
    
    initialize();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Handle video stream
  useEffect(() => {
    if (isCameraOn && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOn, stream]);

  // Handle tracking mode changes
  useEffect(() => {
    if (isCameraOn && continuousProcessing) {
      cancelAnimationFrame(animationRef.current);
      setProcessedImage(null);
      setAnalysisData(null);
      animationRef.current = requestAnimationFrame(processFrames);
    }
  }, [useTracking, isCameraOn, continuousProcessing]);

  // Count face statuses
  const getFaceStatusCounts = () => {
    if (!analysisData?.faceInfo) {
      return { recognized: 0, unknown: 0, processing: 0 };
    }

    const counts = { recognized: 0, unknown: 0, processing: 0 };
    analysisData.faceInfo.forEach((face: any) => {
      if (face.status === 'recognized') counts.recognized++;
      else if (face.status === 'processing') counts.processing++;
      else counts.unknown++;
    });

    return counts;
  };

  const statusCounts = getFaceStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your classes and monitor student progress</p>
        </div>
        <div className="flex space-x-2">
         <a href="/live-classroom">
          <Button variant="outline">
            <Video className="mr-2 h-4 w-4" />
            Live Class
          </Button>
         </a>
          <a href="/attendance-monitor">
          <Button className="bg-gradient-to-r from-primary to-accent">
            <Camera className="mr-2 h-4 w-4" />
            AI Attendance
          </Button>
          </a>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              156 total students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Head Count</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analysisData?.headCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              People detected in frame
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recognition Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisData?.headCount > 0 
                ? Math.round((statusCounts.recognized / analysisData.headCount) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {statusCounts.recognized} of {analysisData?.headCount || 0} recognized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {status?.known_faces || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Known faces in database
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Live Classroom Feed */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <Video className="mr-2 h-5 w-5" />
                  Live Classroom Monitor
                </CardTitle>
                <CardDescription>Real-time attendance tracking with AI</CardDescription>
              </div>
              <Tabs value={useTracking ? 'tracking' : 'simple'} onValueChange={(value) => setUseTracking(value === 'tracking')}>
                <TabsList>
                  <TabsTrigger value="tracking">Face Tracking</TabsTrigger>
                  <TabsTrigger value="simple">Simple Detection</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Live Camera Feed */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Live Camera Feed</h3>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative">
                  {isCameraOn ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Camera feed will appear here</p>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-white">Analyzing...</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Processed Output */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Analysis Results</h3>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative">
                  {processedImage ? (
                    <img 
                      src={processedImage} 
                      alt="Analyzed frame" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : analysisData ? (
                    <div className="text-center p-4 space-y-2">
                      <p className="text-2xl font-bold">Head Count: {analysisData.headCount}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="font-medium text-green-600">{statusCounts.recognized}</p>
                          <p className="text-xs">Recognized</p>
                        </div>
                        <div>
                          <p className="font-medium text-red-600">{statusCounts.unknown}</p>
                          <p className="text-xs">Unknown</p>
                        </div>
                        <div>
                          <p className="font-medium text-yellow-600">{statusCounts.processing}</p>
                          <p className="text-xs">Processing</p>
                        </div>
                      </div>
                      {analysisData.names.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Detected:</p>
                          <div className="max-h-24 overflow-y-auto">
                            {analysisData.names.map((name: string, i: number) => (
                              <Badge key={i} variant="outline" className="m-1 text-xs">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground">Analysis results will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button onClick={toggleCamera} variant={isCameraOn ? 'destructive' : 'default'}>
                {isCameraOn ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                {isCameraOn ? 'Disable Camera' : 'Enable Camera'}
              </Button>
              
              {isCameraOn && (
                <>
                  <Button onClick={captureSingleFrame} disabled={isProcessing}>
                    <Camera className="mr-2 h-4 w-4" />
                    Analyze Frame
                  </Button>
                  
                  <Button 
                    onClick={toggleContinuousProcessing} 
                    variant={continuousProcessing ? 'default' : 'outline'}
                    disabled={isProcessing}
                  >
                    {continuousProcessing ? 'Stop Continuous' : 'Start Continuous'}
                  </Button>
                </>
              )}
            </div>
            
            {/* Live Analysis Summary */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {statusCounts.recognized}
                </p>
                <p className="text-sm text-muted-foreground flex items-center justify-center">
                  <UserCheck className="mr-1 h-4 w-4" />
                  Recognized
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{statusCounts.unknown}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center">
                  <UserX className="mr-1 h-4 w-4" />
                  Unknown
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.processing}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Processing
                </p>
              </div>
            </div>

            {/* Face Details */}
            {analysisData?.faceInfo && analysisData.faceInfo.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Detected Faces:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {analysisData.faceInfo.map((face: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                      <span>{face.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={face.status === 'recognized' ? 'default' : face.status === 'processing' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {face.status}
                        </Badge>
                        <span className="text-muted-foreground">
                          {Math.round(face.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Frames Gallery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Camera className="mr-2 h-5 w-5" />
                Processed Frames
              </div>
              <Badge variant="outline" className="text-xs">
                {analysisHistory.length}/12
              </Badge>
            </CardTitle>
            <CardDescription>Grid view of analyzed frames</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {/* Show processed frames */}
              {analysisHistory.map((analysis, index) => (
                <div key={analysis.id} className="relative group cursor-pointer" onClick={() => setProcessedImage(analysis.image)}>
                  {analysis.image ? (
                    <img 
                      src={analysis.image} 
                      alt={`Frame ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-muted hover:border-primary transition-colors"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-lg border-2 border-muted flex items-center justify-center">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-white font-medium">#{index + 1}</div>
                      <div className="text-xs text-white">
                        {analysis.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-white font-medium">
                        {analysis.headCount} face{analysis.headCount !== 1 ? 's' : ''}
                      </div>
                      <div className="flex space-x-1">
                        {(() => {
                          const recognized = analysis.faceInfo?.filter((f: any) => f.status === 'recognized').length || 0;
                          const unknown = analysis.faceInfo?.filter((f: any) => f.status === 'unknown').length || 0;
                          
                          return (
                            <>
                              {recognized > 0 && (
                                <div className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                                  {recognized}R
                                </div>
                              )}
                              {unknown > 0 && (
                                <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                                  {unknown}U
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick status indicator - always visible */}
                  <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {analysis.headCount}
                  </div>
                </div>
              ))}
              
              {/* Empty slots to show available space */}
              {Array.from({ length: Math.max(0, 12 - analysisHistory.length) }, (_, index) => (
                <div 
                  key={`empty-${index}`} 
                  className="w-full aspect-square bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
                >
                  <Camera className="h-4 w-4 text-muted-foreground/50" />
                </div>
              ))}
            </div>
            
            {/* Actions and Stats */}
            {analysisHistory.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs border-t pt-3">
                  <div>
                    <p className="font-bold text-green-600">
                      {analysisHistory.reduce((sum, analysis) => 
                        sum + (analysis.faceInfo?.filter((f: any) => f.status === 'recognized').length || 0), 0
                      )}
                    </p>
                    <p className="text-muted-foreground">Recognized</p>
                  </div>
                  <div>
                    <p className="font-bold text-red-600">
                      {analysisHistory.reduce((sum, analysis) => 
                        sum + (analysis.faceInfo?.filter((f: any) => f.status === 'unknown').length || 0), 0
                      )}
                    </p>
                    <p className="text-muted-foreground">Unknown</p>
                  </div>
                  <div>
                    <p className="font-bold">
                      {analysisHistory.reduce((sum, analysis) => sum + analysis.headCount, 0)}
                    </p>
                    <p className="text-muted-foreground">Total</p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setAnalysisHistory([])}
                >
                  Clear All Frames
                </Button>
              </div>
            )}
            
            {/* Empty State */}
            {analysisHistory.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No frames processed yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start analyzing to see frames here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div>
                <p className="font-medium">CS301 - Data Structures</p>
                <p className="text-sm text-muted-foreground">Room 301 • 45 students</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">9:00 - 10:30 AM</p>
                <Badge variant="secondary">In Progress</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">CS401 - Machine Learning</p>
                <p className="text-sm text-muted-foreground">Lab 4 • 32 students</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">2:00 - 4:00 PM</p>
                <Badge variant="outline">Upcoming</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">CS502 - Advanced Algorithms</p>
                <p className="text-sm text-muted-foreground">Room 205 • 28 students</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">4:30 - 6:00 PM</p>
                <Badge variant="outline">Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Class Performance Overview</CardTitle>
            <CardDescription>Average scores by class</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Data Structures (CS301)</span>
                <span>82%</span>
              </div>
              <Progress value={82} />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Machine Learning (CS401)</span>
                <span>78%</span>
              </div>
              <Progress value={78} />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Advanced Algorithms (CS502)</span>
                <span>85%</span>
              </div>
              <Progress value={85} />
            </div>
            
            <Button variant="outline" className="w-full mt-4">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Detailed Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
