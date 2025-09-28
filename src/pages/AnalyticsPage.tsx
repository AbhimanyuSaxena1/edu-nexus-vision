import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ClipboardCheck, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const kpis = [
  { title: 'Average Quiz Score', value: '82%', change: '+5% this month', icon: ClipboardCheck },
  { title: 'Top Performing Class', value: 'Data Structures', change: '88% avg. score', icon: TrendingUp },
  { title: 'Most Engaged Students', value: '15', change: '>95% attendance & quiz scores', icon: Users },
  { title: 'Lowest Attendance', value: 'Algorithms', change: '85% avg. attendance', icon: TrendingDown },
];

const quizScoreData = [
  { name: 'Data Structures', score: 88 },
  { name: 'Algorithms', score: 76 },
  { name: 'Operating Systems', score: 82 },
  { name: 'Machine Learning', score: 91 },
];

const attendanceData = [
  { name: 'Data Structures', attendance: 95 },
  { name: 'Algorithms', attendance: 85 },
  { name: 'Operating Systems', attendance: 92 },
  { name: 'Machine Learning', attendance: 98 },
];

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Performance Analytics</h1>
      <p className="text-muted-foreground">Insights into your classes and student performance.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Score Distribution</CardTitle>
            <CardDescription>Average scores across your classes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quizScoreData.map((classData) => (
              <div key={classData.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{classData.name}</span>
                  <span className="font-semibold">{classData.score}%</span>
                </div>
                <Progress value={classData.score} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Average attendance for all classes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendanceData.map((classData) => (
              <div key={classData.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{classData.name}</span>
                  <span className="font-semibold">{classData.attendance}%</span>
                </div>
                <Progress value={classData.attendance} className="[&>*]:bg-green-500" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}