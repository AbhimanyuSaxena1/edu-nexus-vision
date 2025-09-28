import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileDown, Filter } from 'lucide-react';

const reports = [
  { course: 'Advanced Algorithms', code: 'CS301', avgAttendance: '92%', belowThreshold: 5, lastUpdated: '2 hours ago' },
  { course: 'Network Security', code: 'IT402', avgAttendance: '85%', belowThreshold: 12, lastUpdated: '3 hours ago' },
  { course: 'Data Visualization', code: 'DS202', avgAttendance: '95%', belowThreshold: 2, lastUpdated: '1 day ago' },
  { course: 'Operating Systems', code: 'CS405', avgAttendance: '88%', belowThreshold: 8, lastUpdated: '1 day ago' },
];

export default function AttendanceReports() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-muted-foreground">View and export attendance data for all courses.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter Reports
          </Button>
          <Button>
            <FileDown className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Attendance Summary</CardTitle>
          <CardDescription>Overview of attendance records across the department.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Average Attendance</TableHead>
                <TableHead>Students Below Threshold</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.code}>
                  <TableCell>
                    <div className="font-medium">{report.course}</div>
                    <div className="text-sm text-muted-foreground">{report.code}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={parseFloat(report.avgAttendance) > 90 ? 'default' : 'secondary'}>
                      {report.avgAttendance}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.belowThreshold} students</TableCell>
                  <TableCell>{report.lastUpdated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}