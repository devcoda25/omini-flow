

'use client';

import Link from 'next/link';
import {
  Bell,
  Briefcase,
  LogOut,
  MessageCircle,
  Bot,
  Tags,
  FileUp,
  Trash2,
  PlusCircle,
  Inbox,
  Users,
  LineChart,
  Megaphone,
  FileText
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';
import { cn } from '@/lib/utils';
import { CreateFlowDialog } from '@/app/dashboard/components/CreateFlowDialog';
import { useEffect, useState } from 'react';

function NavLink({
  href,
  icon: Icon,
  children,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:bg-gray-200',
        isActive && 'bg-gray-200 font-bold'
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

export function AppShell({ children, user }: { children: React.ReactNode; user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const userEmail = user?.email || 'N/A';
  const emailInitial = userEmail.charAt(0).toUpperCase();

  if (!isClient) {
    // Render nothing on the server to avoid hydration mismatch
    return null;
  }
  
  const isFlowPage = pathname.startsWith('/flow/');
  const isInboxPage = pathname.startsWith('/inbox');

  if (isFlowPage || isInboxPage) {
    return (
        <div className="h-screen w-full flex flex-col">
            {children}
        </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gray-100/40 lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-6">
             <Link href="/business-profile" className="flex items-center gap-2 font-semibold">
                <Briefcase className="h-6 w-6 text-green-600" />
                <span>Omni-Channel</span>
             </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <NavLink href="/inbox" icon={Inbox} isActive={pathname === '/inbox'}>
                Team Inbox
              </NavLink>
              <NavLink href="/reports" icon={LineChart} isActive={pathname === '/reports'}>
                Reports
              </NavLink>
              <NavLink href="/broadcast" icon={Megaphone} isActive={pathname === '/broadcast'}>
                Broadcast
              </NavLink>
               <NavLink href="/templates" icon={FileText} isActive={pathname === '/templates'}>
                Message Templates
              </NavLink>
              <NavLink href="/contacts" icon={Users} isActive={pathname === '/contacts'}>
                Contacts
              </NavLink>
              <NavLink href="/business-profile" icon={Briefcase} isActive={pathname === '/business-profile'}>
                Business profile
              </NavLink>
              <NavLink href="/dashboard" icon={Bot} isActive={pathname.startsWith('/dashboard')}>
                Flow Builder
              </NavLink>
               <NavLink href="#" icon={Tags} isActive={pathname.startsWith('/tags')}>
                Tags and Attributes
              </NavLink>
            </nav>
          </div>
          <div className='p-4'>
             <CreateFlowDialog onFlowCreated={() => router.refresh()}>
                <Button className='w-full bg-green-600 hover:bg-green-700 text-white'>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Flow
                </Button>
            </CreateFlowDialog>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-gray-100/40 px-6">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link href="/inbox" className={cn("flex items-center gap-2 text-lg font-semibold md:text-base", pathname.startsWith('/inbox') ? "text-gray-950" : "")}>
                <MessageCircle className="h-6 w-6" />
                <span>Team Inbox</span>
            </Link>
            <Link href="/broadcast" className={cn("transition-colors hover:text-gray-950", pathname.startsWith('/broadcast') ? "text-gray-950 font-semibold" : "text-gray-500")}>
                Broadcast
            </Link>
            <Link href="/dashboard" className={cn("transition-colors hover:text-gray-950", pathname.startsWith('/dashboard') || pathname.startsWith('/flow') ? "text-gray-950 font-semibold" : "text-gray-500")}>
                Chatbots
            </Link>
             <Link href="/contacts" className={cn("transition-colors hover:text-gray-950", pathname.startsWith('/contacts') ? "text-gray-950 font-semibold" : "text-gray-500")}>
                Contacts
            </Link>
             <Link href="/reports" className={cn("transition-colors hover:text-gray-950", pathname.startsWith('/reports') ? "text-gray-950 font-semibold" : "text-gray-500")}>
                Reports
            </Link>
          </nav>
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className='ml-auto flex-1 sm:flex-initial'>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Quick start</span>
                    <Progress value={50} className="w-32 h-2" />
                    <span className="text-sm text-gray-500">2/4</span>
                </div>
            </div>
             <Button className="bg-green-600 hover:bg-green-700 text-white">Book a demo</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Toggle notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>You have a new message.</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/32x32.png" alt="@shadcn" data-ai-hint="male avatar" />
                    <AvatarFallback>{emailInitial}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>{userEmail}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
