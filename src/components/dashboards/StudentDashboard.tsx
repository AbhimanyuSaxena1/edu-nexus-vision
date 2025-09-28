import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Award, TrendingUp, Calendar, Bell, Brain, Users, Link } from 'lucide-react';

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your academic progress and stay organized</p>
        </div>
       <a className='cursor-pointer' href="/ai-tutor">
        <Button className="bg-gradient-to-r from-primary to-accent">
          <Brain className="mr-2 h-4 w-4" />
          Ask AI Tutor
        </Button>
       </a>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">92%</div>
            <Progress value={92} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              +2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              2 assignments due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Average</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">85.2%</div>
            <p className="text-xs text-muted-foreground">
              Based on 12 quizzes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">7 days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up!
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div>
                <p className="font-medium">Data Structures</p>
                <p className="text-sm text-muted-foreground">Room 301 • Dr. Smith</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">9:00 - 10:30 AM</p>
                <Badge variant="secondary">Ongoing</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Database Management</p>
                <p className="text-sm text-muted-foreground">Room 205 • Prof. Johnson</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">11:00 - 12:30 PM</p>
                <Badge variant="outline">Upcoming</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Machine Learning Lab</p>
                <p className="text-sm text-muted-foreground">Lab 4 • Dr. Wilson</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">2:00 - 4:00 PM</p>
                <Badge variant="outline">Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Quiz submitted</p>
                <p className="text-xs text-muted-foreground">Computer Networks • 2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Attendance marked</p>
                <p className="text-xs text-muted-foreground">Data Structures • 3 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">New assignment</p>
                <p className="text-xs text-muted-foreground">Software Engineering • Yesterday</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>Your current semester progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Data Structures</span>
                <span>78%</span>
              </div>
              <Progress value={78} />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Database Management</span>
                <span>85%</span>
              </div>
              <Progress value={85} />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Computer Networks</span>
                <span>72%</span>
              </div>
              <Progress value={72} />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Machine Learning</span>
                <span>91%</span>
              </div>
              <Progress value={91} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access your most used features</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              View Weekly Quizzes
            </Button>
            
            <Button variant="outline" className="justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Check Attendance
            </Button>
            
            <Button variant="outline" className="justify-start">
              <Award className="mr-2 h-4 w-4" />
              Browse Certifications
            </Button>
            
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Find Team Members
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}