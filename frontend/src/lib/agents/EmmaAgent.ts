/**
 * Emma Agent - Product Manager
 * 
 * Emma is responsible for:
 * - Analyzing user requirements and creating detailed PRDs
 * - Writing user stories and acceptance criteria
 * - Conducting competitive analysis
 * - Defining product features and priorities
 * - Creating product roadmaps
 */

import { BaseAgent, AgentConfig } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
} from './MessageProtocol';

const EMMA_SYSTEM_PROMPT = `You are Emma, an experienced Product Manager with expertise in requirements analysis and product strategy.

Your responsibilities:
1. Analyze user requirements and translate them into clear, actionable specifications
2. Write comprehensive Product Requirements Documents (PRDs)
3. Create user stories with clear acceptance criteria
4. Define product features, priorities, and success metrics
5. Conduct competitive analysis and market research
6. Ensure alignment between user needs and technical implementation

Your communication style:
- Clear, structured, and user-focused
- Always consider the "why" behind requirements
- Think from the user's perspective
- Balance business goals with user needs
- Provide concrete examples and scenarios

When analyzing requirements:
1. Understand the user's problem or goal
2. Identify the target audience and use cases
3. Define core features and MVP scope
4. Specify functional and non-functional requirements
5. Create user stories with acceptance criteria
6. Define success metrics and KPIs
7. Consider edge cases and error scenarios

PRD Structure:
## Product Overview
- Problem statement
- Target users
- Goals and objectives

## Features
- Core features (MVP)
- Nice-to-have features
- Out of scope

## User Stories
- As a [user type], I want to [action], so that [benefit]
- Acceptance criteria for each story

## Technical Requirements
- Functional requirements
- Non-functional requirements (performance, security, etc.)
- Constraints and dependencies

## Success Metrics
- Key Performance Indicators (KPIs)
- User satisfaction metrics
- Business metrics

Remember: A good PRD should be clear enough for Bob (Architect) to design the system and Alex (Engineer) to implement it.`;

export class EmmaAgent extends BaseAgent {
  constructor(llmProvider: any) {
    const config: AgentConfig = {
      role: AgentRole.EMMA,
      name: 'Emma',
      description: 'Product Manager - Analyzes requirements and creates PRDs',
      systemPrompt: EMMA_SYSTEM_PROMPT,
      llmProvider,
    };
    super(config);
  }

  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.log(`Processing message: ${message.type} from ${message.from}`);

    // Handle task assignments from Mike
    if (message.type === MessageType.TASK_ASSIGNMENT && message.to === this.config.role) {
      return await this.handleTaskAssignment(message);
    }

    // Handle questions or clarifications
    if (message.type === MessageType.AGENT_MESSAGE && message.to === this.config.role) {
      return await this.handleMessage(message);
    }

    return null;
  }

  async executeTask(task: Task): Promise<Task> {
    this.log(`Executing task: ${task.title}`);

    try {
      // Notify that work has started
      this.sendMessage(
        MessageType.AGENT_MESSAGE,
        `Starting requirements analysis for: ${task.title}`,
        AgentRole.MIKE
      );

      // Analyze requirements
      const analysis = await this.analyzeRequirements(task.description);
      
      // Create PRD
      const prd = await this.createPRD(task.description, analysis);
      
      // Create user stories
      const userStories = await this.createUserStories(prd);

      // Return completed task with PRD and user stories
      return this.updateTask(task, TaskStatus.COMPLETED, {
        analysis,
        prd,
        userStories,
      });
    } catch (error) {
      this.log(`Task execution failed: ${error}`, 'error');
      
      // Ask for clarification if needed
      this.sendMessage(
        MessageType.AGENT_QUESTION,
        `I encountered an issue analyzing requirements for "${task.title}": ${error}. Could you provide more details about the user needs and goals?`,
        AgentRole.MIKE
      );

      return this.updateTask(task, TaskStatus.FAILED, undefined, String(error));
    }
  }

  canHandleTask(task: Task): boolean {
    // Emma handles requirements analysis, PRD writing, and product planning
    const keywords = [
      'requirements', 'requirement', 'analyze', 'analysis', 'prd',
      'product', 'feature', 'user story', 'specification', 'spec',
      'competitive', 'market', 'research', 'planning', 'roadmap'
    ];
    
    return keywords.some(keyword => 
      task.title.toLowerCase().includes(keyword) ||
      task.description.toLowerCase().includes(keyword)
    );
  }

  /**
   * Handle task assignment from Mike
   */
  private async handleTaskAssignment(message: AgentMessage): Promise<AgentMessage> {
    this.log('Received task assignment');

    const task = message.metadata?.task as Task;
    
    if (!task) {
      return this.sendMessage(
        MessageType.TASK_REJECTED,
        'No task details provided',
        message.from
      );
    }

    // Check if I can handle this task
    if (!this.canHandleTask(task)) {
      return this.sendMessage(
        MessageType.TASK_REJECTED,
        `This task seems outside my expertise. Perhaps ${this.suggestBetterAgent(task)} would be better suited?`,
        message.from
      );
    }

    // Accept the task
    return this.sendMessage(
      MessageType.TASK_ACCEPTED,
      `I'll start analyzing the requirements for "${task.title}" right away.`,
      message.from,
      { taskId: task.id }
    );
  }

  /**
   * Handle general messages
   */
  private async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const response = await this.generateResponse(
      message.content,
      this.context?.messages
    );

    return this.sendMessage(
      MessageType.AGENT_RESPONSE,
      response,
      message.from
    );
  }

  /**
   * Analyze user requirements
   */
  private async analyzeRequirements(description: string): Promise<string> {
    const prompt = `Analyze the following user requirement and provide a structured analysis:

Requirement: "${description}"

Please provide:
1. Problem Statement: What problem are we solving?
2. Target Users: Who will use this?
3. Core Use Cases: What are the main scenarios?
4. Key Features: What features are needed? (Prioritize as Must-have, Should-have, Nice-to-have)
5. Success Criteria: How do we measure success?
6. Assumptions and Constraints: What are we assuming? What are the limitations?

Be specific and actionable.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Create Product Requirements Document
   */
  private async createPRD(description: string, analysis: string): Promise<string> {
    const prompt = `Based on the requirement and analysis, create a comprehensive Product Requirements Document (PRD):

Requirement: "${description}"

Analysis:
${analysis}

Please create a PRD with the following structure:

# Product Requirements Document

## 1. Product Overview
- Problem Statement
- Target Users
- Goals and Objectives

## 2. Features
### Core Features (MVP)
- List must-have features

### Nice-to-have Features
- List optional features

### Out of Scope
- List what we won't build in this version

## 3. User Stories
For each core feature, provide:
- User story: "As a [user type], I want to [action], so that [benefit]"
- Acceptance criteria (specific, testable conditions)

## 4. Technical Requirements
### Functional Requirements
- List specific functionality

### Non-functional Requirements
- Performance requirements
- Security requirements
- Usability requirements

## 5. Success Metrics
- Key Performance Indicators (KPIs)
- User satisfaction metrics
- Business metrics

## 6. Assumptions and Constraints
- Technical constraints
- Business constraints
- Timeline constraints

Make it detailed, clear, and actionable for the development team.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Create user stories
   */
  private async createUserStories(prd: string): Promise<string[]> {
    const prompt = `Based on the PRD, extract and format all user stories as a list:

PRD:
${prd}

Provide user stories in this format:
- As a [user type], I want to [action], so that [benefit]
  - Acceptance Criteria:
    1. [Specific testable condition]
    2. [Specific testable condition]
    3. [Specific testable condition]

Return only the user stories list, one per line.`;

    const response = await this.generateResponse(prompt);
    
    // Split into individual user stories
    return response
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.trim());
  }

  /**
   * Suggest a better agent for the task
   */
  private suggestBetterAgent(task: Task): string {
    const description = task.description.toLowerCase();
    
    if (description.includes('architecture') || description.includes('design') || description.includes('technical')) {
      return 'Bob (System Architect)';
    }
    if (description.includes('code') || description.includes('implement') || description.includes('develop')) {
      return 'Alex (Full-stack Engineer)';
    }
    if (description.includes('data') || description.includes('analysis') || description.includes('visualization')) {
      return 'David (Data Analyst)';
    }
    
    return 'another team member';
  }
}