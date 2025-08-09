

'use client';

import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteFlowAction, renameFlowAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CreateFlowDialog } from './components/CreateFlowDialog';

export type Flow = {
  id: string;
  name: string;
  created_at: string;
};

// Combining all components into a single file for simplicity in this context

function RenameFlowDialog({ flowId, currentName, onFlowRenamed }: { flowId: string, currentName: string, onFlowRenamed: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRenameFlow = async () => {
    if (!name || name === currentName) {
      setOpen(false);
      return;
    };
    startTransition(async () => {
      const result = await renameFlowAction(flowId, name);
      if (result?.error) {
        toast({
            title: "Error",
            description: result.error,
            variant: "destructive"
        })
      } else {
        toast({
            title: "Success",
            description: "Flow renamed successfully."
        })
        setOpen(false);
        onFlowRenamed();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
            Rename
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Flow</DialogTitle>
          <DialogDescription>
            Enter a new name for your flow `{currentName}`.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            type="submit"
            onClick={handleRenameFlow}
            disabled={isPending || !name || name === currentName}
          >
            {isPending ? 'Renaming...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchFlows = async (userId: string) => {
      const { data: userFlows, error: flowsError } = await supabase
        .from('flows')
        .select('id, name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (flowsError) {
        console.error('Error fetching flows:', flowsError);
      } else {
        setFlows(userFlows || []);
      }
      setLoading(false);
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchFlows(user.id);
      } else {
        router.push('/login');
      }
    };
    getUser();
  }, [supabase, router]);
  
  const hasFlows = flows && flows.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <header className="flex h-14 items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Flow Dashboard</h2>
         <CreateFlowDialog onFlowCreated={() => user && fetchFlows(user.id)}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Flow
            </Button>
         </CreateFlowDialog>
      </header>
        
        {hasFlows ? (
            <Card>
                <CardHeader>
                    <CardTitle>Your Flows</CardTitle>
                    <CardDescription>Manage your existing flows or create a new one.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {flows.map((flow) => (
                                <TableRow key={flow.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/flow/${flow.id}`} className="hover:underline">{flow.name}</Link>
                                    </TableCell>
                                    <TableCell>{new Date(flow.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/flow/${flow.id}`}>Edit</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                  <RenameFlowDialog flowId={flow.id} currentName={flow.name} onFlowRenamed={() => user && fetchFlows(user.id)} />
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <form action={deleteFlowAction} className="w-full">
                                                    <input type="hidden" name="flowId" value={flow.id} />
                                                    <button
                                                        type="submit"
                                                        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-destructive/10 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </form>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ) : (
          <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-6 rounded-xl border border-dashed bg-card/50">
              <div className="text-center">
                  <h3 className="text-2xl font-bold tracking-tight">You have no flows</h3>
                  <p className="text-muted-foreground">Get started by creating a new flow.</p>
              </div>
               <CreateFlowDialog onFlowCreated={() => user && fetchFlows(user.id)}>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Flow
                </Button>
               </CreateFlowDialog>
          </div>
        )}
    </div>
  );
}
