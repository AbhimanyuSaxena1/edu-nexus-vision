import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

const quizzes = [
  { id: 'QZ01', title: 'Week 8 Quiz', course: 'Data Structures', status: 'Published', submissions: 105 },
  { id: 'QZ02', title: 'Mid-term Assessment', course: 'Algorithms', status: 'Draft', submissions: 0 },
  { id: 'QZ03', title: 'OS Concepts', course: 'Operating Systems', status: 'Graded', submissions: 78 },
  { id: 'QZ04', title: 'Practice Quiz', course: 'Data Structures', status: 'Published', submissions: 92 },
];

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'outline' } = {
  Published: 'default',
  Draft: 'outline',
  Graded: 'secondary',
};

export default function QuizManagement() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground">Create, edit, and grade quizzes for your classes.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Quiz
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Quizzes</CardTitle>
          <CardDescription>A list of all quizzes you have created.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.title}</TableCell>
                  <TableCell>{quiz.course}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[quiz.status]}>{quiz.status}</Badge>
                  </TableCell>
                  <TableCell>{quiz.submissions}</TableCell>
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