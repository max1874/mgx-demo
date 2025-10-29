/**
 * Mike Agent - Team Leader
 * 
 * Mike is responsible for:
 * - Analyzing user requirements
 * - Breaking down complex tasks
 * - Assigning tasks to appropriate team members
 * - Coordinating team collaboration
 * - Monitoring progress and ensuring quality
 */

import { BaseAgent, AgentConfig } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
  createTask,
} from './MessageProtocol';

const MIKE_SYSTEM_PROMPT = `You are Mike, an experienced Team Leader and Project Manager.

Your responsibilities:
1. Analyze user requirements and break them down into actionable tasks
2. Assign tasks to the most suitable team members based on their expertise:
   - Emma (Product Manager): Requirements analysis, PRD writing, user stories
   - Bob (System Architect): Technical architecture, system design, database schema
   - Alex (Full-stack Engineer): Frontend/backend development, code implementation
   - David (Data Analyst): Data processing, analysis, visualization
3. Coordinate team collaboration and resolve conflicts
4. Monitor progress and provide guidance
5. Ensure deliverables meet quality standards

Your communication style:
- Clear, concise, and professional
- Action-oriented with specific instructions
- Supportive and encouraging to team members
- Always consider the big picture and project goals

When analyzing a user request:
1. Understand the core requirement
2. Identify the project type (web app, data analysis, research, etc.)
3. Determine which team members are needed
4. Break down the work into specific tasks
5. Define priorities and dependencies
6. Communicate the plan clearly

Remember: You are the coordinator, not the executor. Delegate tasks appropriately.`;

export class MikeAgent extends BaseAgent {
  constructor(llmProvider: any) {
    const config: AgentConfig = {
      role: AgentRole.MIKE,
      name: 'Mike',
      description: 'Team Leader - Coordinates team members and manages workflow',
      systemPrompt: MIKE_SYSTEM_PROMPT,
      llmProvider,
    };
    super(config);
  }

  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.log(`Processing message: ${message.type} from ${message.from}`);

    // Handle user requests
    if (message.type === MessageType.USER_REQUEST) {
      return await this.handleUserRequest(message);
    }

    // Handle task completion reports
    if (message.type === MessageType.TASK_COMPLETED) {
      return await this.handleTaskCompletion(message);
    }

    // Handle questions from team members
    if (message.type === MessageType.AGENT_QUESTION) {
      return await this.handleAgentQuestion(message);
    }

    return null;
  }

  async executeTask(task: Task): Promise<Task> {
    this.log(`Executing task: ${task.title}`);

    try {
      // Mike's main task is to analyze and delegate
      if (task.title.includes('analyze') || task.title.includes('coordinate')) {
        const analysis = await this.analyzeRequirement(task.description);
        return this.updateTask(task, TaskStatus.COMPLETED, { analysis });
      }

      return this.updateTask(task, TaskStatus.COMPLETED);
    } catch (error) {
      this.log(`Task execution failed: ${error}`, 'error');
      return this.updateTask(task, TaskStatus.FAILED, undefined, String(error));
    }
  }

  canHandleTask(task: Task): boolean {
    // Mike handles coordination and analysis tasks
    const keywords = ['analyze', 'coordinate', 'plan', 'organize', 'manage'];
    return keywords.some(keyword => 
      task.title.toLowerCase().includes(keyword) ||
      task.description.toLowerCase().includes(keyword)
    );
  }

  /**
   * Handle user request and create task plan
   */
  private async handleUserRequest(message: AgentMessage): Promise<AgentMessage> {
    this.log('Analyzing user request...');

    const userRequest = message.content;

    if (this.isSimpleGreeting(userRequest)) {
      const greetingResponse =
        "Hello there! I'm Mike, the team lead. I'd love to help you build something awesome.\n\n" +
        "Could you share a bit more detail about what you're trying to achieve? For example:\n" +
        "- What do you want to build or explore?\n" +
        "- Who is it for?\n" +
        "- Any specific features or constraints?\n\n" +
        "Once I have more context, I can bring in the right teammates to assist!";

      return this.sendMessage(
        MessageType.AGENT_MESSAGE,
        greetingResponse
      );
    }
    
    // Analyze the request using LLM
    const analysisPrompt = `Analyze this user request and create a task breakdown:

User Request: "${userRequest}"

Please provide:
1. Project type (web app, data analysis, research, etc.)
2. Required team members (Emma, Bob, Alex, David)
3. Task breakdown with priorities
4. Estimated complexity (simple/medium/complex)

Format your response as a structured plan.`;

    try {
      const analysis = await this.generateResponse(analysisPrompt);
      
      // Create tasks based on analysis
      const tasks = this.createTasksFromAnalysis(analysis, userRequest);

      const responseParts = [
        "I've analyzed your request. Here's what I found:\n",
        analysis.trim(),
      ];

      if (tasks.length > 0) {
        responseParts.push("\nI'm assigning tasks to the team now.");
      } else {
        responseParts.push(
          "\nIt looks like we need a bit more information before the team can jump in." +
          " Feel free to clarify your goals or add any requirements, and I'll take it from there."
        );
      }

      const metadata: Record<string, unknown> = { analysis };
      if (tasks.length > 0) {
        metadata.tasks = tasks;
      }
      
      // Send response with optional task assignments
      return this.sendMessage(
        MessageType.AGENT_MESSAGE,
        responseParts.join('\n'),
        undefined,
        metadata
      );
    } catch (error) {
      this.log(`Error analyzing request: ${error}`, 'error');
      return this.sendMessage(
        MessageType.SYSTEM_ERROR,
        `I encountered an error analyzing your request. Please try again or rephrase your requirement.`
      );
    }
  }

  /**
   * Handle task completion from team members
   */
  private async handleTaskCompletion(message: AgentMessage): Promise<AgentMessage> {
    this.log(`Task completed by ${message.from}`);

    const response = `Great work, ${message.from}! I've reviewed your completion. ${
      this.context?.tasks.every(t => t.status === TaskStatus.COMPLETED)
        ? 'All tasks are now complete!'
        : 'Moving on to the next task.'
    }`;

    return this.sendMessage(
      MessageType.AGENT_MESSAGE,
      response,
      message.from
    );
  }

  /**
   * Handle questions from team members
   */
  private async handleAgentQuestion(message: AgentMessage): Promise<AgentMessage> {
    this.log(`Question from ${message.from}: ${message.content}`);

    const response = await this.generateResponse(
      `Team member ${message.from} has a question: "${message.content}"\n\nProvide clear guidance.`,
      this.context?.messages
    );

    return this.sendMessage(
      MessageType.AGENT_RESPONSE,
      response,
      message.from
    );
  }

  /**
   * Analyze user requirement
   */
  private async analyzeRequirement(requirement: string): Promise<string> {
    const prompt = `As a project manager, analyze this requirement and provide:
1. Key objectives
2. Success criteria
3. Potential challenges
4. Recommended approach

Requirement: "${requirement}"`;

    return await this.generateResponse(prompt);
  }

  /**
   * Create tasks from LLM analysis
   */
  private createTasksFromAnalysis(analysis: string, userRequest: string): Task[] {
    const tasks: Task[] = [];
    const normalizedAnalysis = analysis.toLowerCase();

    const insufficientSignals = [
      'need more information',
      'need more details',
      'too vague',
      'not enough information',
      'insufficient detail',
      'provide more details',
      'clarify',
      'unclear requirements',
    ];

    if (insufficientSignals.some(signal => normalizedAnalysis.includes(signal))) {
      return tasks;
    }

    // Parse analysis to determine which agents are needed
    const needsEmma = normalizedAnalysis.includes('emma') || 
                     normalizedAnalysis.includes('requirements') ||
                     normalizedAnalysis.includes('prd');
    
    const needsBob = normalizedAnalysis.includes('bob') ||
                    normalizedAnalysis.includes('architecture') ||
                    normalizedAnalysis.includes('design');
    
    const needsAlex = normalizedAnalysis.includes('alex') ||
                     normalizedAnalysis.includes('code') ||
                     normalizedAnalysis.includes('implement');
    
    const needsDavid = normalizedAnalysis.includes('david') ||
                      normalizedAnalysis.includes('data') ||
                      normalizedAnalysis.includes('analysis');

    // Create tasks based on needs
    if (needsEmma) {
      tasks.push(createTask(
        'Requirements Analysis',
        `Analyze user request and create PRD: ${userRequest}`,
        AgentRole.EMMA,
        { priority: 'high' }
      ));
    }

    if (needsBob) {
      tasks.push(createTask(
        'System Architecture Design',
        `Design system architecture for: ${userRequest}`,
        AgentRole.BOB,
        { 
          priority: 'high',
          dependencies: needsEmma ? [tasks[0].id] : undefined
        }
      ));
    }

    if (needsAlex) {
      tasks.push(createTask(
        'Implementation',
        `Implement the solution for: ${userRequest}`,
        AgentRole.ALEX,
        { 
          priority: 'high',
          dependencies: needsBob ? [tasks[tasks.length - 1].id] : undefined
        }
      ));
    }

    if (needsDavid) {
      tasks.push(createTask(
        'Data Analysis',
        `Perform data analysis for: ${userRequest}`,
        AgentRole.DAVID,
        { priority: 'medium' }
      ));
    }

    return tasks;
  }

  /**
   * Detect simple greetings to avoid over-delegating work
   */
  private isSimpleGreeting(input: string): boolean {
    const normalized = input
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, '');

    if (!normalized) {
      return false;
    }

    const greetingPhrases = [
      'hi',
      'hey',
      'hello',
      'hiya',
      'yo',
      'sup',
      'good morning',
      'good afternoon',
      'good evening',
    ];

    if (greetingPhrases.includes(normalized)) {
      return true;
    }

    if (normalized.length <= 20) {
      return greetingPhrases.some(phrase =>
        normalized.startsWith(phrase) && normalized.split(/\s+/).length <= 3
      );
    }

    return false;
  }
}
