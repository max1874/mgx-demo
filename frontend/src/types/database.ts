/**
 * Database Type Definitions
 * 
 * This file contains TypeScript type definitions for all database tables.
 * These types are auto-generated from the Supabase schema and provide
 * type-safe access to database operations.
 * 
 * @author Bob (System Architect)
 * @date 2025-01-28
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          credits: number;
          subscription_tier: 'free' | 'pro' | 'max';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          credits?: number;
          subscription_tier?: 'free' | 'pro' | 'max';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          credits?: number;
          subscription_tier?: 'free' | 'pro' | 'max';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          permission: 'private' | 'link_only' | 'public';
          generated_code: Json;
          version: number;
          parent_project_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          permission?: 'private' | 'link_only' | 'public';
          generated_code?: Json;
          version?: number;
          parent_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          permission?: 'private' | 'link_only' | 'public';
          generated_code?: Json;
          version?: number;
          parent_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_parent_project_id_fkey';
            columns: ['parent_project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      conversations: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          mode: 'team' | 'engineer' | 'research' | 'race';
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          mode?: 'team' | 'engineer' | 'research' | 'race';
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          mode?: 'team' | 'engineer' | 'research' | 'race';
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          agent_name: 'Mike' | 'Emma' | 'Bob' | 'Alex' | 'David' | 'Iris' | null;
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          agent_name?: 'Mike' | 'Emma' | 'Bob' | 'Alex' | 'David' | 'Iris' | null;
          content: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          agent_name?: 'Mike' | 'Emma' | 'Bob' | 'Alex' | 'David' | 'Iris' | null;
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          }
        ];
      };
      agents: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string;
          capabilities: string[];
          system_prompt: string;
          config: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description: string;
          capabilities?: string[];
          system_prompt: string;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          description?: string;
          capabilities?: string[];
          system_prompt?: string;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_executions: {
        Row: {
          id: string;
          conversation_id: string;
          agent_id: string;
          input: Json;
          output: Json | null;
          status: 'pending' | 'running' | 'completed' | 'failed';
          error_message: string | null;
          tokens_used: number;
          execution_time_ms: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          agent_id: string;
          input: Json;
          output?: Json | null;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          error_message?: string | null;
          tokens_used?: number;
          execution_time_ms?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          agent_id?: string;
          input?: Json;
          output?: Json | null;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          error_message?: string | null;
          tokens_used?: number;
          execution_time_ms?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_executions_conversation_id_fkey';
            columns: ['conversation_id'];
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'agent_executions_agent_id_fkey';
            columns: ['agent_id'];
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          }
        ];
      };
      files: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          path: string;
          content: string | null;
          storage_path: string | null;
          size: number | null;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          name: string;
          path: string;
          content?: string | null;
          storage_path?: string | null;
          size?: number | null;
          mime_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          name?: string;
          path?: string;
          content?: string | null;
          storage_path?: string | null;
          size?: number | null;
          mime_type?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'files_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'files_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      versions: {
        Row: {
          id: string;
          project_id: string;
          version_number: number;
          snapshot: Json;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version_number: number;
          snapshot: Json;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          version_number?: number;
          snapshot?: Json;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'versions_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      deployments: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          url: string;
          status: 'pending' | 'building' | 'deployed' | 'failed';
          config: Json;
          error_message: string | null;
          created_at: string;
          deployed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          url: string;
          status?: 'pending' | 'building' | 'deployed' | 'failed';
          config?: Json;
          error_message?: string | null;
          created_at?: string;
          deployed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          url?: string;
          status?: 'pending' | 'building' | 'deployed' | 'failed';
          config?: Json;
          error_message?: string | null;
          created_at?: string;
          deployed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deployments_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deployments_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}