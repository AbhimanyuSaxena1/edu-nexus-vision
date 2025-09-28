import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, TrendingUp, BookOpen, Users } from 'lucide-react';

const kpis = [
  { title: 'Average GPA', value: '3.42', change: '+0.1 this semester', icon: TrendingUp },
  { title: 'Pass Rate', value: '91%', change: '-1.2% vs last year', icon: BookOpen },
  { title: 'Student Engagement Score', value: '8.2/10', change: '+0.5 this month', icon: Users },
  { title: 'Faculty Performance Rating', value: '4.5/5', change: 'Stable', icon: Users },
];

export default function AcademicAnalytics() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Academic Analytics</h1>

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
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Distribution of grades across all courses.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            <BarChart className="h-12 w-12 mb-2" />
            <p>Chart coming soon...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance vs. Performance</CardTitle>
            <CardDescription>Correlation between student attendance and final grades.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-2" />
            <p>Chart coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}