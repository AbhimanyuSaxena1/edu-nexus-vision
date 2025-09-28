import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Zap, Settings, FileDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function TimetableGeneration() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Generation</h1>
          <p className="text-muted-foreground">AI-powered scheduling and optimization.</p>
        </div>
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Generate New Timetable
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Timetable Status</CardTitle>
            <CardDescription>Fall 2024 Semester</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Optimization Score</span>
                <span>98%</span>
              </div>
              <Progress value={98} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Resolved Conflicts</span>
                <span>12</span>
              </div>
              <Progress value={100} className="[&>*]:bg-green-500" />
            </div>
            <div className="flex pt-4 space-x-2">
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Adjust Parameters
              </Button>
              <Button className="w-full">
                <FileDown className="mr-2 h-4 w-4" />
                Export Timetable
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation History</CardTitle>
            <CardDescription>Recent timetable generation logs.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>No recent generation history.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}