/**
 * PROJECT Concept Types
 *
 * Types for the new PROJECT-centric architecture with Master-Worker pattern
 */

import type { Database } from './database';

// Database types
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type ProjectEvent = Database['public']['Tables']['project_events']['Row'];
export type ProjectEventInsert = Database['public']['Tables']['project_events']['Insert'];

export type TaskDependency = Database['public']['Tables']['task_dependencies']['Row'];
export type TaskDependencyInsert = Database['public']['Tables']['task_dependencies']['Insert'];

// Enum types
export type ProjectType = 'web' | 'mobile' | 'data' | 'slides' | 'custom';
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'paused' | 'failed';
export type ConversationType = 'master' | 'worker';
export type DependencyType = 'blocks' | 'requires' | 'optional';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
export type TaskPriority = 'high' | 'medium' | 'low';

// Core Context structure
export interface CoreContext {
  // Tech Stack
  tech_stack: {
    frontend: string[];
    backend: string[];
    infrastructure: string[];
    tools: string[];
  };

  // Requirements
  requirements: {
    summary: string;
    goals: string[];
    user_stories: string[];
    features: string[];
    constraints: string[];
  };

  // Architecture
  architecture: {
    system_design: string;
    database_schema: Record<string, any>;
    api_design: Record<string, any>;
    component_hierarchy: Record<string, any>;
  };

  // File Structure
  file_structure: Record<string, {
    type: 'file' | 'directory';
    description: string;
    owner: string;
  }>;

  // Coding Standards
  coding_standards: {
    style_guide: string;
    naming_conventions: Record<string, any>;
    best_practices: string[];
  };
}

// Task structure (stored in conversation.task JSON field)
export interface Task {
  // Basic info
  title: string;
  description: string;
  priority: TaskPriority;

  // Assignment
  assigned_agents: string[];
  lead_agent: string;

  // Dependencies
  dependencies: string[];
  blocked_by: string[];
  blocks: string[];

  // Git info
  github_branch: string;
  pull_request_url: string | null;

  // Status
  status: TaskStatus;

  // Deliverables
  deliverables: {
    code_files: string[];
    documentation: string;
    test_coverage: number;
    deployment_url: string | null;
  };

  // Time tracking
  estimated_time: string;
  actual_time: string | null;
  started_at: string | null;
  completed_at: string | null;
}

// Project Progress (stored in project.progress JSON field)
export interface ProjectProgress {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  in_progress_tasks: number;
  percentage: number;
}

// Event metadata types
export interface EventMetadata {
  agent_name?: string;
  message: string;
  details?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error';
}

// Task Plan (for Mike's task decomposition)
export interface TaskPlan {
  analysis: ProjectAnalysis;
  tasks: TaskPlanItem[];
  estimated_parallel_time: string;
  estimated_serial_time: string;
}

export interface ProjectAnalysis {
  project_type: ProjectType;
  core_features: string[];
  tech_stack: CoreContext['tech_stack'];
  architecture: string;
  coding_standards: string[];
}

export interface TaskPlanItem {
  title: string;
  description: string;
  priority: TaskPriority;
  agents: string[];
  lead_agent: string;
  dependencies: string[];
  branch: string;
  estimated_time: string;
  deliverables: string[];
}

// GitHub related types
export interface GitHubRepo {
  url: string;
  owner: string;
  name: string;
  branch: string;
}

export interface PullRequest {
  number: number;
  url: string;
  status: string;
  title: string;
  body: string;
}

export interface GitHubBranch {
  name: string;
  sha: string;
  protected: boolean;
}

// API Response types
export interface CreateProjectResponse {
  project: Project;
  master_conversation: Conversation;
}

export interface TaskExecutionResult {
  conversation_id: string;
  task: Task;
  result: {
    prd?: string;
    architecture?: string;
    code: string;
    tests: string[];
    documentation: string;
  };
  pull_request_url: string | null;
}
