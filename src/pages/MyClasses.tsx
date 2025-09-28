import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, ArrowRight } from 'lucide-react';

const teacherClasses = [
  { id: 'CLS001', name: 'Data Structures', courseCode: 'CS203', students: 110, semester: 2 },
  { id: 'CLS002', name: 'Algorithms', courseCode: 'CS301', students: 95, semester: 3 },
  { id: 'CLS003', name: 'Operating Systems', courseCode: 'CS405', students: 80, semester: 4 },
];

export default function MyClasses() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Classes</h1>
      <p className="text-muted-foreground">An overview of classes you are teaching this semester.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teacherClasses.map((cls) => (
          <Card key={cls.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>{cls.name}</span>
              </CardTitle>
              <CardDescription>Course Code: {cls.courseCode} | Semester: {cls.semester}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                <span>{cls.students} students enrolled</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                View Class Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}