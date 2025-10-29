/**
 * David Agent - Data Analyst
 * 
 * Responsibilities:
 * - Analyze data and generate insights
 * - Create visualizations
 * - Build dashboards
 * - Perform statistical analysis
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

export class DavidAgent extends BaseAgent {
  constructor(llmProvider: LLMProvider) {
    super({
      role: AgentRole.DAVID,
      name: 'David',
      description: 'Data Analyst - Analyzes data and creates insights',
      systemPrompt: DavidAgent.getSystemPromptText(),
      llmProvider,
    });
  }

  /**
   * Get system prompt for David
   */
  private static getSystemPromptText(): string {
    return `You are David, a skilled data analyst.

RESPONSIBILITIES:
- Analyze data and extract insights
- Create data visualizations
- Build interactive dashboards
- Perform statistical analysis
- Identify trends and patterns

ANALYSIS APPROACH:
1. Understand the business question
2. Explore and clean data
3. Apply appropriate analysis methods
4. Visualize findings
5. Communicate insights clearly

TOOLS & TECHNIQUES:
- Python (pandas, numpy, matplotlib, seaborn)
- SQL for data querying
- Statistical methods
- Machine learning basics
- Data visualization best practices

VISUALIZATION PRINCIPLES:
- Choose appropriate chart types
- Keep it simple and clear
- Highlight key insights
- Use color effectively
- Make it interactive when possible

When analyzing data:
1. Define the objective
2. Examine data quality
3. Perform exploratory analysis
4. Apply statistical methods
5. Create visualizations
6. Summarize key findings

Always focus on actionable insights.`;
  }

  /**
   * Process incoming message
   */
  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    if (message.type === MessageType.TASK_ASSIGNMENT) {
      this.log('Received task assignment');

      const task = message.metadata?.task as Task;
      if (!task) {
        return createAgentMessage(
          MessageType.TASK_REJECTED,
          'No task information provided',
          this.config.role,
          message.from
        );
      }

      // Accept the task
      this.log(`Accepting task: ${task.title}`);
      return createAgentMessage(
        MessageType.TASK_ACCEPTED,
        `I'll analyze the data for: ${task.title}`,
        this.config.role,
        message.from
      );
    }

    return null;
  }

  /**
   * Execute assigned task
   */
  async executeTask(task: Task, onChunk?: (chunk: string) => void): Promise<Task> {
    this.log(`Executing task: ${task.title}`);

    try {
      // Generate data analysis
      const analysisPrompt = `As a data analyst, analyze this request:

Task: ${task.title}
Description: ${task.description}

Provide:
1. Analysis Objective
2. Data Requirements
3. Analysis Methodology
4. Key Metrics to Track
5. Visualization Recommendations
6. Expected Insights
7. Implementation Plan

Be specific about the analysis approach and expected outcomes.`;

      const analysis = onChunk
        ? await this.generateStreamingResponse(analysisPrompt, onChunk)
        : await this.generateResponse(analysisPrompt);

      task.status = TaskStatus.COMPLETED;
      task.result = {
        analysis,
        visualizations: analysis,
        completedAt: new Date().toISOString(),
      };
      task.updatedAt = new Date();

      this.log(`Task completed: ${task.title}`);
      return task;
    } catch (error) {
      this.log(`Task failed: ${(error as Error).message}`, 'error');
      task.status = TaskStatus.FAILED;
      task.error = (error as Error).message;
      task.updatedAt = new Date();
      return task;
    }
  }

  /**
   * Check if David can handle this task
   */
  canHandleTask(task: Task): boolean {
    const keywords = [
      'data', 'analysis', 'analytics', 'visualization',
      'dashboard', 'metrics', 'insights', 'statistics'
    ];
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    return keywords.some(keyword => taskText.includes(keyword));
  }
}