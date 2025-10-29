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
        Relationships: []
      }
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
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          mode: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          mode?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          mode?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          topic: string
          role: string
          agent_name: string | null
          extension: string
          content: string
          payload: Json | null
          event: string | null
          metadata: Json | null
          private: boolean | null
          created_at: string | null
          updated_at: string
          inserted_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          topic?: string
          role: string
          agent_name?: string | null
          extension?: string
          content: string
          payload?: Json | null
          event?: string | null
          metadata?: Json | null
          private?: boolean | null
          created_at?: string | null
          updated_at?: string
          inserted_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          topic?: string
          role?: string
          agent_name?: string | null
          extension?: string
          content?: string
          payload?: Json | null
          event?: string | null
          metadata?: Json | null
          private?: boolean | null
          created_at?: string | null
          updated_at?: string
          inserted_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          id: string
          conversation_id: string
          path: string
          content: string
          language: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          path: string
          content: string
          language?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          path?: string
          content?: string
          language?: string | null
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
          status: string
          error: string | null
          started_at: string
          completed_at: string | null
          metrics: Json | null
        }
        Insert: {
          id?: string
          conversation_id: string
          agent_id: string
          input: Json
          output?: Json | null
          status: string
          error?: string | null
          started_at?: string
          completed_at?: string | null
          metrics?: Json | null
        }
        Update: {
          id?: string
          conversation_id?: string
          agent_id?: string
          input?: Json
          output?: Json | null
          status?: string
          error?: string | null
          started_at?: string
          completed_at?: string | null
          metrics?: Json | null
        }
        Relationships: []
      }
      deployments: {
        Row: {
          id: string
          conversation_id: string
          version: string
          url: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          version: string
          url?: string | null
          status: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          version?: string
          url?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      versions: {
        Row: {
          id: string
          conversation_id: string
          version_number: number
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          version_number: number
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          version_number?: number
          description?: string | null
          created_at?: string | null
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