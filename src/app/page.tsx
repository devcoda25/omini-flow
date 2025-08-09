'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Redirect authenticated users to the business profile page
    redirect('/business-profile');
  } else {
    redirect('/login');
  }
}
