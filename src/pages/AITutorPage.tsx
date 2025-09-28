import { useState, FormEvent, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrainCircuit, Send, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChatMessage = {
  role: 'user' | 'ai';
  content: string;
};

export default function AITutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  const userMessage: ChatMessage = { role: 'user', content: input };
  setMessages((prev) => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    const res = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: userMessage.content }),
    });
    const data = await res.json();

    const aiResponse: ChatMessage = { role: 'ai', content: data.answer };
    setMessages((prev) => [...prev, aiResponse]);
  } catch (error) {
    const aiResponse: ChatMessage = { role: 'ai', content: "⚠️ Error connecting to AI Tutor backend." };
    setMessages((prev) => [...prev, aiResponse]);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="container mx-auto p-6 flex flex-col h-full max-h-[calc(100vh-100px)]">
      <Card className="w-full max-w-3xl mx-auto flex flex-col flex-grow">
        <CardHeader className="text-center">
          <BrainCircuit className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">AI Tutor</CardTitle>
          <p className="text-muted-foreground">Your personal AI-powered learning assistant.</p>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 flex flex-col">
          <div className="flex-grow border rounded-lg p-4 bg-muted/50 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center">Ask me anything about your courses...</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={cn('flex items-start gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                  <div className={cn('p-3 rounded-lg max-w-lg', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background')}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && <User className="h-6 w-6 flex-shrink-0" />}
                </div>
              ))
            )}
             {isLoading && <div className="flex items-center gap-3"><Bot className="h-6 w-6 text-primary" /><div className="p-3 rounded-lg bg-background text-sm text-muted-foreground">Thinking...</div></div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input type="text" placeholder="Type your question here..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}