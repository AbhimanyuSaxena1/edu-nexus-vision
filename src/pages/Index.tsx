import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GraduationCap, Users, Brain, Video, Calendar, Award, BookOpen, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="bg-primary text-primary-foreground p-4 rounded-xl">
              <GraduationCap className="h-12 w-12" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ATTENDEX
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Smart Curriculum Activity & Attendance Management
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Revolutionizing education with AI-powered attendance tracking, real-time analytics, 
            personalized learning, and seamless collaboration tools for students, teachers, and administrators.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              onClick={() => window.location.href = '/auth'}
            >
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="border-0 shadow-medium hover:shadow-large transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="mr-3 h-6 w-6 text-primary" />
                AI Facial Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced YOLO-powered facial recognition for contactless, secure attendance tracking 
                with real-time monitoring and high accuracy rates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medium hover:shadow-large transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-3 h-6 w-6 text-primary" />
                AI Smart Tutor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                24/7 personalized AI tutoring with instant doubt resolution, adaptive learning paths, 
                and intelligent content recommendations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medium hover:shadow-large transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-3 h-6 w-6 text-primary" />
                Auto Weekly Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                PYQ-based adaptive quizzes with instant feedback, performance analytics, 
                and personalized difficulty adjustment.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medium hover:shadow-large transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-3 h-6 w-6 text-primary" />
                Real-time Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive dashboards with attendance insights, performance metrics, 
                and predictive analytics for academic success.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medium hover:shadow-large transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-3 h-6 w-6 text-primary" />
                Team Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Idea pitching platform and team finder for projects, hackathons, and startups 
                with skill-based matching algorithms.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medium hover:shadow-large transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-3 h-6 w-6 text-primary" />
                AI Timetable Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Intelligent scheduling optimization with conflict resolution, resource allocation, 
                and automatic updates for efficient time management.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Role-based Access */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-8">
            Tailored Experiences for Every Role
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-6 rounded-xl mb-4 mx-auto w-fit">
                <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Students</h4>
              <p className="text-muted-foreground">
                Track progress, take quizzes, access AI tutoring, collaborate on projects, 
                and manage your academic journey seamlessly.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-xl mb-4 mx-auto w-fit">
                <Users className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Teachers</h4>
              <p className="text-muted-foreground">
                Monitor live classrooms, track attendance with AI, create quizzes, 
                analyze student performance, and manage course content efficiently.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/20 p-6 rounded-xl mb-4 mx-auto w-fit">
                <GraduationCap className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2">HODs</h4>
              <p className="text-muted-foreground">
                Oversee department operations, manage faculty, generate optimized timetables, 
                and access comprehensive academic analytics and reporting.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Educational Experience?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of institutions already using ATTENDEX for smarter education management.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            onClick={() => window.location.href = '/auth'}
          >
            Start Your Journey Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
