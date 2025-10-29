/**
 * Conversations API
 * 
 * This module provides functions for managing conversations in Supabase.
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

/**
 * Create a new conversation
 */
export async function createConversation(
  data: ConversationInsert
): Promise<{ data: Conversation | null; error: Error | null }> {
  try {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { data: conversation, error: null };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a conversation by ID
 */
export async function getConversation(
  id: string
): Promise<{ data: Conversation | null; error: Error | null }> {
  try {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data: conversation, error: null };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all conversations for a user
 */
export async function getConversationsByUser(
  userId: string
): Promise<{ data: Conversation[] | null; error: Error | null }> {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { data: conversations, error: null };
  } catch (error) {
    console.error('Error getting conversations:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all conversations for a project
 */
export async function getConversationsByProject(
  projectId: string
): Promise<{ data: Conversation[] | null; error: Error | null }> {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { data: conversations, error: null };
  } catch (error) {
    console.error('Error getting conversations by project:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a conversation
 */
export async function updateConversation(
  id: string,
  updates: ConversationUpdate
): Promise<{ data: Conversation | null; error: Error | null }> {
  try {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data: conversation, error: null };
  } catch (error) {
    console.error('Error updating conversation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { error: error as Error };
  }
}

/**
 * Update conversation's last activity timestamp
 */
export async function touchConversation(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error touching conversation:', error);
    return { error: error as Error };
  }
}
