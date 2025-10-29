/**
 * Message Protocol for Agent Communication
 * 
 * Defines the structure and types for messages exchanged between agents.
 */

export enum AgentRole {
  MIKE = 'Mike',
  EMMA = 'Emma',
  BOB = 'Bob',
  ALEX = 'Alex',
  DAVID = 'David',
  IRIS = 'Iris',
  USER = 'user',
  SYSTEM = 'system',
}

export enum MessageType {
  USER_REQUEST = 'user_request',
  AGENT_MESSAGE = 'agent_message',
  AGENT_QUESTION = 'agent_question',
  AGENT_RESPONSE = 'agent_response',
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_ACCEPTED = 'task_accepted',
  TASK_REJECTED = 'task_rejected',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  SYSTEM_ERROR = 'system_error',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface AgentMessage {
  id: string;
  type: MessageType;
  from: AgentRole | string;
  to?: AgentRole | AgentRole[] | string;
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: AgentRole | string;
  status: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  dependencies?: string[];
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentContext {
  conversationId: string;
  projectId: string;
  userId: string;
  mode: 'team' | 'engineer' | 'research' | 'race';
  messages: AgentMessage[];
  tasks: Task[];
}

/**
 * Create a new agent message
 */
export function createAgentMessage(
  type: MessageType,
  content: string,
  from: AgentRole | string,
  to?: AgentRole | AgentRole[] | string,
  metadata?: Record<string, any>
): AgentMessage {
  return {
    id: generateId(),
    type,
    from,
    to,
    content,
    metadata,
    timestamp: new Date(),
  };
}

/**
 * Create a new task
 */
export function createTask(
  title: string,
  description: string,
  assignee: AgentRole | string,
  options?: {
    priority?: 'low' | 'medium' | 'high';
    dependencies?: string[];
  }
): Task {
  return {
    id: generateId(),
    title,
    description,
    assignee,
    status: TaskStatus.PENDING,
    priority: options?.priority || 'medium',
    dependencies: options?.dependencies || [],
    createdAt: new Date(),
    updatedAt: new Date(),
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
    updatedAt: new Date(),
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}