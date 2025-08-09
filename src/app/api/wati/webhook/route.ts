
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles incoming webhook events from WATI.
 * @see https://docs.wati.io/reference/webhooks
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  try {
    const payload = await request.json();
    console.log('Received WATI webhook:', JSON.stringify(payload, null, 2));

    const { id, waId, text, conversationId, timestamp } = payload;

    // We need at least a sender ID and a message to proceed.
    if (!waId || !text) {
      return NextResponse.json({ status: 'success', message: 'Ignoring event without sender or text.' }, { status: 200 });
    }

    // 1. Upsert conversation to ensure it exists
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .upsert({
            id: conversationId || waId, // Use conversationId if present, otherwise fall back to waId
            last_message_at: new Date(timestamp * 1000).toISOString(),
            contact_wuid: waId,
        })
        .select()
        .single();
    
    if (convError) {
        console.error('Error upserting conversation:', convError);
        throw new Error(`Failed to upsert conversation: ${convError.message}`);
    }

    // 2. Insert the new message
    const { error: msgError } = await supabase
        .from('messages')
        .insert({
            id: id, // WATI message ID
            conversation_id: conversation.id,
            content: text,
            sender_wuid: waId,
            is_from_contact: true, // Messages from webhook are from the contact
            created_at: new Date(timestamp * 1000).toISOString(),
        });

    if (msgError) {
        console.error('Error inserting message:', msgError);
        throw new Error(`Failed to insert message: ${msgError.message}`);
    }


    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error processing WATI webhook:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
