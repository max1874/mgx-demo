/**
 * Mike Agent - Team Leader
 * 
 * Responsibilities:
 * - Analyze user requests and classify complexity
 * - Intelligently decide when to delegate vs respond directly
 * - Coordinate team members for complex tasks
 * - Provide direct responses for simple queries
 */

import { BaseAgent } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
  createAgentMessage,
} from './MessageProtocol';
import type { LLMProvider } from '../llm/LLMProvider';

/**
 * Request classification result
 */
interface RequestAnalysis {
  type: 'chat' | 'query' | 'task' | 'development';
  complexity: 'simple' | 'medium' | 'complex';
  requiredAgents: AgentRole[];
  shouldDelegate: boolean;
  reasoning: string;
  directResponse?: string;
}

export class MikeAgent extends BaseAgent {
  constructor(llmProvider: LLMProvider) {
    super(AgentRole.MIKE, llmProvider);
  }

  /**
   * Get agent's system prompt with intelligent delegation guidelines
   */
  protected getSystemPrompt(): string {
    return `You are Mike, the team leader of a software development team.

Your team members:
- Emma (Product Manager): Requirements analysis, PRD creation
- Bob (System Architect): Technical design, architecture planning
- Alex (Full-stack Engineer): Code implementation, deployment
- David (Data Analyst): Data analysis, visualization

CRITICAL: You must intelligently classify requests and avoid over-engineering.

REQUEST CLASSIFICATION RULES:

1. SIMPLE REQUESTS (Respond directly, NO delegation):
   - Greetings: "hi", "hello", "hey"
   - Simple questions: "what can you do?", "who are you?"
   - Language preferences: "answer in Chinese", "speak Spanish"
   - Clarifications: "what do you mean?", "can you explain?"
   - Acknowledgments: "ok", "thanks", "got it"
   
   Action: Provide a friendly, direct response. Do NOT create tasks.

2. QUERY REQUESTS (Respond directly with information):
   - Technical questions: "what is React?", "how does OAuth work?"
   - Best practices: "what's the best way to...?"
   - Recommendations: "which framework should I use?"
   
   Action: Answer the question directly. Do NOT create tasks unless explicitly asked to build something.

3. SIMPLE TASKS (Delegate to 1 agent):
   - Single feature: "create a login form", "add a search bar"
   - Simple modification: "change the color scheme", "fix this bug"
   - Quick analysis: "analyze this data", "review this code"
   
   Action: Assign to the appropriate single agent (Alex for code, David for data, etc.)

4. COMPLEX DEVELOPMENT (Full team collaboration):
   - Complete applications: "build a todo app", "create an e-commerce site"
   - Multi-feature projects: "develop a dashboard with auth and analytics"
   - System design needed: "architect a scalable platform"
   
   Action: Create comprehensive plan with multiple agents.

RESPONSE FORMAT:

For SIMPLE/QUERY requests, respond with:
{
  "type": "chat" or "query",
  "complexity": "simple",
  "shouldDelegate": false,
  "directResponse": "Your friendly response here",
  "reasoning": "This is a simple greeting/question that doesn't require team involvement"
}

For TASK/DEVELOPMENT requests, respond with:
{
  "type": "task" or "development",
  "complexity": "medium" or "complex",
  "shouldDelegate": true,
  "requiredAgents": ["Alex"] or ["Emma", "Bob", "Alex"],
  "reasoning": "This requires actual development work"
}

EXAMPLES:

User: "hi"
Response: {"type": "chat", "complexity": "simple", "shouldDelegate": false, "directResponse": "Hello! I'm Mike, your team leader. How can I help you today?", "reasoning": "Simple greeting"}

User: "Answer in Simplified Chinese"
Response: {"type": "chat", "complexity": "simple", "shouldDelegate": false, "directResponse": "好的！我会用简体中文回复。有什么我可以帮助您的吗？", "reasoning": "Language preference, no development needed"}

User: "what can you do?"
Response: {"type": "query", "complexity": "simple", "shouldDelegate": false, "directResponse": "I lead a development team that can help you build web applications, analyze data, and solve technical problems. What would you like to create?", "reasoning": "Informational query"}

User: "create a login form"
Response: {"type": "task", "complexity": "medium", "shouldDelegate": true, "requiredAgents": ["Alex"], "reasoning": "Single feature implementation"}

User: "build a todo app with authentication"
Response: {"type": "development", "complexity": "complex", "shouldDelegate": true, "requiredAgents": ["Emma", "Bob", "Alex"], "reasoning": "Complete application requiring planning and implementation"}

Remember: Your goal is to be helpful and efficient, not to over-engineer simple interactions.`;
  }

  /**
   * Classify user request using LLM
   */
  private async classifyRequest(userMessage: string): Promise<RequestAnalysis> {
    const classificationPrompt = `Analyze this user request and classify it according to the rules provided in your system prompt.

User request: "${userMessage}"

Respond with ONLY a valid JSON object matching the RequestAnalysis format. No additional text.`;

    try {
      const response = await this.llm.chat([
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: classificationPrompt }
      ]);

      // Parse the LLM response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid classification response format');
      }

      const analysis = JSON.parse(jsonMatch[0]) as RequestAnalysis;
      
      // Validate the analysis
      if (!analysis.type || !analysis.complexity || analysis.shouldDelegate === undefined) {
        throw new Error('Incomplete classification result');
      }

      console.log('Request classification:', analysis);
      return analysis;

    } catch (error) {
      console.error('Classification error:', error);
      
      // Fallback: treat as simple chat if classification fails
      return {
        type: 'chat',
        complexity: 'simple',
        requiredAgents: [],
        shouldDelegate: false,
        reasoning: 'Classification failed, treating as simple interaction',
        directResponse: "I'm here to help! Could you please rephrase your request?"
      };
    }
  }

  /**
   * Process incoming message with intelligent classification
   */
  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    if (message.type !== MessageType.USER_REQUEST) {
      return null;
    }

    try {
      // Step 1: Classify the request
      const analysis = await this.classifyRequest(message.content);

      // Step 2: Handle based on classification
      if (!analysis.shouldDelegate) {
        // Simple request - respond directly
        const response = analysis.directResponse || 
          "I understand. How can I assist you further?";

        return createAgentMessage(
          MessageType.AGENT_RESPONSE,
          response,
          this.role,
          AgentRole.USER,
          { analysis }
        );
      }

      // Step 3: Complex request - create tasks and delegate
      const tasks = await this.createTasksForRequest(message.content, analysis);

      return createAgentMessage(
        MessageType.AGENT_RESPONSE,
        this.formatTaskPlan(tasks, analysis),
        this.role,
        AgentRole.USER,
        { tasks, analysis }
      );

    } catch (error) {
      console.error('Error processing message:', error);
      return createAgentMessage(
        MessageType.AGENT_RESPONSE,
        "I encountered an issue processing your request. Could you please try again?",
        this.role,
        AgentRole.USER
      );
    }
  }

  /**
   * Create tasks based on request analysis
   */
  private async createTasksForRequest(
    userRequest: string,
    analysis: RequestAnalysis
  ): Promise<Task[]> {
    const taskPrompt = `Based on this request and analysis, create a task breakdown.

User request: "${userRequest}"
Required agents: ${analysis.requiredAgents.join(', ')}
Complexity: ${analysis.complexity}

Create a concise task list. For medium complexity, create 1-2 tasks. For complex, create 3-5 tasks.

Respond with a JSON array of tasks in this format:
[
  {
    "id": "task-1",
    "title": "Task title",
    "description": "Detailed description",
    "assignee": "AgentRole",
    "priority": "high" | "medium" | "low",
    "dependencies": [],
    "estimatedTime": "1-2 days"
  }
]`;

    try {
      const response = await this.llm.chat([
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: taskPrompt }
      ]);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid task format');
      }

      const taskData = JSON.parse(jsonMatch[0]);
      
      return taskData.map((t: any) => ({
        id: t.id || `task-${Date.now()}-${Math.random()}`,
        title: t.title,
        description: t.description,
        assignee: t.assignee,
        status: TaskStatus.PENDING,
        priority: t.priority || 'medium',
        dependencies: t.dependencies || [],
        estimatedTime: t.estimatedTime,
        createdAt: new Date(),
      }));

    } catch (error) {
      console.error('Error creating tasks:', error);
      
      // Fallback: create a simple task for Alex
      return [{
        id: `task-${Date.now()}`,
        title: 'Handle user request',
        description: userRequest,
        assignee: AgentRole.ALEX,
        status: TaskStatus.PENDING,
        priority: 'high',
        dependencies: [],
        createdAt: new Date(),
      }];
    }
  }

  /**
   * Format task plan for user
   */
  private formatTaskPlan(tasks: Task[], analysis: RequestAnalysis): string {
    const intro = analysis.complexity === 'medium' 
      ? "I've analyzed your request. Here's what we'll do:"
      : "I've created a comprehensive plan for your project:";

    const taskList = tasks.map((task, index) => 
      `${index + 1}. **${task.title}** (${task.assignee})\n   ${task.description}\n   Estimated: ${task.estimatedTime || 'TBD'}`
    ).join('\n\n');

    const agents = [...new Set(tasks.map(t => t.assignee))].join(', ');
    const outro = `\nI'm assigning these tasks to: ${agents}\n\nThey'll start working on this right away!`;

    return `${intro}\n\n${taskList}${outro}`;
  }

  /**
   * Execute task (Mike doesn't execute, only delegates)
   */
  async executeTask(task: Task): Promise<Task> {
    task.status = TaskStatus.COMPLETED;
    task.result = {
      message: 'Task delegated to team members',
    };
    return task;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return 'Mike';
  }
}