/**
 * Messages API
 * 
 * This module provides functions for managing messages in Supabase.
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageUpdate = Database['public']['Tables']['messages']['Update'];

/**
 * Create a new message
 */
export async function createMessage(
  data: MessageInsert
): Promise<{ data: Message | null; error: Error | null }> {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { data: message, error: null };
  } catch (error) {
    console.error('Error creating message:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a message by ID
 */
export async function getMessage(
  id: string
): Promise<{ data: Message | null; error: Error | null }> {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data: message, error: null };
  } catch (error) {
    console.error('Error getting message:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all messages for a conversation
 */
export async function getMessagesByConversation(
  conversationId: string,
  options?: {
    limit?: number;
    offset?: number;
    order?: 'asc' | 'desc';
  }
): Promise<{ data: Message[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId);

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    query = query.order('created_at', { 
      ascending: options?.order === 'asc' 
    });

    const { data: messages, error } = await query;

    if (error) throw error;

    return { data: messages, error: null };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a message
 */
export async function updateMessage(
  id: string,
  updates: MessageUpdate
): Promise<{ data: Message | null; error: Error | null }> {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data: message, error: null };
  } catch (error) {
    console.error('Error updating message:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { error: error as Error };
  }
}

/**
 * Delete all messages in a conversation
 */
export async function deleteConversationMessages(
  conversationId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting conversation messages:', error);
    return { error: error as Error };
  }
}

/**
 * Get message count for a conversation
 */
export async function getMessageCount(
  conversationId: string
): Promise<{ data: number | null; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (error) throw error;

    return { data: count, error: null };
  } catch (error) {
    console.error('Error getting message count:', error);
    return { data: null, error: error as Error };
  }
}