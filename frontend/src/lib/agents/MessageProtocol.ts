/**
 * Agent Communication Protocol
 * 
 * This module defines the message types and protocols used for communication
 * between agents in the multi-agent system.
 */

export enum MessageType {
  // User messages
  USER_REQUEST = 'user_request',
  
  // Agent coordination
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_ACCEPTED = 'task_accepted',
  TASK_REJECTED = 'task_rejected',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  
  // Agent communication
  AGENT_MESSAGE = 'agent_message',
  AGENT_QUESTION = 'agent_question',
  AGENT_RESPONSE = 'agent_response',
  
  // System messages
  SYSTEM_STATUS = 'system_status',
  SYSTEM_ERROR = 'system_error',
}

export enum AgentRole {
  MIKE = 'Mike',      // Team Leader
  EMMA = 'Emma',      // Product Manager
  BOB = 'Bob',        // System Architect
  ALEX = 'Alex',      // Full-stack Engineer
  DAVID = 'David',    // Data Analyst
  IRIS = 'Iris',      // Deep Research Specialist
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

export interface AgentMessage {
  id: string;
  type: MessageType;
  from: AgentRole;
  to?: AgentRole | AgentRole[];  // undefined means broadcast
  content: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: AgentRole;
  status: TaskStatus;
  dependencies?: string[];  // Task IDs that must be completed first
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
  result?: any;
  error?: string;
}

export interface AgentContext {
  conversationId: string;
  projectId: string;
  userId: string;
  mode: 'team' | 'engineer' | 'research' | 'race';
  tasks: Task[];
  messages: AgentMessage[];
}

/**
 * Create a new agent message
 */
export function createAgentMessage(
  type: MessageType,
  from: AgentRole,
  content: string,
  options?: {
    to?: AgentRole | AgentRole[];
    metadata?: Record<string, any>;
  }
): AgentMessage {
  return {
    id: crypto.randomUUID(),
    type,
    from,
    to: options?.to,
    content,
    metadata: options?.metadata,
    timestamp: Date.now(),
  };
}

/**
 * Create a new task
 */
export function createTask(
  title: string,
  description: string,
  assignee: AgentRole,
  options?: {
    dependencies?: string[];
    priority?: 'low' | 'medium' | 'high';
  }
): Task {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    assignee,
    status: TaskStatus.PENDING,
    dependencies: options?.dependencies,
    priority: options?.priority ?? 'medium',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Update task status
 */
export function updateTaskStatus(
  task: Task,
  status: TaskStatus,
  result?: any,
  error?: string
): Task {
  return {
    ...task,
    status,
    result,
    error,
    updatedAt: Date.now(),
  };
}

/**
 * Check if a task's dependencies are satisfied
 */
export function areDependenciesSatisfied(task: Task, allTasks: Task[]): boolean {
  if (!task.dependencies || task.dependencies.length === 0) {
    return true;
  }

  return task.dependencies.every(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask?.status === TaskStatus.COMPLETED;
  });
}