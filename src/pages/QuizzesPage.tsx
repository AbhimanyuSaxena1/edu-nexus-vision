import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const quizzes = [
  { id: 1, title: 'Week 8 Quiz', course: 'Advanced Algorithms', status: 'Upcoming', due: '3 days', type: 'Weekly' },
  { id: 2, title: 'Mid-term Assessment', course: 'Network Security', status: 'Completed', score: '88/100', type: 'Assessment' },
  { id: 3, title: 'Data Structures Practice', course: 'Data Visualization', status: 'Practice', due: 'N/A', type: 'Practice' },
  { id: 4, title: 'Week 7 Quiz', course: 'Advanced Algorithms', status: 'Missed', due: '2 days ago', type: 'Weekly' },
];

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Upcoming: 'default',
  Completed: 'secondary',
  Practice: 'outline',
  Missed: 'destructive',
};

export default function QuizzesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Quizzes & Assessments</h1>
      <p className="text-muted-foreground">Stay on top of your upcoming quizzes and review past results.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{quiz.title}</CardTitle>
                <Badge variant={statusVariantMap[quiz.status]}>{quiz.status}</Badge>
              </div>
              <CardDescription>{quiz.course}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <ClipboardList className="mr-2 h-4 w-4" />
                <span>Type: {quiz.type}</span>
              </div>
              {quiz.score ? (
                <div className="text-lg font-bold text-primary">{quiz.score}</div>
              ) : (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Due in: {quiz.due}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {quiz.status === 'Upcoming' && (
                <Button asChild className="w-full">
                  <Link to={`/quiz/${quiz.id}`}>Start Quiz</Link>
                </Button>
              )}
              {quiz.status === 'Practice' && <Button variant="secondary" className="w-full">Start Practice</Button>}
              {quiz.status === 'Completed' && <Button variant="outline" className="w-full">Review Answers</Button>}
              {quiz.status === 'Missed' && <Button variant="ghost" className="w-full" disabled><HelpCircle className="mr-2 h-4 w-4" />Request Extension</Button>}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}