import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, BookOpen, User, Mail, GraduationCap } from 'lucide-react';

const smartCourses = [
  { id: 'SC01', name: 'Advanced AI for Robotics', instructor: 'Dr. Eva Rostova', reason: 'Based on your high scores in Machine Learning.' },
  { id: 'SC02', name: 'Quantum Computing Fundamentals', instructor: 'Prof. Alistair Finch', reason: 'Trending in your field of study.' },
  { id: 'SC03', name: 'Ethical Hacking & Defense', instructor: 'Dr. Kenji Tanaka', reason: 'Complements your skills in Network Security.' },
  { id: 'SC04', name: 'Cloud Native Development', instructor: 'Dr. Anya Sharma', reason: 'Popular among your peers.' },
];

function EnrollmentForm({ courseName }: { courseName: string }) {
  return (
    <form className="space-y-4">
      <DialogHeader>
        <DialogTitle>Enroll in {courseName}</DialogTitle>
        <DialogDescription>
          Please confirm your details to enroll in this course.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="Your full name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="Your email address" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="studentId">Student ID</Label>
        <Input id="studentId" placeholder="Your student ID" />
      </div>
      <Button type="submit" className="w-full">Confirm Enrollment</Button>
    </form>
  );
}

export default function SmartCoursesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Smart Course Recommendations</h1>
          <p className="text-muted-foreground">AI-powered suggestions to expand your skills.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {smartCourses.map((course) => (
          <Dialog key={course.id}>
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-start space-x-3">
                  <BookOpen className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <span>{course.name}</span>
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center text-xs">
                    <User className="mr-2 h-3 w-3" />
                    {course.instructor}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground italic">
                  <Sparkles className="inline-block mr-2 h-4 w-4 text-yellow-500" />
                  {course.reason}
                </p>
              </CardContent>
              <CardFooter>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Enroll Now
                  </Button>
                </DialogTrigger>
              </CardFooter>
            </Card>
            <DialogContent>
              <EnrollmentForm courseName={course.name} />
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}