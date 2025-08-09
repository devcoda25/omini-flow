
import { createClient } from '@/utils/supabase/server';
import { ReportsClient } from './components/reports-client';


async function getAnalyticsData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'User not authenticated' };
    }

    // 1. Total Conversations
    const { count: totalConversations, error: convError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

    // 2. First Response Time (a more complex query)
    // This is a simplified example. A real implementation would be more robust.
    const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, created_at, is_from_contact')
        .order('created_at', { ascending: true });

    if (convError || msgError) {
        console.error(convError || msgError);
        return { error: 'Failed to fetch analytics data' };
    }

    const conversationsMap = new Map<string, { firstContact: Date | null, firstAgentReply: Date | null }>();

    for (const message of messages || []) {
        if (!conversationsMap.has(message.conversation_id)) {
            conversationsMap.set(message.conversation_id, { firstContact: null, firstAgentReply: null });
        }

        const conv = conversationsMap.get(message.conversation_id)!;

        if (message.is_from_contact && !conv.firstContact) {
            conv.firstContact = new Date(message.created_at);
        } else if (!message.is_from_contact && conv.firstContact && !conv.firstAgentReply) {
            conv.firstAgentReply = new Date(message.created_at);
        }
    }

    let totalResponseTime = 0;
    let respondedConversations = 0;

    for (const conv of conversationsMap.values()) {
        if (conv.firstContact && conv.firstAgentReply) {
            totalResponseTime += conv.firstAgentReply.getTime() - conv.firstContact.getTime();
            respondedConversations++;
        }
    }
    
    const avgResponseTimeMs = respondedConversations > 0 ? totalResponseTime / respondedConversations : 0;
    const avgResponseTimeMinutes = (avgResponseTimeMs / (1000 * 60)).toFixed(2);


    const metrics = [
        { name: 'Total Conversations', value: totalConversations ?? 0 },
        { name: 'Avg. First Response Time', value: `${avgResponseTimeMinutes} mins` },
        { name: 'Total Messages Sent', value: messages?.length ?? 0 },
        { name: 'Resolved Conversations', value: 'N/A' }, // Placeholder
    ];
    
    // Data for charts
    const dailyActivity = [
        { date: '2023-01-01', messages: 40, conversations: 24 },
        { date: '2023-01-02', messages: 30, conversations: 13 },
        { date: '2023-01-03', messages: 20, conversations: 98 },
        { date: '2023-01-04', messages: 27, conversations: 39 },
        { date: '2023-01-05', messages: 18, conversations: 48 },
        { date: '2023-01-06', messages: 23, conversations: 38 },
        { date: '2023-01-07', messages: 34, conversations: 43 },
    ];

    return { metrics, dailyActivity };
}


export default async function ReportsPage() {
    const { metrics, dailyActivity, error } = await getAnalyticsData();

    if (error || !metrics || !dailyActivity) {
        return <div className="p-8">Error loading analytics data. {error}</div>;
    }

    return <ReportsClient metrics={metrics} dailyActivity={dailyActivity} />;
}
