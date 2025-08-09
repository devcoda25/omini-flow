
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from '@/components/app-shell';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'FlowCraft',
  description: 'A comprehensive frontend workflow builder application.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
          {session ? (
            <AppShell user={session.user}>
              {children}
            </AppShell>
          ) : (
             <main>{children}</main>
          )}
          <Toaster />
      </body>
    </html>
  );
}
