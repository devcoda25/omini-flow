
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { createTemplateAction } from './actions';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type MessageTemplate = {
  id: string;
  name: string;
  category: string;
  body: string;
  footer: string | null;
  created_at: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700 text-white">
      {pending ? 'Saving...' : 'Save Template'}
    </Button>
  );
}

export default function TemplatesPage() {
  const [state, formAction] = useFormState(createTemplateAction, {});
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUserAndTemplates = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
            setUser(currentUser);
            const { data, error } = await supabase
                .from('message_templates')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching templates:', error);
                toast({ title: "Error", description: "Could not fetch templates.", variant: "destructive" });
            } else {
                setTemplates(data || []);
            }
        }
        setLoading(false);
    };
    getUserAndTemplates();
  }, [supabase, toast]);


  useEffect(() => {
    if (state.success) {
      toast({ title: 'Success!', description: state.success });
      formRef.current?.reset();
    }
    if (state.error) {
      toast({ title: 'Error', description: state.error, variant: 'destructive' });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Message Templates</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <form ref={formRef} action={formAction}>
              <Card>
                <CardHeader>
                  <CardTitle>Create New Template</CardTitle>
                  <CardDescription>
                    Design a new message template for your flows and broadcasts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" name="name" placeholder="e.g., Order Confirmation" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="authentication">Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">Body</Label>
                    <Textarea
                      id="body"
                      name="body"
                      placeholder="Hello {{1}}, your order {{2}} has been shipped."
                      rows={6}
                      required
                    />
                     <p className="text-xs text-muted-foreground">
                        Use double curly braces for variables, e.g., `{{1}}`.
                    </p>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="footer">Footer (Optional)</Label>
                    <Input id="footer" name="footer" placeholder="e.g., Thanks for shopping!" />
                  </div>
                </CardContent>
                <CardFooter>
                  <SubmitButton />
                </CardFooter>
              </Card>
            </form>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Your Templates</CardTitle>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <p>Loading templates...</p>
                    ) : (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                         {templates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell className="font-medium">{template.name}</TableCell>
                                <TableCell>
                                    <Badge variant={template.category === 'marketing' ? 'secondary' : 'default'}>
                                        {template.category}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                         ))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
