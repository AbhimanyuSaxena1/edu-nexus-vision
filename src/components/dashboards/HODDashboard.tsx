import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, BookOpen, TrendingUp, Calendar, Building, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HODDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">HOD Dashboard</h1>
          <p className="text-muted-foreground">Department overview and management tools</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Generate Timetable
          </Button>
          <Button className="bg-gradient-to-r from-primary to-accent">
            <Settings className="mr-2 h-4 w-4" />
            Department Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +12% from last semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground">
              2 new hires this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              Across 8 semesters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">89.3%</div>
            <Progress value={89.3} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              +3.2% this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Department Performance */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Department Performance Analytics
            </CardTitle>
            <CardDescription>Key metrics across all programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Computer Science</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} />
                  <p className="text-xs text-muted-foreground mt-1">423 students</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Information Technology</span>
                    <span>88%</span>
                  </div>
                  <Progress value={88} />
                  <p className="text-xs text-muted-foreground mt-1">387 students</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Data Science</span>
                    <span>94%</span>
                  </div>
                  <Progress value={94} />
                  <p className="text-xs text-muted-foreground mt-1">298 students</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cybersecurity</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} />
                  <p className="text-xs text-muted-foreground mt-1">139 students</p>
                </div>
                
                <div className="bg-accent/20 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Top Performers</h4>
                  <p className="text-xs text-muted-foreground">Data Science leads with 94% average</p>
                  <p className="text-xs text-muted-foreground">CS follows with 92% average</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Resource Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3 p-2 bg-destructive/10 rounded-lg">
              <div className="w-2 h-2 bg-destructive rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Lab 4 Overcapacity</p>
                <p className="text-xs text-muted-foreground">45/40 students assigned</p>
                <p className="text-xs text-muted-foreground">Requires immediate attention</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 bg-warning/10 rounded-lg">
              <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Equipment Maintenance</p>
                <p className="text-xs text-muted-foreground">Lab 2 projector needs service</p>
                <p className="text-xs text-muted-foreground">Scheduled for tomorrow</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 bg-primary/10 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Faculty Availability</p>
                <p className="text-xs text-muted-foreground">Dr. Wilson on leave next week</p>
                <p className="text-xs text-muted-foreground">Substitute arranged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Faculty Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Faculty Management
            </CardTitle>
            <CardDescription>Overview of teaching staff</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-full text-xs font-medium">
                  DS
                </div>
                <div>
                  <p className="font-medium">Dr. Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Machine Learning • 4 classes</p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-secondary text-secondary-foreground p-2 rounded-full text-xs font-medium">
                  MW
                </div>
                <div>
                  <p className="font-medium">Prof. Michael Wilson</p>
                  <p className="text-sm text-muted-foreground">Data Structures • 3 classes</p>
                </div>
              </div>
              <Badge variant="outline">On Leave</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-accent text-accent-foreground p-2 rounded-full text-xs font-medium">
                  AB
                </div>
                <div>
                  <p className="font-medium">Dr. Alice Brown</p>
                  <p className="text-sm text-muted-foreground">Cybersecurity • 2 classes</p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            
            <Link to="/faculty" className="w-full">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage All Faculty
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Timetable Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Timetable Management
            </CardTitle>
            <CardDescription>AI-optimized scheduling overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-2xl font-bold text-primary">98%</p>
                <p className="text-sm text-muted-foreground">Schedule Efficiency</p>
              </div>
              <div className="bg-accent/10 p-4 rounded-lg">
                <p className="text-2xl font-bold text-accent">12</p>
                <p className="text-sm text-muted-foreground">Conflicts Resolved</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Room Utilization</span>
                <span>87%</span>
              </div>
              <Progress value={87} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Faculty Workload Balance</span>
                <span>92%</span>
              </div>
              <Progress value={92} />
            </div>
            
            <Button variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Optimize Timetable
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}