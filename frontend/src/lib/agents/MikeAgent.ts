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

/**
 * Request classification result
 */
interface RequestAnalysis {
  type: 'chat' | 'query' | 'simple_task' | 'development';
  complexity: 'simple' | 'medium' | 'complex';
  requiredAgents: AgentRole[];
  shouldDelegate: boolean;
  reasoning: string;
  directResponse?: string;
}

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
   * Get system prompt with intelligent request handling
   */
  private static getSystemPromptText(): string {
    return `You are Mike, an intelligent team leader who knows when to handle requests directly vs when to delegate.

CORE RESPONSIBILITIES:
1. Analyze user intent and request complexity
2. Respond directly to simple queries and conversations
3. Delegate complex tasks to appropriate team members
4. Coordinate team collaboration when needed

DECISION FRAMEWORK:

RESPOND DIRECTLY (No delegation) when:
- Simple greetings (hi, hello, how are you)
- Basic questions about the system
- Language preference changes
- Clarification requests
- General conversation
- Simple information queries

Examples:
- "hi" → Greet warmly and ask how you can help
- "Answer in Simplified Chinese" → Confirm and switch to Chinese
- "What can you do?" → Explain team capabilities
- "Thanks" → Acknowledge politely

DELEGATE TO SINGLE AGENT when:
- Single feature implementation
- Specific technical question
- Data analysis request
- Design consultation

Examples:
- "Create a login form" → Assign to Alex (Engineer)
- "Analyze user data" → Assign to David (Data Analyst)
- "Design database schema" → Assign to Bob (Architect)

FULL TEAM COLLABORATION when:
- Complete system development
- Multi-feature projects
- Complex architectural decisions
- End-to-end product development

Examples:
- "Build an e-commerce platform" → Emma, Bob, Alex, David
- "Create a social media app" → Full team coordination

TEAM MEMBERS:
- Emma (Product Manager): Requirements, PRD, user stories
- Bob (System Architect): Architecture, tech stack, design patterns
- Alex (Full-stack Engineer): Implementation, coding, deployment
- David (Data Analyst): Data analysis, insights, visualizations

RESPONSE GUIDELINES:
1. For simple requests: Answer directly in 2-3 sentences
2. For medium requests: Brief analysis + delegate to 1-2 agents
3. For complex requests: Detailed breakdown + full team coordination
4. Always be conversational and helpful
5. Avoid over-engineering simple requests
6. Ask clarifying questions when intent is unclear

LANGUAGE HANDLING:
- If user requests Chinese, respond in Chinese immediately
- No need to create tasks for language preference changes
- Just acknowledge and continue in requested language

Remember: Not every message needs a project plan. Be smart about what actually requires team involvement.`;
  }

  /**
   * Classify request intelligently
   */
  private async classifyRequest(userMessage: string): Promise<RequestAnalysis> {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Simple greetings and chat
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const thanks = ['thanks', 'thank you', 'thx', 'appreciate'];
    
    if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' '))) {
      return {
        type: 'chat',
        complexity: 'simple',
        requiredAgents: [],
        shouldDelegate: false,
        reasoning: 'Simple greeting - respond directly',
        directResponse: 'Hello! I\'m Mike, your team leader. How can I help you today? I can coordinate our team to build software, analyze data, or answer questions about our capabilities.'
      };
    }

    if (thanks.some(t => lowerMessage.includes(t))) {
      return {
        type: 'chat',
        complexity: 'simple',
        requiredAgents: [],
        shouldDelegate: false,
        reasoning: 'Gratitude expression - acknowledge politely',
        directResponse: 'You\'re welcome! Let me know if you need anything else.'
      };
    }

    // Language preference changes
    if (lowerMessage.includes('chinese') || lowerMessage.includes('中文')) {
      return {
        type: 'query',
        complexity: 'simple',
        requiredAgents: [],
        shouldDelegate: false,
        reasoning: 'Language preference - confirm and switch',
        directResponse: '好的！我现在会用简体中文回复。有什么我可以帮助你的吗？'
      };
    }

    // System capability queries
    const capabilityQueries = ['what can you do', 'what are you', 'who are you', 'help', 'capabilities'];
    if (capabilityQueries.some(q => lowerMessage.includes(q))) {
      return {
        type: 'query',
        complexity: 'simple',
        requiredAgents: [],
        shouldDelegate: false,
        reasoning: 'System capability query - explain directly',
        directResponse: `I'm Mike, leading a team of AI agents:
- Emma (Product Manager): Defines requirements and creates PRDs
- Bob (System Architect): Designs system architecture
- Alex (Full-stack Engineer): Implements features and writes code
- David (Data Analyst): Analyzes data and creates insights

We can help you build software, analyze data, design systems, or answer technical questions. What would you like to work on?`
      };
    }

    // Use LLM for complex classification
    const classificationPrompt = `Analyze this user request and classify it:

User message: "${userMessage}"

Classify as:
1. Type: chat | query | simple_task | development
2. Complexity: simple | medium | complex
3. Required agents: [] for none, or list from [Emma, Bob, Alex, David]
4. Should delegate: true/false

Guidelines:
- "chat": Greetings, thanks, casual conversation → No agents
- "query": Questions about system, capabilities → No agents
- "simple_task": Single feature, small change → 1 agent (usually Alex)
- "development": Full project, multiple features → Multiple agents

Examples:
- "hi" → chat, simple, [], false
- "create a button" → simple_task, simple, [Alex], true
- "build a todo app" → development, medium, [Emma, Alex], true
- "build e-commerce platform" → development, complex, [Emma, Bob, Alex, David], true

Respond in JSON format:
{
  "type": "...",
  "complexity": "...",
  "requiredAgents": [...],
  "shouldDelegate": true/false,
  "reasoning": "..."
}`;

    try {
      const response = await this.generateResponse(classificationPrompt);

      const analysis = JSON.parse(response);
      
      // Map agent names to roles
      const agentMap: Record<string, AgentRole> = {
        'Emma': AgentRole.EMMA,
        'Bob': AgentRole.BOB,
        'Alex': AgentRole.ALEX,
        'David': AgentRole.DAVID
      };

      return {
        type: analysis.type,
        complexity: analysis.complexity,
        requiredAgents: analysis.requiredAgents.map((name: string) => agentMap[name]).filter(Boolean),
        shouldDelegate: analysis.shouldDelegate,
        reasoning: analysis.reasoning
      };
    } catch (error) {
      console.error('Classification failed, defaulting to safe classification:', error);
      // Default to medium complexity if classification fails
      return {
        type: 'development',
        complexity: 'medium',
        requiredAgents: [AgentRole.ALEX],
        shouldDelegate: true,
        reasoning: 'Classification failed - defaulting to safe delegation'
      };
    }
  }

  /**
   * Process message with streaming support
   */
  async processMessageStreaming(
    message: AgentMessage,
    onChunk: (chunk: string) => void
  ): Promise<AgentMessage | null> {
    if (message.type !== MessageType.USER_REQUEST) {
      return null;
    }

    try {
      // Step 1: Classify the request (non-streaming, fast)
      const analysis = await this.classifyRequest(message.content);
      
      console.log('Request Analysis:', analysis);

      // Step 2: Handle based on classification
      if (!analysis.shouldDelegate) {
        // Simple request - use streaming for direct response
        if (analysis.directResponse) {
          // For pre-defined responses, simulate streaming
          const response = analysis.directResponse;
          for (let i = 0; i < response.length; i++) {
            onChunk(response[i]);
            // Small delay to simulate typing effect
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          return createAgentMessage(
            MessageType.AGENT_RESPONSE,
            response,
            this.config.role,
            AgentRole.USER,
            { analysis }
          );
        }

        // Generate streaming response using LLM
        const fullResponse = await this.generateStreamingResponse(
          message.content,
          onChunk
        );

        return createAgentMessage(
          MessageType.AGENT_RESPONSE,
          fullResponse,
          this.config.role,
          AgentRole.USER,
          { analysis }
        );
      }

      // Step 3: Complex request - stream the analysis, then create tasks
      if (analysis.complexity === 'simple' && analysis.requiredAgents.length === 1) {
        // Single agent task - stream the delegation message
        const agentName = this.getAgentName(analysis.requiredAgents[0]);
        const response = `I'll help you with that. Let me assign this to ${agentName}.`;
        
        // Stream the response
        for (let i = 0; i < response.length; i++) {
          onChunk(response[i]);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const tasks: Task[] = [{
          id: `task-${Date.now()}`,
          title: message.content.substring(0, 50),
          description: message.content,
          assignee: analysis.requiredAgents[0],
          status: TaskStatus.PENDING,
          priority: 'high',
          createdAt: new Date(),
          updatedAt: new Date(),
        }];

        return createAgentMessage(
          MessageType.AGENT_RESPONSE,
          response,
          this.config.role,
          AgentRole.USER,
          { tasks, analysis }
        );
      }

      // Complex project - stream the full analysis
      const analysisPrompt = `Analyze this project request and create a detailed plan:

User Request: "${message.content}"

Complexity: ${analysis.complexity}
Required Team: ${analysis.requiredAgents.map(a => this.getAgentName(a)).join(', ')}

Provide:
1. Project overview (2-3 sentences)
2. Task breakdown for each team member
3. Estimated timeline
4. Dependencies

Format as a clear, structured response.`;

      const planResponse = await this.generateStreamingResponse(
        analysisPrompt,
        onChunk
      );

      // Create detailed, structured tasks for team members
      const tasks = await this.createDetailedTasks(message.content, analysis.requiredAgents);

      return createAgentMessage(
        MessageType.AGENT_RESPONSE,
        planResponse,
        this.config.role,
        AgentRole.USER,
        { tasks, analysis }
      );

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMsg = "I encountered an issue processing your request. Could you please try again?";
      
      // Stream error message
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
   * Create detailed, structured tasks for each agent (inspired by MetaGPT)
   */
  private async createDetailedTasks(userRequest: string, requiredAgents: AgentRole[]): Promise<Task[]> {
    const taskPrompt = `Break down this project into specific, actionable tasks for each team member.

Project: "${userRequest}"

Team members: ${requiredAgents.map(a => this.getAgentName(a)).join(', ')}

For each team member, define:
1. Title: Clear, specific task title
2. Description: Detailed description of what they need to deliver
3. Expected Output: What concrete deliverable they should produce

Team member roles:
- Emma (Product Manager): Create PRD, user stories, requirements
- Bob (System Architect): Design architecture, tech stack, data models
- Alex (Full-stack Engineer): Implement features, write code
- David (Data Analyst): Analyze data requirements, create insights

Respond in JSON format:
{
  "tasks": [
    {
      "agent": "Emma",
      "title": "...",
      "description": "...",
      "expectedOutput": "...",
      "dependencies": []
    },
    ...
  ]
}

Set dependencies:
- Bob depends on Emma (needs PRD)
- Alex depends on Bob (needs architecture)
- David can work in parallel or depend on Emma`;

    try {
      const response = await this.generateResponse(taskPrompt);
      const parsed = JSON.parse(response);

      // Map to Task objects with proper dependencies
      const agentMap: Record<string, AgentRole> = {
        'Emma': AgentRole.EMMA,
        'Bob': AgentRole.BOB,
        'Alex': AgentRole.ALEX,
        'David': AgentRole.DAVID
      };

      const tasks: Task[] = [];
      const taskIdMap: Record<string, string> = {};

      // First pass: Create all tasks
      parsed.tasks.forEach((taskDef: any, index: number) => {
        const taskId = `task-${Date.now()}-${index}`;
        const agentRole = agentMap[taskDef.agent];

        if (agentRole && requiredAgents.includes(agentRole)) {
          taskIdMap[taskDef.agent] = taskId;

          tasks.push({
            id: taskId,
            title: taskDef.title,
            description: `${taskDef.description}\n\n**Expected Output:**\n${taskDef.expectedOutput}`,
            assignee: agentRole,
            status: TaskStatus.PENDING,
            priority: 'high',
            dependencies: [], // Will be filled in second pass
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });

      // Second pass: Set up dependencies
      parsed.tasks.forEach((taskDef: any, index: number) => {
        if (taskDef.dependencies && Array.isArray(taskDef.dependencies)) {
          const dependencyIds = taskDef.dependencies
            .map((dep: string) => taskIdMap[dep])
            .filter(Boolean);

          if (tasks[index]) {
            tasks[index].dependencies = dependencyIds;
          }
        }
      });

      console.log('Created detailed tasks:', tasks);
      return tasks;

    } catch (error) {
      console.error('Failed to create detailed tasks, falling back to simple tasks:', error);

      // Fallback: Create simple tasks
      return requiredAgents.map((agent, index) => {
        const taskId = `task-${Date.now()}-${index}`;
        let dependencies: string[] = [];

        // Simple dependency chain: Emma → Bob → Alex
        if (agent === AgentRole.BOB && index > 0) {
          dependencies = [`task-${Date.now()}-${index - 1}`];
        } else if (agent === AgentRole.ALEX && index > 1) {
          dependencies = [`task-${Date.now()}-${index - 1}`];
        }

        return {
          id: taskId,
          title: `${this.getAgentName(agent)}: ${userRequest}`,
          description: this.getDefaultTaskDescription(agent, userRequest),
          assignee: agent,
          status: TaskStatus.PENDING,
          priority: 'high',
          dependencies,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
    }
  }

  /**
   * Get default task description for an agent
   */
  private getDefaultTaskDescription(agent: AgentRole, userRequest: string): string {
    switch (agent) {
      case AgentRole.EMMA:
        return `Analyze the project requirements and create a Product Requirements Document (PRD) for: ${userRequest}\n\n**Expected Output:**\n- User stories\n- Feature requirements\n- Success criteria`;

      case AgentRole.BOB:
        return `Design the system architecture for: ${userRequest}\n\n**Expected Output:**\n- Architecture diagram\n- Technology stack recommendations\n- Data model design\n- API specifications`;

      case AgentRole.ALEX:
        return `Implement the features for: ${userRequest}\n\n**Expected Output:**\n- Implementation plan\n- Code structure\n- Key components\n- Deployment guide`;

      case AgentRole.DAVID:
        return `Analyze data requirements and create insights for: ${userRequest}\n\n**Expected Output:**\n- Data analysis\n- Metrics recommendations\n- Dashboard design`;

      default:
        return `Work on: ${userRequest}`;
    }
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
  async executeTask(task: Task): Promise<Task> {
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