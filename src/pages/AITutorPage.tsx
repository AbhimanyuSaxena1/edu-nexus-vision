import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrainCircuit } from 'lucide-react';

export default function AITutorPage() {
  return (
    <div className="container mx-auto p-6 flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <BrainCircuit className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">AI Tutor</CardTitle>
          <p className="text-muted-foreground">Your personal AI-powered learning assistant.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 border rounded-lg p-4 bg-muted/50 overflow-y-auto">
            <p className="text-muted-foreground">Ask me anything about your courses...</p>
          </div>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type your question here..."
            />
            <Button>Ask</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}