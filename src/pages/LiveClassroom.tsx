"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, VideoOff, Check, X, Camera, Users, AlertTriangle, Clock, UserCheck, UserX, Play, Pause, UserPlus, Eye, Trash2, Plus, Upload } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function EnhancedLiveClassroom() {
  // Camera and video states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // API and analysis states
  const [apiUrl] = useState('http://localhost:8000');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [continuousAnalysis, setContinuousAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]); // Initial state is an empty array
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<{
    totalDetections: number;
    uniqueFaces: Set<string>;
    startTime: Date | null;
  }>({
    totalDetections: 0,
    uniqueFaces: new Set(),
    startTime: null
  });

  const websocketRef = useRef<WebSocket | null>(null);
  const analysisIntervalRef = useRef<number>(0);

  // Unknown faces management states
  const [unknownFaces, setUnknownFaces] = useState<any[]>([]);
  const [showUnknownDialog, setShowUnknownDialog] = useState(false);
  const [selectedUnknownFace, setSelectedUnknownFace] = useState<any>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [faceImages, setFaceImages] = useState<{[key: number]: string}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetches the initial student roster from the backend
  const fetchRoster = async () => {
    try {
      const response = await fetch(`${apiUrl}/roster`);
      if (!response.ok) {
        throw new Error('Failed to fetch roster');
      }
      const data = await response.json();
      // Map the backend data to the format your component expects
      const formattedRoster = data.roster.map((student: any) => ({
        id: student.reid_num, // Use reid_num as the unique ID
        name: student.name,
        status: 'Absent' as const,
        lastSeen: null,
        confidence: 0
      }));
      setStudents(formattedRoster);
    } catch (err) {
      console.error("Error fetching student roster:", err);
      setError(err instanceof Error ? err.message : "Could not load student roster from the server.");
    }
  };
  
  // On component mount, fetch the student roster
  useEffect(() => {
    fetchRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAttendance = useCallback((detectedNames: string[], faceInfo: any[]) => {
    setStudents(currentStudents => {
        const lowerCaseDetectedSet = new Set(detectedNames.map(name => name.toLowerCase()));
        
        const nextStudents = currentStudents.map(student => {
            const isDetected = lowerCaseDetectedSet.has(student.name.toLowerCase());
            if (isDetected) {
                const matchingFace = faceInfo.find(face => face.name.toLowerCase() === student.name.toLowerCase());
                return {
                    ...student,
                    status: 'Present' as const,
                    lastSeen: new Date(),
                    confidence: matchingFace ? Math.round(matchingFace.confidence * 100) : 0
                };
            } else if (student.status === 'Present') {
                // If a student was present but is no longer detected, mark them absent
                // but keep their 'lastSeen' time.
                return { ...student, status: 'Absent' as const, confidence: 0 };
            }
            return student; // No change for already absent students
        });

        // This part handles newly identified people who aren't on the roster yet.
        const enrolledNames = new Set(currentStudents.map(s => s.name.toLowerCase()));
        for (const detectedName of detectedNames) {
            const lowerDetectedName = detectedName.toLowerCase();
            if (lowerDetectedName && !lowerDetectedName.startsWith('unknown_') && !lowerDetectedName.includes('processing') && !enrolledNames.has(lowerDetectedName)) {
                const matchingFace = faceInfo.find(face => face.name === detectedName);
                if (matchingFace) {
                    const newStudent: any = {
                        id: matchingFace.reid_num, // Use the reid_num from the backend
                        name: detectedName,
                        status: 'Present',
                        lastSeen: new Date(),
                        confidence: matchingFace ? Math.round(matchingFace.confidence * 100) : 0,
                    };
                    nextStudents.push(newStudent);
                    enrolledNames.add(lowerDetectedName);
                }
            }
        }
        return nextStudents;
    });
  }, []);

  const handleAnalysisResponse = useCallback((data: any) => {
    setAnalysisData({
      headCount: data.head_count,
      names: data.names,
      faceInfo: data.face_info,
      trackingEnabled: data.tracking_enabled,
      message: data.message,
      timestamp: new Date()
    });
    
    if (data.image) {
      setProcessedImage(`data:image/jpeg;base64,${data.image}`);
    }
    
    updateAttendance(data.names || [], data.face_info || []);
    
    setSessionStats(prev => ({
      ...prev,
      totalDetections: prev.totalDetections + (data.head_count || 0),
      uniqueFaces: new Set([...prev.uniqueFaces, ...(data.names || []).filter((name: string) => name && !name.toLowerCase().startsWith('unknown_') && !name.includes('Processing'))])
    }));

    // Periodically check for new unknown faces
    if (data.names?.some((name: string) => name.toLowerCase().startsWith('unknown_'))) {
        fetchUnknownFaces();
    }
  }, [updateAttendance]);

  const analyzeFrameHttp = async (imageBlob: Blob) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'frame.jpg');
      formData.append('use_tracking', 'true');
      
      const response = await fetch(`${apiUrl}/analyze_frame`, { method: 'POST', body: formData });
      
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      
      handleAnalysisResponse(data);
      
    } catch (err) {
      setError(`Error analyzing frame: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchUnknownFaces = async () => {
    try {
      const response = await fetch(`${apiUrl}/unknown_faces`);
      if (response.ok) {
        const data = await response.json();
        setUnknownFaces(data.unknown_faces || []);
        
        for (const face of data.unknown_faces || []) {
          if (face.has_image && !faceImages[face.reid_num]) {
            fetchFaceImage(face.reid_num);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching unknown faces:', err);
    }
  };

  const fetchFaceImage = async (reidNum: number) => {
    try {
      const response = await fetch(`${apiUrl}/face_image/${reidNum}`);
      if (response.ok) {
        const data = await response.json();
        setFaceImages(prev => ({ ...prev, [reidNum]: `data:image/jpeg;base64,${data.image}` }));
      }
    } catch (err) {
      console.error(`Error fetching face image for ReID ${reidNum}:`, err);
    }
  };

  const addStudentFromUnknown = async () => {
    if (!selectedUnknownFace || !newStudentName.trim()) return;
    setIsAddingStudent(true);
    try {
      const formData = new FormData();
      formData.append('reid_num', selectedUnknownFace.reid_num.toString());
      formData.append('student_name', newStudentName.trim());
      
      const response = await fetch(`${apiUrl}/add_student`, { method: 'POST', body: formData });
      
      if (response.ok) {
        // Create the new student object for immediate UI update
        const newStudent = { 
          id: selectedUnknownFace.reid_num, // Use the correct reid_num
          name: newStudentName.trim(), 
          status: 'Present' as const, // Assume they are present since they were just detected
          lastSeen: new Date(), 
          confidence: 100 
        };
        
        // Add the new student to the existing roster state
        setStudents(prev => [...prev, newStudent]);
        
        // Close dialog and clean up
        setShowUnknownDialog(false);
        setSelectedUnknownFace(null);
        setNewStudentName('');
        setNewStudentId(''); // Note: student ID is not used by the backend yet
        
        // Refresh the list of unknown faces from the server
        await fetchUnknownFaces();
        setError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add student');
      }
    } catch (err) {
      setError(`Error adding student: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAddingStudent(false);
    }
  };

  const dismissUnknownFace = async (reidNum: number) => {
    try {
      const response = await fetch(`${apiUrl}/remove_face/${reidNum}`, { method: 'DELETE' });
      if (response.ok) await fetchUnknownFaces();
    } catch (err) {
      setError(`Error dismissing face: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startCamera = async () => {
    if (isCameraOn) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      setIsCameraOn(true);
      setSessionStats(prev => ({ ...prev, startTime: new Date() }));
      setError(null);
      await fetchUnknownFaces();
    } catch (err) {
      const errorObject = err as any | Error;
      const errorMessage = errorObject instanceof Error ? errorObject.message : (errorObject as any).name || String(err);
      let userMessage = `Error accessing camera: ${errorMessage}. Check console for details.`;
      if (errorMessage.includes("NotAllowedError")) {
          userMessage = "Camera access was DENIED. Please allow access in your browser and try again.";
      } else if (errorMessage.includes("NotFoundError")) {
          userMessage = "No camera found. Please ensure your webcam is connected.";
      } else if (errorMessage.includes("NotReadableError")) {
          userMessage = "Camera is BUSY. Please close other applications using it.";
      }
      setError(userMessage);
      setIsCameraOn(false);
      setStream(null);
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (websocketRef.current) websocketRef.current.close();
    setStream(null);
    setIsCameraOn(false);
    setContinuousAnalysis(false);
    clearInterval(analysisIntervalRef.current);
    websocketRef.current = null;
  };

  const captureFrame = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) return resolve(null);
      const { video, canvas } = { video: videoRef.current, canvas: canvasRef.current };
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    });
  };

  const analyzeSingleFrame = async () => {
    const blob = await captureFrame();
    if (blob) await analyzeFrameHttp(blob);
  };
  
  const sendFrameViaWebSocket = async () => {
      if (websocketRef.current?.readyState !== WebSocket.OPEN) return;
      const blob = await captureFrame();
      if (blob) {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
              const base64data = reader.result as string;
              const imageData = base64data.split(',')[1];
              const payload = { image: imageData, use_tracking: true };
              websocketRef.current?.send(JSON.stringify(payload));
          };
      }
  };

  const toggleContinuousAnalysis = () => {
    setContinuousAnalysis(prev => {
        if (prev) {
            clearInterval(analysisIntervalRef.current);
            if (websocketRef.current) {
                websocketRef.current.close();
                websocketRef.current = null;
            }
            return false;
        } else {
            if (isCameraOn) {
                const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/analyze`);
                websocketRef.current = ws;
                ws.onopen = () => {
                    console.log("WebSocket connection established.");
                    setError(null);
                    analysisIntervalRef.current = window.setInterval(sendFrameViaWebSocket, 2000);
                };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.error) {
                        setError(`Server error: ${data.error}`);
                        return;
                    }
                    handleAnalysisResponse(data);
                };
                ws.onerror = () => {
                    setError("WebSocket connection error. See console.");
                    setContinuousAnalysis(false);
                    clearInterval(analysisIntervalRef.current);
                };
                ws.onclose = () => {
                    console.log("WebSocket connection closed.");
                    setContinuousAnalysis(false);
                    clearInterval(analysisIntervalRef.current);
                };
            }
            return true;
        }
    });
  };

  useEffect(() => {
    if (isCameraOn && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
    }
  }, [isCameraOn, stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presentStudents = students.filter(s => s.status === 'Present').length;
  const totalStudents = students.length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

  const handleImageUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        await analyzeFrameHttp(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Live Classroom</h1>
          <p className="text-muted-foreground">
            AI-powered attendance tracking with student management • {students.length} total students
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowUnknownDialog(true)}
            disabled={unknownFaces.length === 0}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Manage Unknown ({unknownFaces.length})
          </Button>
          <Button variant="outline" onClick={stopCamera} disabled={!isCameraOn}>
            <VideoOff className="mr-2 h-4 w-4" />
            End Session
          </Button>
          {sessionStats.startTime && (
            <Badge variant="secondary">
              Session: {Math.round((Date.now() - sessionStats.startTime.getTime()) / 60000)}min
            </Badge>
          )}
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                  {error}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setError(null)}
                    className="ml-2"
                  >
                    Dismiss
                  </Button>
              </AlertDescription>
          </Alert>
      )}
      
      {/* Unknown Faces Alert */}
      {unknownFaces.length > 0 && !showUnknownDialog && (
          <Alert>
            <UserPlus className="h-4 w-4" />
            <AlertDescription>
              {unknownFaces.length} unknown face(s) detected that can be added as students.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowUnknownDialog(true)}
                className="ml-2"
              >
                Review
              </Button>
            </AlertDescription>
          </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Camera and Analysis */}
        <div className="lg:col-span-2 space-y-4">
          {/* Camera Feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Video className="mr-2 h-5 w-5" />
                  Camera Feed
                </CardTitle>
                <div className="flex space-x-2">
                  {isCameraOn && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={analyzeSingleFrame} 
                        disabled={isAnalyzing || continuousAnalysis}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Analyze Frame
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={toggleContinuousAnalysis}
                        variant={continuousAnalysis ? 'default' : 'outline'}
                        disabled={isAnalyzing}
                      >
                        {continuousAnalysis ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {continuousAnalysis ? 'Stop Auto' : 'Start Auto'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing || continuousAnalysis}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Frame
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Live Feed */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Live Feed</h3>
                  {isCameraOn ? (
                    <div className="relative">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video rounded-lg bg-black" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-white">Analyzing...</div>
                        </div>
                      )}
                      {continuousAnalysis && (
                        <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">
                          Auto Analysis ON
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground mb-2">Camera is off</p>
                        <Button onClick={startCamera}>
                          <Video className="mr-2 h-4 w-4" /> Enable Camera
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Processed Output */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">AI Analysis Result</h3>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {processedImage ? (
                      <img 
                        src={processedImage} 
                        alt="Processed frame"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : analysisData ? (
                      <div className="text-center p-4">
                        <p className="text-2xl font-bold mb-2">{analysisData.headCount || 0} Faces</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Last updated: {analysisData.timestamp?.toLocaleTimeString()}
                        </p>
                        {(analysisData.names?.length > 0) && (
                          <div className="space-y-1">
                            {analysisData.names.slice(0, 3).map((name: string, i: number) => (
                              <Badge key={i} variant={name.startsWith('Unknown') ? 'destructive' : 'outline'} className="mr-1">
                                {name}
                              </Badge>
                            ))}
                            {analysisData.names.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{analysisData.names.length - 3} more
                              </p>
                            )}
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
            </CardContent>
          </Card>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-600">{presentStudents}</div>
                <p className="text-xs text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-red-600">{totalStudents - presentStudents}</div>
                <p className="text-xs text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold">{analysisData?.headCount || 0}</div>
                <p className="text-xs text-muted-foreground">In Frame</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-orange-600">{unknownFaces.length}</div>
                <p className="text-xs text-muted-foreground">Unknown</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attendance Panel */}
        <div className="space-y-4">
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Live Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Attendance Rate</span>
                  <span className="text-sm font-medium">{attendanceRate}%</span>
                </div>
                <Progress value={attendanceRate} />
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    <UserCheck className="mr-1 h-3 w-3 text-green-500" />
                    {presentStudents} Present
                  </div>
                  <div className="flex items-center">
                    <UserX className="mr-1 h-3 w-3 text-red-500" />
                    {totalStudents - presentStudents} Absent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[20rem] overflow-y-auto pr-2">
                {students.sort((a,b) => a.name.localeCompare(b.name)).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${student.name}`} />
                        <AvatarFallback className="text-xs">
                          {student.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        {student.status === 'Present' && student.lastSeen && (
                          <p className="text-xs text-muted-foreground">
                            {student.lastSeen.toLocaleTimeString()}
                            {student.confidence > 0 && ` • ${student.confidence}%`}
                          </p>
                        )}
                        {student.status === 'Absent' && student.lastSeen && (
                            <p className="text-xs text-muted-foreground">
                              Last seen: {student.lastSeen.toLocaleTimeString()}
                            </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {student.status === 'Present' ? (
                        <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Absent
                        </Badge>
                      )}
                      {student.status === 'Present' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Stats */}
          {sessionStats.startTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span>{Math.round((Date.now() - sessionStats.startTime.getTime()) / 60000)}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Detections</span>
                    <span>{sessionStats.totalDetections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique Faces</span>
                    <span>{sessionStats.uniqueFaces.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span>{continuousAnalysis ? 'Auto-tracking' : 'Manual'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Unknown Faces Management Dialog */}
      <Dialog open={showUnknownDialog} onOpenChange={setShowUnknownDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Manage Unknown Faces ({unknownFaces.length})
            </DialogTitle>
            <DialogDescription>
              Review unidentified faces and add them to your student roster or dismiss them.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {unknownFaces.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No unknown faces to review</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unknownFaces.map((face) => (
                  <Card key={face.reid_num} className="relative">
                    <CardContent className="p-4">
                      <div className="text-center space-y-3">
                        {/* Face Image */}
                        <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {faceImages[face.reid_num] ? (
                            <img 
                              src={faceImages[face.reid_num]} 
                              alt={`Unknown face ${face.reid_num}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground">
                              <Eye className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        
                        {/* Face Info */}
                        <div>
                          <p className="text-sm font-medium">ReID: {face.reid_num}</p>
                          <p className="text-xs text-muted-foreground">{face.name}</p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedUnknownFace(face);
                              setNewStudentName('');
                              setNewStudentId('');
                            }}
                            className="flex-1"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissUnknownFace(face.reid_num)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={selectedUnknownFace !== null} onOpenChange={(open) => {
        if (!open) setSelectedUnknownFace(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to Roster</DialogTitle>
            <DialogDescription>
              Add this unknown face to your student roster.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUnknownFace && (
            <div className="space-y-4">
              {/* Face Preview */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {faceImages[selectedUnknownFace.reid_num] ? (
                    <img 
                      src={faceImages[selectedUnknownFace.reid_num]} 
                      alt="Selected face"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Eye className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">ReID: {selectedUnknownFace.reid_num}</p>
                  <p className="text-sm text-muted-foreground">{selectedUnknownFace.name}</p>
                </div>
              </div>
              
              {/* Student Info Form */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="studentName">Student Name *</Label>
                  <Input
                    id="studentName"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Enter student's full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="studentId">Student ID (Optional)</Label>
                  <Input
                    id="studentId"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="Enter student ID"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUnknownFace(null)}>
              Cancel
            </Button>
            <Button 
              onClick={addStudentFromUnknown}
              disabled={!newStudentName.trim() || isAddingStudent}
            >
              {isAddingStudent ? 'Adding...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      {/* Hidden file input for image upload */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUploadChange} 
        style={{ display: 'none' }} 
      />
    </div>
  );
}