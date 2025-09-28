import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Percent } from 'lucide-react';

const enrolledCourses = [
  {
    id: 'C001',
    name: 'Advanced Algorithms',
    instructor: 'Atish Mishra',
    progress: 75,
    nextClass: 'Tomorrow, 10:00 AM',
    attendance: 92,
  },
  {
    id: 'C002',
    name: 'Network Security',
    instructor: 'Ahishek Shingh Rathore',
    progress: 45,
    nextClass: 'Today, 2:00 PM',
    attendance: 85,
  },
  {
    id: 'C003',
    name: 'Data Visualization',
    instructor: 'Pritesh Kumar Jain',
    progress: 90,
    nextClass: 'Wednesday, 11:15 AM',
    attendance: 98,
  },
   {
    id: 'C004',
    name: 'Image Processing',
    instructor: 'Vijay Chouhan',
    progress: 90,
    nextClass: 'Wednesday, 12:45 AM',
    attendance: 98,
  },
   {
    id: 'C003',
    name: 'Networking',
    instructor: 'Virendra Dani',
    progress: 33,
    nextClass: 'Tommorrow, 11:00 AM',
    attendance: 98,
  },
];

export default function MyCourses() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Courses</h1>
      <p className="text-muted-foreground">An overview of your enrolled courses and progress.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrolledCourses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>{course.name}</span>
              </CardTitle>
              <CardDescription>Instructor: {course.instructor}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} />
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Percent className="mr-2 h-4 w-4" />
                <span>Attendance: {course.attendance}%</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                <span>Next Class: {course.nextClass}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}