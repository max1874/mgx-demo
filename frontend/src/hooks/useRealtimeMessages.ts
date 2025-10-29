/**
 * Realtime Messages Hook
 * 
 * This hook provides real-time message synchronization using Supabase Realtime.
 * It automatically subscribes to message changes and updates the local state.
 */

import { useCallback, useEffect, useState } from 'react';
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

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !enabled) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [conversationId, enabled]);

  useEffect(() => {
    if (!conversationId || !enabled) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let mounted = true;

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
        async () => {
          if (!mounted) return;
          // Refetch to ensure we stay in sync even if realtime misses events
          await fetchMessages();
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
        async () => {
          if (!mounted) return;
          await fetchMessages();
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
        async () => {
          if (!mounted) return;
          await fetchMessages();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [conversationId, enabled, fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages };
}
