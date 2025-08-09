'use client';

import React from 'react';
import { Bot, LayoutDashboard, Undo, Redo, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import useFlowStore from '@/store/flow-store';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';


export function Header() {
  const { applyLayout } = useFlowStore();
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 shrink-0">
      <div className="flex items-center gap-4">
        <Bot className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold font-headline">FlowCraft</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={applyLayout}>
          <LayoutDashboard className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
