
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { createBroadcastAction } from './actions';


export default function BroadcastPage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const result = await createBroadcastAction(formData);
            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                 toast({ title: "Success", description: result.success });
            }
        });
    }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Create Broadcast</h2>
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Broadcast Details</CardTitle>
                    <CardDescription>Compose and send a message template to a list of your contacts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Broadcast Name</Label>
                        <Input id="name" name="name" placeholder="e.g., January Newsletter" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template">Message Template</Label>
                        <Select name="template" required>
                            <SelectTrigger id="template">
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="welcome_message">Welcome Message</SelectItem>
                                <SelectItem value="order_confirmation">Order Confirmation</SelectItem>
                                <SelectItem value="shipping_update">Shipping Update</SelectItem>
                                <SelectItem value="special_offer">Special Offer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contacts">Contacts</Label>
                        <p className="text-sm text-muted-foreground">Contact list selection will be implemented here.</p>
                        {/* Placeholder for contact list selection UI */}
                        <div className="p-4 border rounded-md bg-muted/50">
                            <p>You would select contact lists or tags here.</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
                        {isPending ? 'Sending...' : 'Send Broadcast'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
