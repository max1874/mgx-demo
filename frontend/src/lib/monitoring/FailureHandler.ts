/**
 * Failure Handler
 *
 * Handles task failures and provides recovery strategies
 */

import type { Conversation, Task, Project } from '@/types/project';
import { createProjectEvent } from '@/lib/api/projects';
import { updateConversation } from '@/lib/api/conversations';

export interface FailureAnalysis {
  conversation_id: string;
  task_title: string;
  error_message: string;
  error_type: 'dependency' | 'timeout' | 'code_error' | 'github' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggested_actions: RecoveryAction[];
}

export interface RecoveryAction {
  action: 'retry' | 'adjust_plan' | 'manual_intervention' | 'skip' | 'merge_conflict_resolution';
  description: string;
  auto_executable: boolean;
}

export class FailureHandler {
  private project: Project;

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * Analyze a task failure
   */
  async analyzeFailure(conversation: Conversation, error: Error): Promise<FailureAnalysis> {
    const task = conversation.task as unknown as Task;
    const errorMessage = error.message;

    // Determine error type
    const errorType = this.classifyError(errorMessage);
    const severity = this.assessSeverity(errorType, task);

    // Generate recovery actions
    const suggestedActions = this.generateRecoveryActions(errorType, task);

    const analysis: FailureAnalysis = {
      conversation_id: conversation.id,
      task_title: task.title,
      error_message: errorMessage,
      error_type: errorType,
      severity,
      suggested_actions: suggestedActions,
    };

    // Log failure event
    await createProjectEvent({
      project_id: this.project.id,
      conversation_id: conversation.id,
      event_type: 'task_failed',
      metadata: {
        agent_name: task.lead_agent,
        message: `Task "${task.title}" failed`,
        details: { error: errorMessage, analysis },
        severity: 'error',
      },
    });

    console.log('❌ Failure Analysis:', analysis);
    return analysis;
  }

  /**
   * Classify error type based on error message
   */
  private classifyError(
    errorMessage: string
  ): 'dependency' | 'timeout' | 'code_error' | 'github' | 'unknown' {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('dependency') || msg.includes('waiting for')) {
      return 'dependency';
    } else if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'timeout';
    } else if (
      msg.includes('syntax error') ||
      msg.includes('compilation') ||
      msg.includes('type error')
    ) {
      return 'code_error';
    } else if (
      msg.includes('github') ||
      msg.includes('git') ||
      msg.includes('merge conflict')
    ) {
      return 'github';
    } else {
      return 'unknown';
    }
  }

  /**
   * Assess failure severity
   */
  private assessSeverity(
    errorType: string,
    task: Task
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical path tasks are more severe
    if (task.priority === 'high') {
      if (errorType === 'dependency' || errorType === 'github') {
        return 'critical';
      } else {
        return 'high';
      }
    } else if (task.priority === 'medium') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate recovery actions based on error type
   */
  private generateRecoveryActions(errorType: string, _task: Task): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    switch (errorType) {
      case 'dependency':
        actions.push({
          action: 'retry',
          description: 'Wait for dependencies to complete, then retry',
          auto_executable: true,
        });
        actions.push({
          action: 'adjust_plan',
          description: 'Reorder tasks to remove circular dependencies',
          auto_executable: false,
        });
        break;

      case 'timeout':
        actions.push({
          action: 'retry',
          description: 'Retry with increased timeout',
          auto_executable: true,
        });
        actions.push({
          action: 'adjust_plan',
          description: 'Break task into smaller sub-tasks',
          auto_executable: false,
        });
        break;

      case 'code_error':
        actions.push({
          action: 'retry',
          description: 'Regenerate code with corrections',
          auto_executable: true,
        });
        actions.push({
          action: 'manual_intervention',
          description: 'Review and fix code manually',
          auto_executable: false,
        });
        break;

      case 'github':
        actions.push({
          action: 'merge_conflict_resolution',
          description: 'Resolve merge conflicts',
          auto_executable: false,
        });
        actions.push({
          action: 'retry',
          description: 'Retry commit to different branch',
          auto_executable: true,
        });
        break;

      case 'unknown':
        actions.push({
          action: 'manual_intervention',
          description: 'Investigate and resolve manually',
          auto_executable: false,
        });
        actions.push({
          action: 'retry',
          description: 'Retry task',
          auto_executable: true,
        });
        break;
    }

    return actions;
  }

  /**
   * Execute automatic retry
   */
  async executeRetry(conversation: Conversation, maxRetries: number = 3): Promise<boolean> {
    const task = conversation.task as unknown as Task;

    // Check retry count
    const retryCount = (task as any).retry_count || 0;

    if (retryCount >= maxRetries) {
      console.log(`❌ Max retries (${maxRetries}) reached for task "${task.title}"`);
      return false;
    }

    console.log(`🔄 Retrying task "${task.title}" (attempt ${retryCount + 1}/${maxRetries})`);

    // Update task status back to pending
    const updatedTask = {
      ...task,
      status: 'pending' as const,
      retry_count: retryCount + 1,
    };

    await updateConversation(conversation.id, {
      task: updatedTask as any,
    });

    // Log retry event
    await createProjectEvent({
      project_id: this.project.id,
      conversation_id: conversation.id,
      event_type: 'task_started',
      metadata: {
        agent_name: task.lead_agent,
        message: `Retrying task "${task.title}" (attempt ${retryCount + 1})`,
        severity: 'info',
      },
    });

    return true;
  }

  /**
   * Generate user notification message for failure
   */
  generateNotificationMessage(analysis: FailureAnalysis): string {
    const { task_title, error_type, severity, suggested_actions } = analysis;

    let message = `❌ 任务失败: ${task_title}\n\n`;

    // Severity indicator
    message += `严重程度: `;
    switch (severity) {
      case 'critical':
        message += '🔴 严重\n';
        break;
      case 'high':
        message += '🟠 高\n';
        break;
      case 'medium':
        message += '🟡 中\n';
        break;
      case 'low':
        message += '🟢 低\n';
        break;
    }

    // Error type description
    message += `\n错误类型: `;
    switch (error_type) {
      case 'dependency':
        message += '依赖问题 - 某些依赖任务未完成\n';
        break;
      case 'timeout':
        message += '超时 - 任务执行时间过长\n';
        break;
      case 'code_error':
        message += '代码错误 - 生成的代码存在问题\n';
        break;
      case 'github':
        message += 'GitHub 问题 - 代码提交或合并失败\n';
        break;
      case 'unknown':
        message += '未知错误\n';
        break;
    }

    // Suggested actions
    message += `\n💡 建议的解决方案:\n\n`;
    suggested_actions.forEach((action, index) => {
      message += `${index + 1}. `;
      switch (action.action) {
        case 'retry':
          message += `🔄 自动重试\n`;
          break;
        case 'adjust_plan':
          message += `📝 调整方案\n`;
          break;
        case 'manual_intervention':
          message += `🔍 手动介入\n`;
          break;
        case 'skip':
          message += `⏭️ 跳过任务\n`;
          break;
        case 'merge_conflict_resolution':
          message += `🔀 解决合并冲突\n`;
          break;
      }
      message += `   ${action.description}\n`;
      if (action.auto_executable) {
        message += `   [可以自动执行]\n`;
      }
      message += `\n`;
    });

    message += `你希望如何处理？`;

    return message;
  }

  /**
   * Handle merge conflicts
   */
  async handleMergeConflict(
    conversation: Conversation,
    conflictingFiles: string[]
  ): Promise<void> {
    const task = conversation.task as unknown as Task;

    console.log(`🔀 Handling merge conflict for task "${task.title}"`);
    console.log(`Conflicting files:`, conflictingFiles);

    // Log conflict event
    await createProjectEvent({
      project_id: this.project.id,
      conversation_id: conversation.id,
      event_type: 'merge_conflict',
      metadata: {
        agent_name: task.lead_agent,
        message: `Merge conflict detected for task "${task.title}"`,
        details: { conflicting_files: conflictingFiles },
        severity: 'warning',
      },
    });

    // Update task status to blocked
    await updateConversation(conversation.id, {
      task: {
        ...task,
        status: 'blocked' as const,
      } as any,
    });
  }

  /**
   * Skip a failed task
   */
  async skipTask(conversation: Conversation, reason: string): Promise<void> {
    const task = conversation.task as unknown as Task;

    console.log(`⏭️ Skipping task "${task.title}": ${reason}`);

    // Update task status
    await updateConversation(conversation.id, {
      task: {
        ...task,
        status: 'failed' as const,
      } as any,
    });

    // Log skip event
    await createProjectEvent({
      project_id: this.project.id,
      conversation_id: conversation.id,
      event_type: 'task_failed',
      metadata: {
        agent_name: task.lead_agent,
        message: `Task "${task.title}" skipped: ${reason}`,
        severity: 'warning',
      },
    });
  }
}
