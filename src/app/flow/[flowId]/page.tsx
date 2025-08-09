
'use client';

import { FlowEditor } from '@/components/flow-editor';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useEffect, useState, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Flow } from '@/app/dashboard/page';
import { useRouter } from 'next/navigation';
import { TestChatPanel } from './components/test-chat-panel';
import { useToast } from '@/hooks/use-toast';


export default function FlowPage({ params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = use(params);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchFlow = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data, error } = await supabase
            .from('flows')
            .select('id, name')
            .eq('id', flowId)
            .eq('user_id', user.id)
            .single();

        if (error || !data) {
            console.error('Flow not found or error fetching it');
            router.push('/dashboard');
        } else {
            setFlow(data as Flow);
        }
    }
    fetchFlow();
  }, [flowId, supabase, router]);

  const handleSave = () => {
    // The flow is saved automatically in the background via the store.
    // This button just provides user feedback.
    toast({
        title: "Success",
        description: "Flow saved successfully."
    })
  }

  if (!flow) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }
  
  return (
    <>
       <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">{flow.name}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsTestPanelOpen(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Test Chatbot
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>
                    Save Chatbot
                </Button>
            </div>
        </header>
        <div className="flex-grow overflow-hidden">
            <FlowEditor flowId={flowId} />
        </div>
        <TestChatPanel 
            flowId={flowId}
            isOpen={isTestPanelOpen}
            onOpenChange={setIsTestPanelOpen}
        />
    </>
    );
}
