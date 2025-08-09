
'use client';

import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type Contact = {
    id: string;
    name: string;
    whatsapp_number: string;
    email: string | null;
    created_at: string;
}

// Server action to handle CSV upload
async function uploadContactsAction(formData: FormData) {
    const supabase = createClient();
    const { toast } = useToast(); // This hook can't be used in a server action directly. We'd need to pass the result back to the client.

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Not authenticated' };
    }

    const file = formData.get('csvFile') as File;
    if (!file || file.size === 0) {
        return { error: 'No file selected.' };
    }

    const fileContent = await file.text();
    // A simple CSV parser (in a real app, use a robust library like PapaParse)
    const rows = fileContent.split('\n').slice(1); // Skip header
    const contactsToInsert = rows.map(row => {
        const [name, whatsapp_number, email] = row.split(',');
        if (!name || !whatsapp_number) return null;
        return {
            user_id: user.id,
            name: name.trim(),
            whatsapp_number: whatsapp_number.trim(),
            email: email ? email.trim() : null,
        };
    }).filter(Boolean);

    if (contactsToInsert.length === 0) {
        return { error: 'No valid contacts found in the file.' };
    }

    const { error } = await supabase.from('contacts').insert(contactsToInsert as any);

    if (error) {
        console.error('Error inserting contacts:', error);
        return { error: `Failed to insert contacts. Make sure numbers are unique. Error: ${error.message}` };
    }

    return { success: `${contactsToInsert.length} contacts uploaded successfully!` };
}

export default function ContactsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const supabase = createClient();
    const router = useRouter();

    const fetchContacts = async (userId: string) => {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching contacts:', error);
            toast({ title: "Error", description: "Could not fetch contacts.", variant: "destructive" });
        } else {
            setContacts(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                fetchContacts(user.id);
            } else {
                router.push('/login');
            }
        };
        getUser();
    }, [supabase, router, toast]);

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await uploadContactsAction(formData);
            if (result.error) {
                toast({ title: 'Upload Failed', description: result.error, variant: 'destructive' });
            } else if (result.success) {
                toast({ title: 'Upload Successful', description: result.success });
                if (user) fetchContacts(user.id); // Refresh list
            }
        });
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Contact Management</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Upload Contacts</CardTitle>
                    <CardDescription>Upload a CSV file with columns: name, whatsapp_number, email.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFormSubmit} className="flex items-end gap-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="csvFile">CSV File</Label>
                            <Input id="csvFile" name="csvFile" type="file" accept=".csv" required />
                        </div>
                        <Button type="submit" disabled={isPending}>{isPending ? 'Uploading...' : 'Upload'}</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading contacts...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>WhatsApp Number</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Added On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((contact) => (
                                    <TableRow key={contact.id}>
                                        <TableCell>{contact.name}</TableCell>
                                        <TableCell>{contact.whatsapp_number}</TableCell>
                                        <TableCell>{contact.email || 'N/A'}</TableCell>
                                        <TableCell>{new Date(contact.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
