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
      agents: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string
          capabilities: string[]
          system_prompt: string
          config: Json | null
          avatar_url: string | null
          color: string | null
          model_provider: string | null
          model_name: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description: string
          capabilities: string[]
          system_prompt: string
          config?: Json | null
          avatar_url?: string | null
          color?: string | null
          model_provider?: string | null
          model_name?: string | null
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
          avatar_url?: string | null
          color?: string | null
          model_provider?: string | null
          model_name?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          mode: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title: string
          mode?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string
          mode?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          agent_id: string | null
          role: string
          content: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          agent_id?: string | null
          role: string
          content: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          agent_id?: string | null
          role?: string
          content?: string
          metadata?: Json | null
          created_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      files: {
        Row: {
          id: string
          project_id: string
          user_id: string
          name: string
          path: string
          content: string | null
          language: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          name: string
          path: string
          content?: string | null
          language?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          name?: string
          path?: string
          content?: string | null
          language?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      agent_executions: {
        Row: {
          id: string
          conversation_id: string
          agent_id: string
          user_id: string
          status: string
          input: Json | null
          output: Json | null
          error: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          agent_id: string
          user_id: string
          status: string
          input?: Json | null
          output?: Json | null
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          agent_id?: string
          user_id?: string
          status?: string
          input?: Json | null
          output?: Json | null
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
      }
      usage_metrics: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          conversation_id: string | null
          tokens_used: number
          cost: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          conversation_id?: string | null
          tokens_used: number
          cost?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          conversation_id?: string | null
          tokens_used?: number
          cost?: number | null
          created_at?: string | null
        }
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
  }
}