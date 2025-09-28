import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, BarChart3, TrendingUp } from 'lucide-react';

const departmentStats = [
  { title: 'Total Students', value: '1,247', change: '+12%', icon: Users },
  { title: 'Faculty Members', value: '38', change: '2 new hires', icon: Users },
  { title: 'Active Courses', value: '42', change: 'Across 8 semesters', icon: BookOpen },
  { title: 'Avg. Attendance', value: '89.3%', change: '+3.2% this month', icon: TrendingUp },
];

const courses = [
  { code: 'CS101', name: 'Introduction to Computer Science', semester: 1, students: 120, teacher: 'Dr. Smith' },
  { code: 'CS203', name: 'Data Structures', semester: 2, students: 110, teacher: 'Dr. Jones' },
  { code: 'CS301', name: 'Algorithms', semester: 3, students: 95, teacher: 'Dr. Wilson' },
  { code: 'CS405', name: 'Operating Systems', semester: 4, students: 80, teacher: 'Dr. Brown' },
];

export default function DepartmentOverview() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Department Overview</h1>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {departmentStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Courses</CardTitle>
          <CardDescription>A list of all active courses in the department.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Enrolled Students</TableHead>
                <TableHead>Instructor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.code}>
                  <TableCell>
                    <Badge variant="outline">{course.code}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>{course.students}</TableCell>
                  <TableCell>{course.teacher}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}