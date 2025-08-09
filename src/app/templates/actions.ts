
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type TemplateState = {
  error?: string;
  success?: string;
};

export async function createTemplateAction(
  prevState: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create a template.' };
  }

  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const body = formData.get('body') as string;
  const footer = formData.get('footer') as string;

  if (!name || !category || !body) {
    return { error: 'Template name, category, and body are required.' };
  }

  const { error } = await supabase.from('message_templates').insert({
    user_id: user.id,
    name,
    category,
    body,
    footer,
  });

  if (error) {
    console.error('Error creating template:', error);
    return { error: `Database Error: ${error.message}` };
  }

  revalidatePath('/templates');
  return { success: 'Template created successfully!' };
}
