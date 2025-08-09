'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteFlowAction(formData: FormData) {
  const flowId = formData.get('flowId') as string;
  if (!flowId) {
    throw new Error('Flow ID is required');
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: flow, error: selectError } = await supabase
    .from('flows')
    .select('id')
    .eq('id', flowId)
    .eq('user_id', user.id)
    .single();

  if (selectError || !flow) {
    throw new Error('Flow not found or user does not have permission');
  }

  const { error } = await supabase.from('flows').delete().match({ id: flowId });

  if (error) {
    console.error('Error deleting flow:', error);
    // This could return an error message to the client if using useActionState
    return { error: 'Failed to delete flow' };
  }

  revalidatePath('/dashboard');
}


export async function createFlow(name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated for createFlow');
    return null;
  }
  
  const newFlowId = crypto.randomUUID();
  const { error } = await supabase.from('flows').insert({
    id: newFlowId,
    name: name,
    user_id: user.id
  });

  if (error) {
    console.error('Error creating flow:', error);
    return null;
  }

  // Create the initial "Start" node for the new flow
  const { error: nodeError } = await supabase.from('nodes').insert({
      id: crypto.randomUUID(), // Use a random UUID for the node ID
      flow_id: newFlowId,
      type: 'custom',
      data: { type: 'trigger', label: 'Start Flow' },
      position: { x: 250, y: 5 },
  });

  if (nodeError) {
      console.error('Error creating initial node for new flow:', nodeError);
      // Clean up the created flow if the initial node fails
      await supabase.from('flows').delete().match({ id: newFlowId });
      return null;
  }
  
  revalidatePath('/dashboard');
  // After creating, redirect to the new flow's page
  redirect(`/flow/${newFlowId}`);
}

export async function renameFlowAction(flowId: string, newName: string) {
    if (!flowId || !newName) {
        return { error: 'Flow ID and new name are required.' };
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'User not authenticated.' };
    }

    const { error } = await supabase
        .from('flows')
        .update({ name: newName })
        .match({ id: flowId, user_id: user.id });

    if (error) {
        console.error('Error renaming flow:', error);
        return { error: 'Failed to rename flow.' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
