'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreateFlowDialog } from '../dashboard/components/CreateFlowDialog';

// This page will now handle the creation of a new flow and redirect to it.
export default async function FlowRedirectPage() {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // The creation is now handled by a user interaction (dialog) on the dashboard,
  // so this page can be a fallback or a prompt to create a flow.
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Select a flow or create a new one</h2>
      <p className="text-muted-foreground">
        Go to your dashboard to manage your flows.
      </p>
      <div className="flex gap-4">
        <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
        </Button>
        <CreateFlowDialog>
            <Button variant="outline">Create New Flow</Button>
        </CreateFlowDialog>
      </div>
    </div>
  );
}
