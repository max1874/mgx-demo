/**
 * Bob Agent - System Architect
 * 
 * Bob is responsible for:
 * - Designing system architecture and technical solutions
 * - Selecting appropriate technologies and frameworks
 * - Creating architecture diagrams and documentation
 * - Defining data models and database schemas
 * - Ensuring scalability, security, and best practices
 */

import { BaseAgent, AgentConfig } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
} from './MessageProtocol';

const BOB_SYSTEM_PROMPT = `You are Bob, an experienced System Architect with deep expertise in software design and technical architecture.

Your responsibilities:
1. Design scalable, maintainable system architectures
2. Select appropriate technologies, frameworks, and tools
3. Create technical documentation and architecture diagrams
4. Define data models, database schemas, and API contracts
5. Ensure security, performance, and reliability
6. Apply design patterns and best practices
7. Consider trade-offs and make informed technical decisions

Your communication style:
- Technical but clear and understandable
- Always explain the "why" behind architectural decisions
- Consider multiple options and trade-offs
- Focus on long-term maintainability
- Balance ideal solutions with practical constraints

When designing architecture:
1. Understand the requirements and constraints
2. Identify key components and their responsibilities
3. Define interfaces and data flow between components
4. Choose appropriate design patterns
5. Select technology stack based on requirements
6. Consider scalability, security, and performance
7. Document decisions and rationale

Technology preferences:
- Frontend: React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, Storage, Realtime)
- State Management: Zustand
- Code Editor: Monaco Editor
- Deployment: Vercel (frontend), Supabase (backend)

Architecture documentation should include:
## System Architecture
- High-level architecture diagram (use PlantUML or Mermaid syntax)
- Component descriptions and responsibilities
- Data flow and communication patterns

## Technology Stack
- Frontend technologies and rationale
- Backend technologies and rationale
- Third-party services and integrations

## Data Model
- Database schema (tables, relationships, constraints)
- Entity-Relationship diagram
- Data access patterns

## API Design
- Endpoint definitions
- Request/response formats
- Authentication and authorization

## Non-functional Requirements
- Scalability strategy
- Security measures
- Performance optimizations
- Error handling and logging

## Deployment Architecture
- Infrastructure components
- CI/CD pipeline
- Monitoring and alerting

Remember: Your architecture should be clear enough for Alex (Engineer) to implement and maintainable for future developers.`;

export class BobAgent extends BaseAgent {
  constructor(llmProvider: any) {
    const config: AgentConfig = {
      role: AgentRole.BOB,
      name: 'Bob',
      description: 'System Architect - Designs technical architecture and system design',
      systemPrompt: BOB_SYSTEM_PROMPT,
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
        `Starting architecture design for: ${task.title}`,
        AgentRole.MIKE
      );

      // Design architecture
      const architecture = await this.designArchitecture(task.description);
      
      // Select technology stack
      const techStack = await this.selectTechnology(task.description, architecture);
      
      // Create data model
      const dataModel = await this.createDataModel(task.description, architecture);

      // Return completed task with architecture documentation
      return this.updateTask(task, TaskStatus.COMPLETED, {
        architecture,
        techStack,
        dataModel,
      });
    } catch (error) {
      this.log(`Task execution failed: ${error}`, 'error');
      
      // Ask for clarification if needed
      this.sendMessage(
        MessageType.AGENT_QUESTION,
        `I encountered an issue designing architecture for "${task.title}": ${error}. Could you provide more details about the technical requirements and constraints?`,
        AgentRole.MIKE
      );

      return this.updateTask(task, TaskStatus.FAILED, undefined, String(error));
    }
  }

  canHandleTask(task: Task): boolean {
    // Bob handles architecture design, system design, and technical planning
    const keywords = [
      'architecture', 'design', 'system', 'technical', 'technology',
      'database', 'schema', 'api', 'infrastructure', 'deployment',
      'scalability', 'security', 'performance', 'integration'
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
      `I'll start designing the architecture for "${task.title}" right away.`,
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
   * Design system architecture
   */
  private async designArchitecture(description: string): Promise<string> {
    const prompt = `Design a system architecture for the following requirement:

Requirement: "${description}"

Please provide a comprehensive architecture design with:

# System Architecture

## 1. High-Level Architecture
Describe the overall architecture using a diagram (PlantUML or Mermaid syntax).
Include:
- Frontend layer
- Backend layer
- Database layer
- External services
- Communication patterns

## 2. Component Design
For each major component:
- Component name and purpose
- Key responsibilities
- Interfaces (inputs/outputs)
- Dependencies

## 3. Data Flow
Describe how data flows through the system:
- User interactions
- API calls
- Database operations
- Real-time updates

## 4. Design Patterns
Identify design patterns to use:
- Architectural patterns (MVC, layered, etc.)
- Component patterns
- Data patterns

## 5. Key Technical Decisions
For each major decision:
- Decision made
- Rationale
- Trade-offs considered
- Alternatives rejected

Use our standard tech stack:
- Frontend: React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, Storage, Realtime)
- Deployment: Vercel + Supabase

Be specific and technical, but explain concepts clearly.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Select technology stack
   */
  private async selectTechnology(description: string, architecture: string): Promise<string> {
    const prompt = `Based on the requirement and architecture, recommend the specific technology stack:

Requirement: "${description}"

Architecture:
${architecture}

Please provide:

# Technology Stack

## Frontend
- Framework and version
- UI component library
- State management
- Routing
- Form handling
- Data fetching
- Testing framework

## Backend
- Runtime/framework
- Database
- Authentication
- File storage
- Real-time communication
- API design (REST/GraphQL)

## Development Tools
- Build tools
- Code quality (linting, formatting)
- Version control
- CI/CD

## Third-party Services
- Analytics
- Error tracking
- Monitoring
- Email service
- Payment processing (if needed)

For each technology choice, explain:
- Why it's suitable for this project
- Key benefits
- Potential drawbacks
- Alternatives considered

Focus on our standard stack but suggest additions if needed.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Create data model
   */
  private async createDataModel(description: string, architecture: string): Promise<string> {
    const prompt = `Based on the requirement and architecture, design the data model:

Requirement: "${description}"

Architecture:
${architecture}

Please provide:

# Data Model

## 1. Database Schema
For each table:
\`\`\`sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_name TYPE CONSTRAINTS,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## 2. Relationships
Describe relationships between tables:
- One-to-many
- Many-to-many
- Foreign keys

## 3. Indexes
Identify columns that need indexes for performance:
\`\`\`sql
CREATE INDEX index_name ON table_name(column_name);
\`\`\`

## 4. Row Level Security (RLS)
Define Supabase RLS policies for each table:
\`\`\`sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name" ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);
\`\`\`

## 5. Entity-Relationship Diagram
Provide an ER diagram (PlantUML or Mermaid syntax)

## 6. Data Access Patterns
Describe common queries and operations:
- Read patterns
- Write patterns
- Update patterns
- Delete patterns

Use PostgreSQL syntax and Supabase best practices.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Suggest a better agent for the task
   */
  private suggestBetterAgent(task: Task): string {
    const description = task.description.toLowerCase();
    
    if (description.includes('requirements') || description.includes('prd') || description.includes('user story')) {
      return 'Emma (Product Manager)';
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