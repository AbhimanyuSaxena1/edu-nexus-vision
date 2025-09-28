import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

const attendanceSummary = [
  { title: 'Overall Attendance', value: '91%', change: '+2.1% this month', icon: TrendingUp },
  { title: 'Classes Attended', value: '128', change: 'out of 140', icon: CheckCircle },
  { title: 'Classes Missed', value: '12', change: '3 this week', icon: XCircle },
  { title: 'Lowest Attendance', value: '85% in IT402', change: 'Network Security', icon: TrendingDown },
];

const recentRecords = [
  { date: '2024-10-28', course: 'Advanced Algorithms', status: 'Present', time: '10:00 AM' },
  { date: '2024-10-28', course: 'Network Security', status: 'Present', time: '02:00 PM' },
  { date: '2024-10-27', course: 'Data Visualization', status: 'Absent', time: '11:00 AM' },
  { date: '2024-10-26', course: 'Advanced Algorithms', status: 'Present', time: '10:00 AM' },
];

export default function AttendancePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Attendance</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {attendanceSummary.map((stat) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your attendance for the last few classes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRecords.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell className="font-medium">{record.course}</TableCell>
                  <TableCell>{record.time}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>{record.status}</Badge>
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