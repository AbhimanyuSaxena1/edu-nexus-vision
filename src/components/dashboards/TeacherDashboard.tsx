import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Video, BookOpen, BarChart3, Camera, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your classes and monitor student progress</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Video className="mr-2 h-4 w-4" />
            Start Live Class
          </Button>
          <Button className="bg-gradient-to-r from-primary to-accent">
            <Camera className="mr-2 h-4 w-4" />
            AI Attendance
          </Button>
        </div>
      </div>

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
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">88%</div>
            <Progress value={88} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              137 out of 156 present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Assignments & quizzes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">96.5%</div>
            <p className="text-xs text-muted-foreground">
              Face recognition accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Live Classroom Feed */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="mr-2 h-5 w-5" />
              Live Classroom Monitor
            </CardTitle>
            <CardDescription>Real-time attendance tracking with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Camera feed will appear here</p>
                <Button className="mt-2" size="sm">Enable Camera</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">42</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">3</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">1</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Detection Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              AI Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3 p-2 bg-primary/10 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">New face detected</p>
                <p className="text-xs text-muted-foreground">Unknown student in frame</p>
                <p className="text-xs text-muted-foreground">2 min ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 bg-accent/10 rounded-lg">
              <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Low confidence</p>
                <p className="text-xs text-muted-foreground">John Doe - 72% match</p>
                <p className="text-xs text-muted-foreground">5 min ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Attendance updated</p>
                <p className="text-xs text-muted-foreground">15 students marked present</p>
                <p className="text-xs text-muted-foreground">10 min ago</p>
              </div>
            </div>
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
    </div>
  );
}