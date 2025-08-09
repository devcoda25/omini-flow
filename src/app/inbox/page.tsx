

'use server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ChatView } from './components/chat-view';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ConversationList } from './components/conversation-list';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { conversation_id?: string };
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }
  
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return <div>Error loading conversations.</div>;
  }

  const selectedConversationId = searchParams.conversation_id || conversations?.[0]?.id;

  return (
    <div className="h-full w-full flex flex-col">
       <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
          <h1 className="text-xl font-semibold">Team Inbox</h1>
      </header>
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
            <ConversationList conversations={conversations} selectedConversationId={selectedConversationId} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          {selectedConversationId ? (
            <ChatView conversationId={selectedConversationId} user={session.user} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>Select a conversation to start chatting.</p>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
