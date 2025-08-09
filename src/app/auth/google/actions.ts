
'use server';

import { createClient } from "@/utils/supabase/server";
import { google } from 'googleapis';
import { revalidatePath } from "next/cache";

const getGoogleOAuth2Client = () => {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error('Google OAuth credentials are not set in environment variables.');
    }

    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    );
}

export async function getGoogleAuthUrl() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'User not authenticated' };
    }

    try {
        const oauth2Client = getGoogleOAuth2Client();

        const scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            // A unique state value is passed with the request to prevent CSRF attacks.
            state: user.id,
            prompt: 'consent' // Forces the consent screen to appear every time.
        });

        return { url };

    } catch (error) {
        console.error("Error generating Google Auth URL:", error);
        return { error: 'Failed to generate Google authentication URL.' };
    }
}

export async function exchangeCodeForTokens(code: string, userId: string) {
    const supabase = createClient();
    try {
        const oauth2Client = getGoogleOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
            throw new Error('Failed to retrieve valid tokens from Google.');
        }

        // Get user profile info to store the email
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });
        const { data: profile } = await oauth2.userinfo.get();

        if (!profile.email) {
            throw new Error('Could not retrieve user email from Google.');
        }

        const { error } = await supabase
            .from('google_tokens')
            .upsert({
                user_id: userId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: new Date(tokens.expiry_date).toISOString(),
                account_email: profile.email
            }, { onConflict: 'user_id' });
        
        if (error) {
            console.error("Error saving Google tokens to Supabase:", error);
            throw error;
        }
        
        revalidatePath('/flow'); // Revalidate flow pages to update UI
        return { success: true };

    } catch (error) {
        console.error("Error exchanging code for tokens:", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred during token exchange.' };
    }
}
