/**
 * Realtime Messages Hook
 * 
 * This hook provides real-time message synchronization using Supabase Realtime.
 * It automatically subscribes to message changes and updates the local state.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];

interface UseRealtimeMessagesOptions {
  conversationId: string | null;
  enabled?: boolean;
}

export function useRealtimeMessages({
  conversationId,
  enabled = true,
}: UseRealtimeMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!conversationId || !enabled) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        if (mounted) {
          setMessages(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (mounted) {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (mounted) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (mounted) {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [conversationId, enabled]);

  return { messages, loading, error };
}