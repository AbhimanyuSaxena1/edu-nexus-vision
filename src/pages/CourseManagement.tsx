import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

const courses = [
  { id: 'C001', code: 'CS301', name: 'Advanced Algorithms', department: 'Computer Science', credits: 3, instructor: 'Prof. Virendra' },
  { id: 'C002', code: 'IT402', name: 'Network Security', department: 'Information Technology', credits: 4, instructor: 'Prof. Sakshi' },
  { id: 'C003', code: 'DS202', name: 'Data Visualization', department: 'Data Science', credits: 3, instructor: 'Dr. PK Sharma' },
  { id: 'C004', code: 'CS405', name: 'Operating Systems', department: 'Computer Science', credits: 4, instructor: 'Dr. Sandeep' },
];

export default function CourseManagement() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage department courses.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Catalog</CardTitle>
          <CardDescription>List of all courses offered by the department.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Assigned Instructor</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <Badge variant="outline">{course.code}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>{course.instructor}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}