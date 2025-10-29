/**
 * Agent Orchestrator
 * 
 * Manages agent lifecycle, task routing, and coordination.
 * This is the central hub that receives user requests and orchestrates
 * the collaboration between different agents.
 * Supports streaming responses for real-time feedback.
 */

import { MikeAgent } from './MikeAgent';
import { EmmaAgent } from './EmmaAgent';
import { BobAgent } from './BobAgent';
import { AlexAgent } from './AlexAgent';
import { DavidAgent } from './DavidAgent';
import { BaseAgent } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
  createAgentMessage,
} from './MessageProtocol';
import { LLMProvider } from '../llm/LLMProvider';
import { LLMProviderFactory } from '../llm/LLMProviderFactory';
import { ModelType } from '../llm/ModelConfig';
import { createMessage } from '../api/messages';
import { touchConversation } from '../api/conversations';
import { generateAndUpdateTitle } from '../services/titleGenerator';

interface OrchestratorConfig {
  conversationId: string;
  modelType?: ModelType;
  onAgentMessage?: (agentName: string, content: string) => void;
  onStreamChunk?: (agentName: string, chunk: string) => void;
  onTaskUpdate?: (task: Task) => void;
  onError?: (error: Error) => void;
}

export class AgentOrchestrator {
  private conversationId: string;
  private agents: Map<AgentRole, BaseAgent>;
  private llmProvider: LLMProvider;
  private messageHistory: AgentMessage[] = [];
  private activeTasks: Map<string, Task> = new Map();
  private config: OrchestratorConfig;
  private modelType: ModelType;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.conversationId = config.conversationId;
    this.modelType = config.modelType || ModelType.CLAUDE_SONNET;

    console.log('🚀 AgentOrchestrator: Initializing with model type:', this.modelType);

    // Initialize LLM provider based on selected model
    this.llmProvider = this.createLLMProvider();

    console.log('📋 AgentOrchestrator: LLM Provider created, model:', this.llmProvider.getModel());

    // Initialize all agents with the same LLM provider
    this.agents = new Map();
    this.agents.set(AgentRole.MIKE, new MikeAgent(this.llmProvider));
    this.agents.set(AgentRole.EMMA, new EmmaAgent(this.llmProvider));
    this.agents.set(AgentRole.BOB, new BobAgent(this.llmProvider));
    this.agents.set(AgentRole.ALEX, new AlexAgent(this.llmProvider));
    this.agents.set(AgentRole.DAVID, new DavidAgent(this.llmProvider));
    
    console.log('✅ AgentOrchestrator: All agents initialized with model:', this.llmProvider.getModel());
    console.log('👥 AgentOrchestrator: Agents:', Array.from(this.agents.keys()));
  }

  /**
   * Create LLM provider based on selected model type
   */
  private createLLMProvider(): LLMProvider {
    try {
      console.log('🔧 AgentOrchestrator: Creating LLM provider for model type:', this.modelType);
      const provider = LLMProviderFactory.createProvider(this.modelType);
      console.log('✅ AgentOrchestrator: LLM provider created successfully, using model:', provider.getModel());
      return provider;
    } catch (error) {
      console.error('❌ AgentOrchestrator: Failed to create LLM provider:', error);
      throw new Error(
        `Failed to initialize AI model. ${(error as Error).message}`
      );
    }
  }

  /**
   * Get current model type
   */
  getModelType(): ModelType {
    return this.modelType;
  }

  /**
   * Get current model name
   */
  getCurrentModel(): string {
    return this.llmProvider.getModel();
  }

  /**
   * Process user request with streaming support
   */
  async processUserRequest(userMessage: string): Promise<void> {
    try {
      console.log('💬 AgentOrchestrator: Processing user request with model:', this.llmProvider.getModel());
      
      // Save user message to database
      await createMessage({
        conversation_id: this.conversationId,
        role: 'user',
        content: userMessage,
      });

      // Update conversation timestamp
      await touchConversation(this.conversationId);

      // Create agent message for Mike
      const message = createAgentMessage(
        MessageType.USER_REQUEST,
        userMessage,
        AgentRole.USER,
        AgentRole.MIKE
      );

      this.messageHistory.push(message);

      // Get Mike agent
      const mike = this.agents.get(AgentRole.MIKE);
      if (!mike) {
        throw new Error('Mike agent not initialized');
      }

      // Set context for Mike
      mike.setContext({
        conversationId: this.conversationId,
        projectId: '', // TODO: Get from context
        userId: '', // TODO: Get from context
        mode: 'team',
        messages: this.messageHistory,
        tasks: Array.from(this.activeTasks.values()),
      });

      // Process with Mike using streaming
      let fullResponse = '';
      
      const response = await mike.processMessageStreaming(message, (chunk) => {
        fullResponse += chunk;
        // Stream each chunk to UI
        this.config.onStreamChunk?.('Mike', chunk);
      });

      if (response) {
        this.messageHistory.push(response);

        // Save Mike's complete response to database
        await createMessage({
          conversation_id: this.conversationId,
          role: 'assistant',
          agent_name: 'Mike',
          content: fullResponse,
        });

        // Notify UI that streaming is complete
        this.config.onAgentMessage?.('Mike', fullResponse);

        // Auto-generate conversation title after Mike's response (if needed)
        // This runs in the background and doesn't block the response
        generateAndUpdateTitle(this.conversationId, this.llmProvider).catch((error) => {
          console.error('Failed to generate conversation title:', error);
        });

        // Check if Mike created tasks
        if (response.metadata?.tasks) {
          const tasks = response.metadata.tasks as Task[];
          await this.executeTasks(tasks);
        }
      }
    } catch (error) {
      console.error('❌ AgentOrchestrator: Error processing user request:', error);
      this.config.onError?.(error as Error);
      
      // Save error message
      await createMessage({
        conversation_id: this.conversationId,
        role: 'system',
        content: `Error: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Execute tasks assigned by Mike
   */
  private async executeTasks(tasks: Task[]): Promise<void> {
    // Add tasks to active tasks
    tasks.forEach(task => {
      this.activeTasks.set(task.id, task);
      this.config.onTaskUpdate?.(task);
    });

    // Execute tasks in order, respecting dependencies
    for (const task of tasks) {
      await this.executeTask(task);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task): Promise<void> {
    try {
      // Check dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        const allDependenciesComplete = task.dependencies.every(depId => {
          const depTask = this.activeTasks.get(depId);
          return depTask && depTask.status === TaskStatus.COMPLETED;
        });

        if (!allDependenciesComplete) {
          console.log(`Task ${task.id} waiting for dependencies`);
          return;
        }
      }

      // Convert string assignee to AgentRole if needed
      const assigneeRole = this.parseAgentRole(task.assignee);
      
      // Get the agent for this task
      const agent = this.agents.get(assigneeRole);
      if (!agent) {
        throw new Error(`Agent ${task.assignee} not found`);
      }

      console.log(`🎯 AgentOrchestrator: Executing task with agent ${assigneeRole}, model:`, this.llmProvider.getModel());

      // Update task status
      task.status = TaskStatus.IN_PROGRESS;
      this.activeTasks.set(task.id, task);
      this.config.onTaskUpdate?.(task);

      // Set context
      agent.setContext({
        conversationId: this.conversationId,
        projectId: '', // TODO: Get from context
        userId: '', // TODO: Get from context
        mode: 'team',
        messages: this.messageHistory,
        tasks: Array.from(this.activeTasks.values()),
      });

      // Create task assignment message
      const assignmentMessage = createAgentMessage(
        MessageType.TASK_ASSIGNMENT,
        `Task: ${task.title}\n\n${task.description}`,
        AgentRole.MIKE,
        assigneeRole,
        { task }
      );

      this.messageHistory.push(assignmentMessage);

      // Process task with agent (using streaming if available)
      let fullResponse = '';
      
      const response = await agent.processMessageStreaming(assignmentMessage, (chunk) => {
        fullResponse += chunk;
        this.config.onStreamChunk?.(agent.getName(), chunk);
      });

      if (response) {
        this.messageHistory.push(response);

        // If task accepted, execute it
        if (response.type === MessageType.TASK_ACCEPTED) {
          const executedTask = await agent.executeTask(task);
          
          // Update task
          this.activeTasks.set(executedTask.id, executedTask);
          this.config.onTaskUpdate?.(executedTask);

          // Save agent's work to database
          if (executedTask.status === TaskStatus.COMPLETED) {
            const agentName = this.getAgentName(agent);
            const resultContent = this.formatTaskResult(agentName, executedTask);

            await createMessage({
              conversation_id: this.conversationId,
              role: 'assistant',
              agent_name: agentName,
              content: resultContent,
            });

            this.config.onAgentMessage?.(agentName, resultContent);
          }
        } else if (response.type === MessageType.TASK_REJECTED) {
          task.status = TaskStatus.FAILED;
          task.error = response.content;
          this.activeTasks.set(task.id, task);
          this.config.onTaskUpdate?.(task);
        }
      }
    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);
      task.status = TaskStatus.FAILED;
      task.error = (error as Error).message;
      this.activeTasks.set(task.id, task);
      this.config.onTaskUpdate?.(task);
      this.config.onError?.(error as Error);
    }
  }

  /**
   * Format task result based on agent type
   */
  private formatTaskResult(agentName: string, task: Task): string {
    const result = task.result;
    
    if (!result) {
      return `**${agentName} completed: ${task.title}**\n\nTask completed successfully.`;
    }

    // Format based on agent type
    switch (agentName) {
      case 'Emma':
        return `**${agentName} completed: ${task.title}**\n\n${result.prd || result.analysis || 'Requirements analysis completed.'}`;
      
      case 'Bob':
        return `**${agentName} completed: ${task.title}**\n\n${result.architecture || result.techStack || 'Architecture design completed.'}`;
      
      case 'Alex':
        return `**${agentName} completed: ${task.title}**\n\n${result.code || result.plan || 'Implementation completed.'}`;
      
      case 'David':
        return `**${agentName} completed: ${task.title}**\n\n${result.analysis || result.visualizations || 'Data analysis completed.'}`;
      
      default:
        return `**${agentName} completed: ${task.title}**\n\n${JSON.stringify(result, null, 2)}`;
    }
  }

  /**
   * Parse agent role from string
   */
  private parseAgentRole(assignee: string | AgentRole): AgentRole {
    if (typeof assignee === 'string') {
      // Try to match string to AgentRole enum
      const roleKey = Object.keys(AgentRole).find(
        key => AgentRole[key as keyof typeof AgentRole] === assignee
      );
      if (roleKey) {
        return AgentRole[roleKey as keyof typeof AgentRole];
      }
      // Default to ALEX if not found
      return AgentRole.ALEX;
    }
    return assignee;
  }

  /**
   * Get agent name safely
   */
  private getAgentName(agent: BaseAgent): string {
    return agent.getName();
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get message history
   */
  getMessageHistory(): AgentMessage[] {
    return this.messageHistory;
  }

  /**
   * Clear orchestrator state
   */
  clear(): void {
    this.messageHistory = [];
    this.activeTasks.clear();
  }
}