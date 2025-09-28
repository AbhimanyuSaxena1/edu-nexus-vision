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
import { Video, VideoOff, Check, X, Camera, Users, AlertTriangle, Clock, UserCheck, UserX, Play, Pause, UserPlus, Eye, Trash2, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Sample student roster for comparison
const initialStudentRoster = [
  { id: 1, name: 'Alice Johnson', status: 'Absent', lastSeen: null, confidence: 0 },
  { id: 2, name: 'Bob Williams', status: 'Absent', lastSeen: null, confidence: 0 },
  { id: 3, name: 'Charlie Brown', status: 'Absent', lastSeen: null, confidence: 0 },
  { id: 4, name: 'Diana Miller', status: 'Absent', lastSeen: null, confidence: 0 },
  { id: 5, name: 'Emma Davis', status: 'Absent', lastSeen: null, confidence: 0 },
  { id: 6, name: 'Frank Wilson', status: 'Absent', lastSeen: null, confidence: 0 },
];

export default function EnhancedLiveClassroom() {
  // Camera and video states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Face recognition states
  const [apiUrl] = useState('http://localhost:8000');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [continuousAnalysis, setContinuousAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [students, setStudents] = useState(initialStudentRoster);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({
    totalDetections: 0,
    uniqueFaces: new Set(),
    startTime: null as Date | null
  });

  // Unknown faces management states
  const [unknownFaces, setUnknownFaces] = useState<any[]>([]);
  const [showUnknownDialog, setShowUnknownDialog] = useState(false);
  const [selectedUnknownFace, setSelectedUnknownFace] = useState<any>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [faceImages, setFaceImages] = useState<{[key: number]: string}>({});
  
  const animationRef = useRef<number>(0);

  // API Functions
  const analyzeFrame = async (imageBlob: Blob) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'frame.jpg');
      formData.append('use_tracking', 'true');
      
      const response = await fetch(`${apiUrl}/analyze_frame`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to analyze frame');
      const data = await response.json();
      
      // Update analysis data
      setAnalysisData({
        headCount: data.head_count,
        names: data.names,
        faceInfo: data.face_info,
        trackingEnabled: data.tracking_enabled,
        message: data.message,
        timestamp: new Date()
      });
      
      // Set processed image
      if (data.image) {
        setProcessedImage(`data:image/jpeg;base64,${data.image}`);
      }
      
      // Update student attendance based on detected names
      updateAttendance(data.names, data.face_info);
      
      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        totalDetections: prev.totalDetections + data.head_count,
        uniqueFaces: new Set([...prev.uniqueFaces, ...data.names.filter((name: string) => name !== 'Unknown' && !name.includes('Processing'))])
      }));
      
      // Check for unknown faces and update the list
      await fetchUnknownFaces();
      
      return { success: true, data };
    } catch (err) {
      setError(`Error analyzing frame: ${err}`);
      return { success: false, error: err };
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
        
        // Fetch images for unknown faces
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
        setFaceImages(prev => ({
          ...prev,
          [reidNum]: `data:image/jpeg;base64,${data.image}`
        }));
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
      if (newStudentId.trim()) {
        formData.append('student_id', newStudentId.trim());
      }
      
      const response = await fetch(`${apiUrl}/add_student`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add to student roster
        const newStudent = {
          id: students.length + 1,
          name: newStudentName.trim(),
          status: 'Absent',
          lastSeen: null,
          confidence: 0
        };
        
        setStudents(prev => [...prev, newStudent]);
        
        // Close dialog and reset form
        setShowUnknownDialog(false);
        setSelectedUnknownFace(null);
        setNewStudentName('');
        setNewStudentId('');
        
        // Refresh unknown faces list
        await fetchUnknownFaces();
        
        // Show success message
        setError(null);
        
      } else {
        throw new Error('Failed to add student');
      }
    } catch (err) {
      setError(`Error adding student: ${err}`);
    } finally {
      setIsAddingStudent(false);
    }
  };

  const dismissUnknownFace = async (reidNum: number) => {
    try {
      const response = await fetch(`${apiUrl}/remove_face/${reidNum}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchUnknownFaces();
      }
    } catch (err) {
      setError(`Error dismissing face: ${err}`);
    }
  };

  const updateAttendance = (detectedNames: string[], faceInfo: any[]) => {
    setStudents(prev => prev.map(student => {
      const isDetected = detectedNames.some(name => 
        name.toLowerCase().includes(student.name.toLowerCase().split(' ')[0]) ||
        student.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (isDetected) {
        const matchingFace = faceInfo.find(face => 
          face.name.toLowerCase().includes(student.name.toLowerCase().split(' ')[0]) ||
          student.name.toLowerCase().includes(face.name.toLowerCase())
        );
        
        return {
          ...student,
          status: 'Present',
          lastSeen: new Date(),
          confidence: matchingFace ? Math.round(matchingFace.confidence * 100) : 0
        };
      }
      
      return student;
    }));
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setIsCameraOn(true);
      setSessionStats(prev => ({ ...prev, startTime: new Date() }));
      setError(null);
      
      // Fetch unknown faces when camera starts
      await fetchUnknownFaces();
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(`Error accessing camera: ${err}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      setContinuousAnalysis(false);
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Frame capture and analysis
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
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    });
  };

  const analyzeSingleFrame = async () => {
    const blob = await captureFrame();
    if (blob) {
      await analyzeFrame(blob);
    }
  };

  const processFramesContinuously = async () => {
    if (!isCameraOn || isAnalyzing || !continuousAnalysis) return;
    
    const blob = await captureFrame();
    if (blob) {
      await analyzeFrame(blob);
    }
    
    // Analyze every 2 seconds to avoid overwhelming the API
    setTimeout(() => {
      if (continuousAnalysis) {
        animationRef.current = requestAnimationFrame(processFramesContinuously);
      }
    }, 2000);
  };

  const toggleContinuousAnalysis = () => {
    if (continuousAnalysis) {
      setContinuousAnalysis(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      setContinuousAnalysis(true);
      animationRef.current = requestAnimationFrame(processFramesContinuously);
    }
  };

  // Effects
  useEffect(() => {
    if (isCameraOn && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, [isCameraOn, stream]);

  // Calculate attendance stats
  const presentStudents = students.filter(s => s.status === 'Present').length;
  const attendanceRate = Math.round((presentStudents / students.length) * 100);

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
          <Button variant="outline" onClick={stopCamera}>
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
      {unknownFaces.length > 0 && (
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
                      <Button size="sm" onClick={analyzeSingleFrame} disabled={isAnalyzing}>
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
                      <video ref={videoRef} autoPlay playsInline className="w-full aspect-video rounded-lg" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-white">Analyzing...</div>
                        </div>
                      )}
                      {continuousAnalysis && (
                        <Badge className="absolute top-2 left-2 bg-green-500">
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
                        <p className="text-2xl font-bold mb-2">{analysisData.headCount} Faces</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Last updated: {analysisData.timestamp?.toLocaleTimeString()}
                        </p>
                        {analysisData.names.length > 0 && (
                          <div className="space-y-1">
                            {analysisData.names.slice(0, 3).map((name: string, i: number) => (
                              <Badge key={i} variant="outline" className="mr-1">
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
                <div className="text-2xl font-bold text-red-600">{students.length - presentStudents}</div>
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
                    {students.length - presentStudents} Absent
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
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${student.name}`} />
                        <AvatarFallback className="text-xs">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        {student.lastSeen && (
                          <p className="text-xs text-muted-foreground">
                            {student.lastSeen.toLocaleTimeString()}
                            {student.confidence > 0 && ` • ${student.confidence}%`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {student.status === 'Present' ? (
                        <Badge variant="default" className="text-xs">
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
    </div>
  );
}