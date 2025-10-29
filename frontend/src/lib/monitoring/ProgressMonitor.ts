/**
 * Progress Monitor
 *
 * Real-time progress monitoring for PROJECT execution
 * Uses Supabase Realtime for live updates
 */

import { supabase } from '@/lib/supabase';
import type { Conversation, ProjectProgress } from '@/types/project';
import { updateProjectProgress } from '@/lib/api/projects';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ProgressCallback = (progress: ProjectProgress) => void;
export type TaskUpdateCallback = (conversation: Conversation) => void;

export class ProgressMonitor {
  private projectId: string;
  private channel: RealtimeChannel | null = null;
  private progressCallback: ProgressCallback | null = null;
  private taskUpdateCallback: TaskUpdateCallback | null = null;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Start monitoring project progress
   */
  start(
    onProgressUpdate?: ProgressCallback,
    onTaskUpdate?: TaskUpdateCallback
  ): void {
    if (this.channel) {
      console.warn('ProgressMonitor already started');
      return;
    }

    this.progressCallback = onProgressUpdate || null;
    this.taskUpdateCallback = onTaskUpdate || null;

    console.log(`📊 ProgressMonitor: Starting for project ${this.projectId}`);

    // Subscribe to conversations changes
    this.channel = supabase
      .channel(`project:${this.projectId}:progress`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `project_id=eq.${this.projectId}`,
        },
        async (payload) => {
          console.log('📡 Task updated:', payload);
          const conversation = payload.new as Conversation;

          // Notify task update callback
          if (this.taskUpdateCallback) {
            this.taskUpdateCallback(conversation);
          }

          // Recalculate and update project progress
          await this.updateProgress();
        }
      )
      .subscribe((status) => {
        console.log(`📊 ProgressMonitor: Subscription status: ${status}`);
      });
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.channel) {
      console.log('📊 ProgressMonitor: Stopping');
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  /**
   * Calculate and update project progress
   */
  async updateProgress(): Promise<ProjectProgress> {
    try {
      const progress = await this.calculateProgress();

      // Update project progress in database
      await updateProjectProgress(this.projectId, progress);

      // Notify callback
      if (this.progressCallback) {
        this.progressCallback(progress);
      }

      return progress;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return {
        total_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        in_progress_tasks: 0,
        percentage: 0,
      };
    }
  }

  /**
   * Calculate current project progress
   */
  private async calculateProgress(): Promise<ProjectProgress> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('project_id', this.projectId)
        .eq('conversation_type', 'worker');

      if (error) throw error;

      const total = conversations?.length || 0;
      let completed = 0;
      let failed = 0;
      let in_progress = 0;

      conversations?.forEach((conv) => {
        const task = conv.task as any;
        if (!task) return;

        switch (task.status) {
          case 'completed':
            completed++;
            break;
          case 'failed':
            failed++;
            break;
          case 'in_progress':
            in_progress++;
            break;
        }
      });

      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total_tasks: total,
        completed_tasks: completed,
        failed_tasks: failed,
        in_progress_tasks: in_progress,
        percentage,
      };
    } catch (error) {
      console.error('Failed to calculate progress:', error);
      return {
        total_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        in_progress_tasks: 0,
        percentage: 0,
      };
    }
  }

  /**
   * Get current progress snapshot
   */
  async getProgress(): Promise<ProjectProgress> {
    return this.calculateProgress();
  }

  /**
   * Get detailed task status
   */
  async getTaskStatuses(): Promise<
    Array<{
      conversation_id: string;
      title: string;
      status: string;
      progress: number;
    }>
  > {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('project_id', this.projectId)
        .eq('conversation_type', 'worker');

      if (error) throw error;

      return (
        conversations?.map((conv) => {
          const task = conv.task as any;
          return {
            conversation_id: conv.id,
            title: task?.title || 'Untitled',
            status: task?.status || 'unknown',
            progress: this.calculateTaskProgress(task),
          };
        }) || []
      );
    } catch (error) {
      console.error('Failed to get task statuses:', error);
      return [];
    }
  }

  /**
   * Calculate individual task progress (0-100)
   */
  private calculateTaskProgress(task: any): number {
    if (!task) return 0;

    switch (task.status) {
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      case 'in_progress':
        // Could be more sophisticated based on sub-steps
        return 50;
      case 'pending':
        return 0;
      case 'blocked':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Get estimated time remaining
   */
  async getEstimatedTimeRemaining(): Promise<string> {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('project_id', this.projectId)
        .eq('conversation_type', 'worker');

      if (!conversations) return 'Unknown';

      let totalEstimatedMinutes = 0;
      let completedMinutes = 0;

      conversations.forEach((conv) => {
        const task = conv.task as any;
        if (!task) return;

        const estimated = this.parseTimeString(task.estimated_time);
        totalEstimatedMinutes += estimated;

        if (task.status === 'completed' && task.actual_time) {
          const actual = this.parseTimeString(task.actual_time);
          completedMinutes += actual;
        } else if (task.status === 'completed') {
          completedMinutes += estimated;
        }
      });

      const remainingMinutes = Math.max(0, totalEstimatedMinutes - completedMinutes);

      return this.formatTimeString(remainingMinutes);
    } catch (error) {
      console.error('Failed to estimate time remaining:', error);
      return 'Unknown';
    }
  }

  /**
   * Parse time string like "4-6 hours" to minutes
   */
  private parseTimeString(timeStr: string): number {
    if (!timeStr) return 0;

    // Extract numbers and units
    const hourMatch = timeStr.match(/(\d+)(?:-(\d+))?\s*h/i);
    const minMatch = timeStr.match(/(\d+)(?:-(\d+))?\s*m/i);

    let minutes = 0;

    if (hourMatch) {
      const hours = parseInt(hourMatch[2] || hourMatch[1], 10);
      minutes += hours * 60;
    }

    if (minMatch) {
      const mins = parseInt(minMatch[2] || minMatch[1], 10);
      minutes += mins;
    }

    return minutes;
  }

  /**
   * Format minutes to readable string
   */
  private formatTimeString(minutes: number): string {
    if (minutes === 0) return '0 minutes';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }
}
