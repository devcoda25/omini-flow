
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type Conversation = {
    id: string;
    contact_wuid: string;
    last_message_at: string;
};

type ConversationListItemProps = {
    conv: Conversation;
    isSelected: boolean;
};

const ConversationListItem = ({ conv, isSelected }: ConversationListItemProps) => {
    const [relativeTime, setRelativeTime] = useState('');

    useEffect(() => {
        setRelativeTime(formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }));
    }, [conv.last_message_at]);

    return (
        <Link
            href={`/inbox?conversation_id=${conv.id}`}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:bg-gray-200',
                isSelected && 'bg-gray-200 font-bold'
            )}
        >
            <Avatar className="h-10 w-10">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
                <AvatarFallback>{conv.contact_wuid.slice(2, 4).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
                <div className="font-semibold">+{conv.contact_wuid}</div>
                <p className="text-xs text-gray-500 truncate">
                    Last message...
                </p>
            </div>
            <time className="text-xs text-gray-500">
                {relativeTime}
            </time>
        </Link>
    );
};

export const ConversationList = ({ conversations, selectedConversationId }: { conversations: Conversation[], selectedConversationId: string | undefined }) => {
    return (
        <div className="flex h-full flex-col">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Chats</h2>
            </div>
            <ScrollArea className="flex-1">
                <nav className="flex flex-col gap-1 p-2">
                    {conversations.map((conv) => (
                        <ConversationListItem
                            key={conv.id}
                            conv={conv}
                            isSelected={selectedConversationId === conv.id}
                        />
                    ))}
                </nav>
            </ScrollArea>
        </div>
    );
};
