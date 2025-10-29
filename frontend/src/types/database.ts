export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          credits: number | null
          subscription_tier: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          credits?: number | null
          subscription_tier?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          credits?: number | null
          subscription_tier?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          permission: string | null
          generated_code: Json | null
          version: number | null
          parent_project_id: string | null
          // New fields for PROJECT concept
          github_repo_url: string | null
          github_branch: string | null
          project_type: 'web' | 'mobile' | 'data' | 'slides' | 'custom' | null
          status: 'planning' | 'in_progress' | 'completed' | 'paused' | 'failed' | null
          core_context: Json | null
          master_conversation_id: string | null
          progress: Json | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          permission?: string | null
          generated_code?: Json | null
          version?: number | null
          parent_project_id?: string | null
          github_repo_url?: string | null
          github_branch?: string | null
          project_type?: 'web' | 'mobile' | 'data' | 'slides' | 'custom' | null
          status?: 'planning' | 'in_progress' | 'completed' | 'paused' | 'failed' | null
          core_context?: Json | null
          master_conversation_id?: string | null
          progress?: Json | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          permission?: string | null
          generated_code?: Json | null
          version?: number | null
          parent_project_id?: string | null
          github_repo_url?: string | null
          github_branch?: string | null
          project_type?: 'web' | 'mobile' | 'data' | 'slides' | 'custom' | null
          status?: 'planning' | 'in_progress' | 'completed' | 'paused' | 'failed' | null
          core_context?: Json | null
          master_conversation_id?: string | null
          progress?: Json | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          project_id: string
          user_id: string
          mode: string | null
          title: string | null
          // New fields for Master-Worker pattern
          conversation_type: 'master' | 'worker' | null
          parent_conversation_id: string | null
          task: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          mode?: string | null
          title?: string | null
          conversation_type?: 'master' | 'worker' | null
          parent_conversation_id?: string | null
          task?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          mode?: string | null
          title?: string | null
          conversation_type?: 'master' | 'worker' | null
          parent_conversation_id?: string | null
          task?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          agent_name: string | null
          content: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          agent_name?: string | null
          content: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          agent_name?: string | null
          content?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      agents: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string
          capabilities: string[]
          system_prompt: string
          config: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description: string
          capabilities?: string[]
          system_prompt: string
          config?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string
          capabilities?: string[]
          system_prompt?: string
          config?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_executions: {
        Row: {
          id: string
          conversation_id: string
          agent_id: string
          input: Json
          output: Json | null
          status: string | null
          error_message: string | null
          tokens_used: number | null
          execution_time_ms: number | null
          created_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          agent_id: string
          input: Json
          output?: Json | null
          status?: string | null
          error_message?: string | null
          tokens_used?: number | null
          execution_time_ms?: number | null
          created_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          agent_id?: string
          input?: Json
          output?: Json | null
          status?: string | null
          error_message?: string | null
          tokens_used?: number | null
          execution_time_ms?: number | null
          created_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          id: string
          project_id: string
          user_id: string
          name: string
          path: string
          content: string | null
          storage_path: string | null
          size: number | null
          mime_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          name: string
          path: string
          content?: string | null
          storage_path?: string | null
          size?: number | null
          mime_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          name?: string
          path?: string
          content?: string | null
          storage_path?: string | null
          size?: number | null
          mime_type?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      versions: {
        Row: {
          id: string
          project_id: string
          version_number: number
          snapshot: Json
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          version_number: number
          snapshot: Json
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          version_number?: number
          snapshot?: Json
          description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      deployments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          url: string
          status: string | null
          config: Json | null
          error_message: string | null
          created_at: string | null
          deployed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          url: string
          status?: string | null
          config?: Json | null
          error_message?: string | null
          created_at?: string | null
          deployed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          url?: string
          status?: string | null
          config?: Json | null
          error_message?: string | null
          created_at?: string | null
          deployed_at?: string | null
        }
        Relationships: []
      }
      project_events: {
        Row: {
          id: string
          project_id: string
          conversation_id: string | null
          event_type: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          conversation_id?: string | null
          event_type: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          conversation_id?: string | null
          event_type?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      task_dependencies: {
        Row: {
          id: string
          project_id: string
          dependent_conversation_id: string
          dependency_conversation_id: string
          dependency_type: 'blocks' | 'requires' | 'optional' | null
          description: string | null
          satisfied: boolean | null
          satisfied_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          dependent_conversation_id: string
          dependency_conversation_id: string
          dependency_type?: 'blocks' | 'requires' | 'optional' | null
          description?: string | null
          satisfied?: boolean | null
          satisfied_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          dependent_conversation_id?: string
          dependency_conversation_id?: string
          dependency_type?: 'blocks' | 'requires' | 'optional' | null
          description?: string | null
          satisfied?: boolean | null
          satisfied_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
