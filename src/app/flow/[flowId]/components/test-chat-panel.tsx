
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { executeFlow, type ChatState } from '../actions';
import { Bot } from 'lucide-react';

interface TestChatPanelProps {
  flowId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function TestChatPanel({ flowId, isOpen, onOpenChange }: TestChatPanelProps) {
  const [chatState, setChatState] = useState<ChatState>({ messages: [], currentNodeId: '' });
  const [userInput, setUserInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [chatState.messages]);

  useEffect(() => {
    if (isOpen) {
        // Start the flow when the panel is opened
        startTransition(async () => {
             const initialState = { messages: [], currentNodeId: '' };
             const result = await executeFlow(flowId, initialState, null);
             setChatState(result);
        });
    } else {
        // Reset chat when panel is closed
        setChatState({ messages: [], currentNodeId: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, flowId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    startTransition(async () => {
      const result = await executeFlow(flowId, chatState, userInput);
      setChatState(result);
      setUserInput('');
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Test Chatbot</SheetTitle>
          <SheetDescription>
            Interact with your chatbot flow in real-time.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {chatState.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-start gap-3',
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.sender === 'bot' && (
                    <Avatar className="h-8 w-8 bg-green-600 text-white flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                    </Avatar>
                  )}
                   <div
                        className={cn(
                        'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 text-sm',
                        msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'
                        )}
                    >
                        <p>{msg.text}</p>
                    </div>

                  {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://placehold.co/32x32.png" alt="User" data-ai-hint="user avatar" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isPending && chatState.messages.length > 0 && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8 bg-green-600 text-white flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                    </Avatar>
                    <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2 text-sm rounded-bl-none">
                        <div className="flex items-center space-x-1">
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="p-4 border-t bg-white">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isPending}
              />
              <Button type="submit" size="icon" className="bg-green-600 hover:bg-green-700 text-white" disabled={isPending}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
