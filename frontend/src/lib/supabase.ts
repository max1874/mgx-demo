/**
 * Supabase Client Configuration
 * 
 * This file initializes and exports the Supabase client for use throughout the application.
 * It provides type-safe access to Supabase services including:
 * - Authentication (Auth)
 * - Database (PostgreSQL)
 * - Storage (Object Storage)
 * - Realtime (WebSocket subscriptions)
 * - Edge Functions (Serverless functions)
 * 
 * @author Bob (System Architect)
 * @date 2025-01-28
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Supabase project configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required variables:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY'
  );
}

/**
 * Supabase client instance with type-safe database schema
 * 
 * Features:
 * - Automatic session management
 * - Persistent authentication across page reloads
 * - Type-safe database queries
 * - Real-time subscriptions
 * - File storage operations
 * 
 * @example
 * // Query data
 * const { data, error } = await supabase
 *   .from('projects')
 *   .select('*')
 *   .eq('user_id', userId);
 * 
 * @example
 * // Subscribe to real-time changes
 * const subscription = supabase
 *   .channel('messages')
 *   .on('postgres_changes', {
 *     event: 'INSERT',
 *     schema: 'public',
 *     table: 'messages'
 *   }, (payload) => {
 *     console.log('New message:', payload.new);
 *   })
 *   .subscribe();
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in local storage
    persistSession: true,
    // Auto-refresh session before expiry
    autoRefreshToken: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
    // Storage key for session data
    storageKey: 'mgx-auth-token',
  },
  realtime: {
    // Realtime configuration for WebSocket connections
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-application-name': 'mgx-demo',
    },
  },
});

/**
 * Helper function to check if user is authenticated
 * 
 * @returns Promise<boolean> True if user is authenticated
 * 
 * @example
 * const isAuth = await isAuthenticated();
 * if (!isAuth) {
 *   router.push('/login');
 * }
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Helper function to get current user
 * 
 * @returns Promise<User | null> Current user or null
 * 
 * @example
 * const user = await getCurrentUser();
 * console.log('User ID:', user?.id);
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Helper function to sign out user
 * 
 * @returns Promise<void>
 * 
 * @example
 * await signOut();
 * router.push('/login');
 */
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/**
 * Storage bucket names
 * These buckets should be created in Supabase dashboard
 */
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PROJECT_FILES: 'project-files',
  DEPLOYMENTS: 'deployments',
} as const;

/**
 * Helper function to upload file to storage
 * 
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param file - File to upload
 * @returns Promise with upload result
 * 
 * @example
 * const file = event.target.files[0];
 * const { data, error } = await uploadFile(
 *   STORAGE_BUCKETS.AVATARS,
 *   `${userId}/avatar.png`,
 *   file
 * );
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
) => {
  return await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
};

/**
 * Helper function to get public URL for stored file
 * 
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Public URL string
 * 
 * @example
 * const avatarUrl = getPublicUrl(
 *   STORAGE_BUCKETS.AVATARS,
 *   `${userId}/avatar.png`
 * );
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Helper function to delete file from storage
 * 
 * @param bucket - Storage bucket name
 * @param paths - File path(s) to delete
 * @returns Promise with deletion result
 * 
 * @example
 * await deleteFile(
 *   STORAGE_BUCKETS.PROJECT_FILES,
 *   ['project1/file1.txt', 'project1/file2.txt']
 * );
 */
export const deleteFile = async (
  bucket: string,
  paths: string[]
) => {
  return await supabase.storage
    .from(bucket)
    .remove(paths);
};

// Export types for convenience
export type { Database };