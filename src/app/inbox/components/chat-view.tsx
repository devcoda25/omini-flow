
'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, StickyNote, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';

type Message = {
  id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  is_from_contact: boolean;
  sender_wuid: string;
};

type Note = {
    id: string;
    conversation_id: string;
    content: string;
    created_at: string;
    author_id: string;
    author_email: string;
};

const NoteItem = ({ note }: { note: Note }) => {
    const [relativeTime, setRelativeTime] = useState('');

    useEffect(() => {
        setRelativeTime(formatDistanceToNow(new Date(note.created_at), { addSuffix: true }));
    }, [note.created_at]);

    return (
        <div key={note.id} className="p-3 bg-yellow-100/50 rounded-lg border border-yellow-200">
           <p className="text-sm text-gray-800">{note.content}</p>
           <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500">
                    By {note.author_email}
                </p>
                <time className="text-xs text-gray-500">
                    {relativeTime}
                </time>
           </div>
        </div>
    );
}


export function ChatView({ conversationId, user }: { conversationId: string; user: User }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const supabase = createClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
    };
    
    const fetchNotes = async () => {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false }); // Show newest notes first

        if (error) {
            console.error('Error fetching notes:', error);
        } else {
            setNotes(data || []);
        }
    }

    fetchMessages();
    fetchNotes();
  }, [conversationId, supabase]);

  useEffect(() => {
    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: RealtimePostgresChangesPayload<Message>) => {
            if (payload.new) {
                setMessages((prevMessages) => [...prevMessages, payload.new]);
            }
        }
      )
      .subscribe();

    const notesChannel = supabase
        .channel(`notes:${conversationId}`)
        .on<Note>(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notes', filter: `conversation_id=eq.${conversationId}` },
            (payload: RealtimePostgresChangesPayload<Note>) => {
                if(payload.new) {
                    setNotes((prevNotes) => [payload.new, ...prevNotes]);
                }
            }
        ).subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notesChannel);
    };
  }, [conversationId, supabase]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Here you would call the WATI API to send the message.
    // For now, we'll just add it to our DB to simulate the flow.
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: newMessage,
        is_from_contact: false, // Messages from agent are not from contact
        sender_wuid: user.id, // Using user ID as sender for agent messages
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
    } else if (data) {
        // The realtime subscription will add the message to the state
        setNewMessage('');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const { error } = await supabase
        .from('notes')
        .insert({
            conversation_id: conversationId,
            content: newNote,
            author_id: user.id,
            author_email: user.email,
        });

    if (error) {
        console.error('Error adding note:', error);
    } else {
        setNewNote('');
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="font-semibold">Chat with +{conversationId}</div>
      </header>
      <Tabs defaultValue="chat" className="flex-grow flex flex-col overflow-hidden">
        <TabsContent value="chat" className="flex-grow flex flex-col p-0 m-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                {messages.map((msg) => (
                    <div
                    key={msg.id}
                    className={cn(
                        'flex items-end gap-2',
                        msg.is_from_contact ? 'justify-start' : 'justify-end'
                    )}
                    >
                    {msg.is_from_contact && (
                        <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/32x32.png" alt="Contact" data-ai-hint="user avatar" />
                        <AvatarFallback>{msg.sender_wuid.slice(2, 4).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={cn(
                        'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2',
                        msg.is_from_contact
                            ? 'bg-gray-200 text-gray-900'
                            : 'bg-green-600 text-white'
                        )}
                    >
                        <p className="text-sm">{msg.content}</p>
                        <time className="text-xs opacity-70 block text-right mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </time>
                    </div>
                    {!msg.is_from_contact && (
                        <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/32x32.png" alt="Agent" data-ai-hint="agent avatar" />
                        <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}
                </div>
            </ScrollArea>
             <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Smile className="h-5 w-5" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" className="bg-green-600 hover:bg-green-700 text-white">
                        <Send className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </TabsContent>
        <TabsContent value="notes" className="flex-grow flex flex-col p-0 m-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {notes.map((note) => (
                        <NoteItem key={note.id} note={note} />
                    ))}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                 <form onSubmit={handleAddNote} className="flex items-start gap-2">
                    <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add an internal note..."
                        className="flex-1"
                        rows={2}
                    />
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                        Add Note
                    </Button>
                </form>
            </div>
        </TabsContent>
        <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="chat"><MessageSquare className='mr-2 h-4 w-4' /> Chat</TabsTrigger>
            <TabsTrigger value="notes"><StickyNote className='mr-2 h-4 w-4' /> Notes</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
