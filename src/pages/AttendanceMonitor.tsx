import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Percent, AlertTriangle } from 'lucide-react';

const summary = [
  { title: 'Average Attendance', value: '92%', change: '+1.5% this week', icon: TrendingUp },
  { title: 'Lowest Class Attendance', value: '85% in CS301', change: 'Algorithms', icon: TrendingDown },
  { title: 'Students at Risk', value: '8', change: 'Below 75% attendance', icon: AlertTriangle },
  { title: 'Total Classes Marked', value: '48', change: 'This semester', icon: Percent },
];

const recentSessions = [
  { class: 'Data Structures', date: '2024-10-28', attendance: '95%', marked: 'AI' },
  { class: 'Algorithms', date: '2024-10-28', attendance: '88%', marked: 'Manual' },
  { class: 'Operating Systems', date: '2024-10-27', attendance: '98%', marked: 'AI' },
  { class: 'Data Structures', date: '2024-10-26', attendance: '91%', marked: 'AI' },
];

export default function AttendanceMonitor() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Attendance Monitor</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summary.map((stat) => (
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
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Attendance records from your recent classes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Marked By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{session.class}</TableCell>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>{session.attendance}</TableCell>
                  <TableCell>
                    <Badge variant={session.marked === 'AI' ? 'default' : 'outline'}>{session.marked}</Badge>
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