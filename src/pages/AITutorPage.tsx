// AITutorPage.tsx
"use client";

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrainCircuit, Send, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
// Note: To properly render Markdown lists, headers, etc., you would typically install 
// a library like 'react-markdown' (npm install react-markdown) and use it here.

type ChatMessage = {
  role: 'user' | 'ai';
  content: string;
};

// Function to safely extract and format the answer from various possible backend response structures
const safelyExtractAnswer = (data: any): string => {
    // 1. Check for the final formatted string (expected structure from Python endpoint)
    if (data && data.answer && typeof data.answer === 'string') {
        return data.answer;
    }

    // 2. Check for the wrapped raw response structure (like the one you provided in the prompt)
    const rawResponse = data?.response || data;

    if (rawResponse && rawResponse.explanation) {
        let content = `**${rawResponse.explanation}**\n\n`;
        
        // Add examples
        if (rawResponse.examples && Array.isArray(rawResponse.examples)) {
            content += "Examples:\n";
            content += rawResponse.examples.map((ex: string) => `- ${ex}`).join('\n');
            content += '\n\n';
        }
        
        // Add understanding check
        if (rawResponse.understanding_check) {
            content += `----\n${rawResponse.understanding_check}`;
        }
        
        return content.trim();
    }

    // 3. Fallback to stringified content if structure is totally unexpected
    return "Error: Agent response received in an unexpected format. Please check the backend logs.";
};


export default function AITutorPage() {
  // FIX: Removed extra parentheses around the initial array state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Set an initial welcome message based on the response you provided
  useEffect(() => {
    if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
            role: 'ai',
            content: safelyExtractAnswer({
                explanation: "Hello! I'm an AI tutor ready to explain topics in simple, beginner-friendly language.",
                examples: [
                    "If you want to learn about photosynthesis, I can break down how plants turn sunlight into food.",
                    "If you're curious about how the internet works, I can describe the basic flow of data between computers."
                ],
                understanding_check: "Does that make sense? What topic would you like me to explain for you?"
            })
        };
        // Use a functional update to safely initialize state only once
        setMessages(prevMessages => prevMessages.length === 0 ? [welcomeMessage] : prevMessages);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send 'topic' field to match the backend Pydantic model
        body: JSON.stringify({ topic: userMessage.content }),
      });
      
      const data = await res.json();
      
      // Check for backend-level errors (like 500)
      if (res.status !== 200) {
        const detail = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : "Unknown server error.";
        throw new Error(`Backend Error: ${detail}`);
      }

      // Use the safe function to extract and format the content
      const aiResponseContent = safelyExtractAnswer(data);

      const aiResponse: ChatMessage = { role: 'ai', content: aiResponseContent };
      setMessages((prev) => [...prev, aiResponse]);
      
    } catch (error) {
      console.error("Fetch/Processing Error:", error);
      const aiResponse: ChatMessage = { role: 'ai', content: `⚠️ Error: Could not get a response from the AI Tutor backend. Details: ${(error as Error).message}` };
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
                  <div className={cn('p-3 rounded-lg max-w-lg whitespace-pre-wrap', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background')}>
                    {/* Using whitespace-pre-wrap to respect newlines and basic formatting */}
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