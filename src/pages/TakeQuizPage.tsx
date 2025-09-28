import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Clock, CheckCircle, Send } from 'lucide-react';

// Mock data for a quiz
const questions = [
  {
    id: 'q1',
    text: 'Which data structure uses LIFO (Last In, First Out) principle?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctAnswer: 'Stack',
  },
  {
    id: 'q2',
    text: 'What is the time complexity of searching an element in a hash table in the average case?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 'O(1)',
  },
  {
    id: 'q3',
    text: 'Which sorting algorithm has the worst-case time complexity of O(n^2)?',
    options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Bubble Sort'],
    correctAnswer: 'Bubble Sort',
  },
  {
    id: 'q4',
    text: 'In object-oriented programming, what does "encapsulation" refer to?',
    options: [
      'The ability of an object to take on many forms.',
      'The bundling of data with the methods that operate on that data.',
      'The process of creating new classes from existing classes.',
      'The ability to hide implementation details from the user.',
    ],
    correctAnswer: 'The bundling of data with the methods that operate on that data.',
  },
  {
    id: 'q5',
    text: 'What is the primary purpose of a "foreign key" in a relational database?',
    options: ['To uniquely identify a record in a table.', 'To link two tables together.', 'To speed up data retrieval.', 'To enforce data integrity rules within a single table.'],
    correctAnswer: 'To link two tables together.',
  },
];

const quizData = {
  id: 1,
  title: 'Week 8 Quiz',
  course: 'Advanced Algorithms',
  duration: 120, // in minutes
  questions: questions,
};

export default function TakeQuizPage() {
  const { quizId } = useParams(); // In a real app, you'd fetch quiz data based on this ID
  const navigate = useNavigate();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(quizData.duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (isSubmitted) return;

    let correctAnswers = 0;
    quizData.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctAnswers++;
      }
    });

    const finalScore = (correctAnswers / quizData.questions.length) * 100;
    setScore(finalScore);
    setIsSubmitted(true);

    toast({
      title: "Quiz Submitted!",
      description: `You scored ${finalScore.toFixed(2)}%.`,
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4">Quiz Completed!</CardTitle>
            <CardDescription>You have successfully submitted the quiz.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{score.toFixed(2)}%</p>
            <p className="text-muted-foreground">Your Score</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{quizData.title}</CardTitle>
              <CardDescription>{quizData.course}</CardDescription>
            </div>
            <div className="flex items-center space-x-2 text-lg font-medium text-primary">
              <Clock className="h-5 w-5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {quizData.questions.map((q, index) => (
            <div key={q.id}>
              <p className="font-medium mb-4">{index + 1}. {q.text}</p>
              <RadioGroup value={answers[q.id]} onValueChange={(value) => handleAnswerChange(q.id, value)}>
                {q.options.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                    <RadioGroupItem value={option} id={`${q.id}-${i}`} />
                    <Label htmlFor={`${q.id}-${i}`} className="w-full cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full md:w-auto ml-auto">
            <Send className="mr-2 h-4 w-4" />
            Submit Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}