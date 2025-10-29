/**
 * Mike Agent - Team Leader
 * 
 * Responsibilities:
 * - Analyze user requests intelligently
 * - Classify request complexity
 * - Decide when to delegate vs respond directly
 * - Coordinate team members when needed
 * - Provide direct answers for simple queries
 * - Support streaming responses for real-time feedback
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

export class MikeAgent extends BaseAgent {
  constructor(llmProvider: LLMProvider) {
    super({
      role: AgentRole.MIKE,
      name: 'Mike',
      description: 'Team Leader - Analyzes requests, coordinates team, and provides direct answers',
      systemPrompt: MikeAgent.getSystemPromptText(),
      llmProvider,
    });
  }

  /**
   * Get system prompt with autonomous decision-making
   */
  private static getSystemPromptText(): string {
    return `You are Mike, an autonomous team leader with intelligent decision-making capabilities.

YOUR TEAM:
- Emma (Product Manager): Analyzes requirements, creates PRD, defines user stories
- Bob (System Architect): Designs architecture, selects tech stack, creates system design
- Alex (Full-stack Engineer): Implements features, writes code, handles deployment
- David (Data Analyst): Analyzes data, creates insights, builds visualizations

YOUR ROLE:
You are the central hub. For every user request, you autonomously decide:
1. Should I handle this myself?
2. Do I need to call any team members?
3. If yes, which ones and in what order?
4. How should I communicate the results back to the user?

DECISION-MAKING PROCESS:
Analyze each request independently. Consider:
- User's actual intent (not just keywords)
- Complexity and scope
- Required expertise
- Whether collaboration adds value

DO NOT use rigid rules or patterns. Think like a real team leader:
- "Hi, what can you do?" → Just answer directly, no need for team
- "Build a todo app" → This needs Emma (requirements) → Bob (design) → Alex (code)
- "Help me choose a database" → Bob can handle this alone
- "Analyze user retention" → David can handle this alone

CALLING SUB-AGENTS:
When you decide to call a sub-agent:
1. Clearly explain what you need them to do
2. Provide relevant context
3. Wait for their response
4. Review their work
5. Synthesize and present results to the user

You will receive sub-agent responses and should:
- Acknowledge their work
- Integrate it into your response
- Add your own insights
- Present a cohesive answer to the user

IMPORTANT:
- Think autonomously, don't follow rigid patterns
- You can call 0, 1, or multiple agents based on need
- You can call agents sequentially (wait for one before calling next)
- Always explain your reasoning to build user trust
- Maintain context across the conversation

RESPONSE FORMAT:
When calling agents, use JSON to structure your decision:
{
  "action": "delegate" | "respond",
  "reasoning": "why you made this decision",
  "agents_needed": ["Emma", "Bob", "Alex", "David"] or [],
  "response": "your message to the user"
}

When responding directly (no agents needed):
{
  "action": "respond",
  "reasoning": "this is a simple query that doesn't need team involvement",
  "agents_needed": [],
  "response": "your direct answer"
}`;
  }


  /**
   * Process message with autonomous LLM-driven decision making
   */
  async processMessageStreaming(
    message: AgentMessage,
    onChunk: (chunk: string) => void
  ): Promise<AgentMessage | null> {
    if (message.type !== MessageType.USER_REQUEST) {
      return null;
    }

    try {
      // Get conversation context
      const conversationHistory = this.context?.messages || [];
      const recentHistory = conversationHistory
        .slice(-5)
        .map(m => `${m.from}: ${m.content}`)
        .join('\n');

      // Ask Mike to autonomously decide what to do
      const decisionPrompt = `User request: "${message.content}"

Recent conversation:
${recentHistory || 'No previous messages'}

Analyze this request and decide autonomously:
1. Can you handle this yourself, or do you need to call team members?
2. If calling team members, who and why?
3. What should you tell the user?

Respond in this JSON format:
{
  "action": "respond" or "delegate",
  "reasoning": "your thinking process",
  "agents_needed": [] or ["Emma", "Bob", "Alex", "David"],
  "immediate_response": "what you'll tell the user right now"
}`;

      console.log('🤔 Mike: Making autonomous decision...');

      const decision = await this.generateResponse(decisionPrompt);
      console.log('💡 Mike decision:', decision);

      let parsedDecision;
      try {
        parsedDecision = JSON.parse(decision);
      } catch (e) {
        // Fallback: extract JSON from markdown code blocks
        const jsonMatch = decision.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          parsedDecision = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse decision JSON');
        }
      }

      // Stream Mike's immediate response
      const immediateResponse = parsedDecision.immediate_response || parsedDecision.response;
      for (let i = 0; i < immediateResponse.length; i++) {
        onChunk(immediateResponse[i]);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // If Mike decides to delegate, create tasks
      if (parsedDecision.action === 'delegate' && parsedDecision.agents_needed?.length > 0) {
        console.log('📋 Mike: Creating tasks for', parsedDecision.agents_needed);

        // Create context-rich tasks
        const tasks = await this.createContextualTasks(
          message.content,
          parsedDecision.agents_needed,
          parsedDecision.reasoning
        );

        return createAgentMessage(
          MessageType.AGENT_RESPONSE,
          immediateResponse,
          this.config.role,
          AgentRole.USER,
          {
            tasks,
            decision: parsedDecision,
            mikeReasoning: parsedDecision.reasoning
          }
        );
      }

      // Mike handles it directly
      console.log('✅ Mike: Handling directly');
      return createAgentMessage(
        MessageType.AGENT_RESPONSE,
        immediateResponse,
        this.config.role,
        AgentRole.USER,
        { decision: parsedDecision }
      );

    } catch (error) {
      console.error('❌ Mike: Error in autonomous decision:', error);
      const errorMsg = "I encountered an issue analyzing your request. Could you please rephrase it?";

      for (let i = 0; i < errorMsg.length; i++) {
        onChunk(errorMsg[i]);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      return createAgentMessage(
        MessageType.AGENT_RESPONSE,
        errorMsg,
        this.config.role,
        AgentRole.USER
      );
    }
  }

  /**
   * Process message (non-streaming, for backward compatibility)
   */
  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    // Use streaming version with no-op callback
    return this.processMessageStreaming(message, () => {});
  }

  /**
   * Create contextual tasks based on Mike's autonomous decision
   */
  private async createContextualTasks(
    userRequest: string,
    agentNames: string[],
    reasoning: string
  ): Promise<Task[]> {
    const agentMap: Record<string, AgentRole> = {
      'Emma': AgentRole.EMMA,
      'Bob': AgentRole.BOB,
      'Alex': AgentRole.ALEX,
      'David': AgentRole.DAVID
    };

    const requiredAgents = agentNames
      .map(name => agentMap[name])
      .filter(Boolean);

    // Ask LLM to create specific tasks with full context
    const taskPrompt = `You are Mike, creating specific work assignments for your team.

User's original request: "${userRequest}"

Your reasoning: "${reasoning}"

Team members you've chosen: ${agentNames.join(', ')}

For each team member, create a clear, specific task assignment that includes:
1. What they need to do (specific deliverable)
2. Why this is needed (context from user request)
3. What output format you expect
4. Any dependencies on other team members

Respond in JSON format:
{
  "tasks": [
    {
      "agent": "Emma" | "Bob" | "Alex" | "David",
      "title": "Brief, specific title",
      "description": "Detailed description including context and expected output",
      "depends_on": [] or ["Emma", "Bob", etc.]
    }
  ]
}

Remember: These are real work assignments, not generic templates. Be specific about what you need.`;

    try {
      const response = await this.generateResponse(taskPrompt);
      let parsed;

      try {
        parsed = JSON.parse(response);
      } catch (e) {
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          throw e;
        }
      }

      const tasks: Task[] = [];
      const taskIdMap: Record<string, string> = {};

      // Create tasks with IDs
      parsed.tasks.forEach((taskDef: any, index: number) => {
        const taskId = `task-${Date.now()}-${index}`;
        const agentRole = agentMap[taskDef.agent];

        if (agentRole && requiredAgents.includes(agentRole)) {
          taskIdMap[taskDef.agent] = taskId;

          tasks.push({
            id: taskId,
            title: taskDef.title,
            description: taskDef.description,
            assignee: agentRole,
            status: TaskStatus.PENDING,
            priority: 'high',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });

      // Set up dependencies
      parsed.tasks.forEach((taskDef: any, index: number) => {
        if (taskDef.depends_on && Array.isArray(taskDef.depends_on)) {
          const dependencyIds = taskDef.depends_on
            .map((dep: string) => taskIdMap[dep])
            .filter(Boolean);

          if (tasks[index]) {
            tasks[index].dependencies = dependencyIds;
          }
        }
      });

      console.log('📋 Mike created contextual tasks:', tasks);
      return tasks;

    } catch (error) {
      console.error('Failed to create contextual tasks:', error);
      // Fallback to simple task creation
      return this.createSimpleTasks(userRequest, requiredAgents);
    }
  }

  /**
   * Fallback: Create simple tasks if LLM task generation fails
   */
  private createSimpleTasks(userRequest: string, requiredAgents: AgentRole[]): Task[] {
    return requiredAgents.map((agent, index) => {
      const taskId = `task-${Date.now()}-${index}`;
      return {
        id: taskId,
        title: `${this.getAgentName(agent)}: ${userRequest.substring(0, 50)}`,
        description: `${userRequest}\n\nPlease provide your expertise on this request.`,
        assignee: agent,
        status: TaskStatus.PENDING,
        priority: 'high',
        dependencies: index > 0 ? [`task-${Date.now()}-${index - 1}`] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }

  /**
   * Get friendly agent name
   */
  private getAgentName(role: AgentRole): string {
    const names: Partial<Record<AgentRole, string>> = {
      [AgentRole.USER]: 'User',
      [AgentRole.MIKE]: 'Mike',
      [AgentRole.EMMA]: 'Emma',
      [AgentRole.BOB]: 'Bob',
      [AgentRole.ALEX]: 'Alex',
      [AgentRole.DAVID]: 'David',
      [AgentRole.SYSTEM]: 'System',
    };
    return names[role] || role;
  }

  /**
   * Execute task (Mike coordinates but doesn't execute directly)
   */
  async executeTask(task: Task, _onChunk?: (chunk: string) => void): Promise<Task> {
    task.status = TaskStatus.COMPLETED;
    task.result = {
      coordination: 'Task coordinated and delegated to team members',
      completedAt: new Date().toISOString(),
    };
    task.updatedAt = new Date();
    return task;
  }

  /**
   * Check if Mike can handle this task
   */
  canHandleTask(task: Task): boolean {
    // Mike handles coordination and planning tasks
    const keywords = ['coordinate', 'plan', 'organize', 'analyze requirements'];
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    return keywords.some(keyword => taskText.includes(keyword));
  }
}