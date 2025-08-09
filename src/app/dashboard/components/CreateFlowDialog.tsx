
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFlow } from '../actions';
import { PlusCircle } from 'lucide-react';

export function CreateFlowDialog({ children, onFlowCreated }: { children: React.ReactNode, onFlowCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreateFlow = async () => {
    if (!name) return;
    startTransition(async () => {
      await createFlow(name); // The action now handles redirection
      setOpen(false);
      setName('');
      onFlowCreated?.(); // Refresh flows list if callback is provided
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || 
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Flow
          </Button>
        }
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Flow</DialogTitle>
          <DialogDescription>
            Give your new workflow a name to get started.
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
              placeholder="My Awesome Flow"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreateFlow}
            disabled={isPending || !name}
          >
            {isPending ? 'Creating...' : 'Create Flow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
