
import { exchangeCodeForTokens } from '@/app/auth/google/actions';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This should be the user ID we passed
    const error = searchParams.get('error');

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (error) {
        console.error(`Error from Google OAuth: ${error}`);
        // Redirect to a settings/error page
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Check if the user is logged in and the state matches
    if (!session || !state || session.user.id !== state) {
        console.error('Invalid state or user not logged in.');
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (code) {
        const result = await exchangeCodeForTokens(code, session.user.id);
        if (result.error) {
             console.error(`Token exchange failed: ${result.error}`);
             // Maybe redirect with an error query param
        }
    } else {
         console.error('No authorization code provided by Google.');
    }
    
    // Redirect the user back to the flow editor or a relevant page
    // In a real app, you might want to redirect back to the specific flow they were editing.
    return NextResponse.redirect(new URL('/dashboard', request.url));
}
