'use client';

import { createClient } from '@/utils/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/auth/callback`);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <Bot className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-6 text-3xl font-bold font-headline tracking-tight text-foreground">
                Welcome to FlowCraft
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
                Sign in to build and manage your workflows
            </p>
        </div>
        <div className="rounded-lg border bg-card p-8 shadow-sm">
           {redirectUrl && <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              theme="dark"
              providers={[]}
              redirectTo={redirectUrl}
              showLinks={true}
              view="sign_in"
            />}
        </div>
       </div>
    </div>
  );
}
