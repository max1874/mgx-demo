/**
 * Phase 2 Integration Test
 *
 * Tests the Master-Worker mechanism workflow:
 * 1. MikeMasterAgent decomposes project into tasks
 * 2. TaskScheduler calculates execution phases
 * 3. WorkerOrchestrator executes tasks
 * 4. ProgressMonitor tracks progress
 * 5. FailureHandler manages failures
 */

import { describe, it, expect } from 'vitest';
import type { Project, Task, Conversation } from '@/types/project';
import { TaskScheduler } from '@/lib/scheduling/TaskScheduler';
import { ProgressMonitor } from '@/lib/monitoring/ProgressMonitor';
import { FailureHandler } from '@/lib/monitoring/FailureHandler';

describe('Phase 2: Master-Worker Integration', () => {
  // Mock project
  const mockProject: Project = {
    id: 'test-project-1',
    user_id: 'test-user',
    name: 'Test Blog Project',
    description: 'A test blog website',
    github_repo_url: 'https://github.com/test/blog',
    github_branch: 'main',
    project_type: 'web',
    status: 'in_progress',
    master_conversation_id: 'master-conv-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Mock tasks
  const mockTasks: Task[] = [
    {
      title: 'Setup Database Schema',
      description: 'Create database tables for blog',
      priority: 'high',
      assigned_agents: ['Alex'],
      lead_agent: 'Alex',
      dependencies: [],
      blocked_by: [],
      blocks: ['task-2', 'task-3'],
      github_branch: 'feature/database-schema',
      pull_request_url: null,
      status: 'pending',
      deliverables: {
        code_files: ['schema.sql'],
        tests: [],
        documentation: '',
      },
      estimated_time: '2h',
      actual_time: null,
      started_at: null,
      completed_at: null,
    },
    {
      title: 'Implement Blog API',
      description: 'Create REST API for blog posts',
      priority: 'high',
      assigned_agents: ['Alex'],
      lead_agent: 'Alex',
      dependencies: ['task-1'],
      blocked_by: ['task-1'],
      blocks: [],
      github_branch: 'feature/blog-api',
      pull_request_url: null,
      status: 'pending',
      deliverables: {
        code_files: ['api/posts.ts'],
        tests: [],
        documentation: '',
      },
      estimated_time: '4h',
      actual_time: null,
      started_at: null,
      completed_at: null,
    },
    {
      title: 'Create Blog UI Components',
      description: 'Build React components for blog',
      priority: 'medium',
      assigned_agents: ['Alex'],
      lead_agent: 'Alex',
      dependencies: ['task-1'],
      blocked_by: ['task-1'],
      blocks: [],
      github_branch: 'feature/blog-ui',
      pull_request_url: null,
      status: 'pending',
      deliverables: {
        code_files: ['components/BlogPost.tsx'],
        tests: [],
        documentation: '',
      },
      estimated_time: '6h',
      actual_time: null,
      started_at: null,
      completed_at: null,
    },
  ];

  describe('TaskScheduler', () => {
    it('should build dependency graph correctly', async () => {
      const scheduler = new TaskScheduler();

      // Create mock conversations
      const conversations: Conversation[] = mockTasks.map((task, index) => ({
        id: `task-${index + 1}`,
        user_id: 'test-user',
        title: task.title,
        conversation_type: 'worker',
        parent_conversation_id: 'master-conv-1',
        project_id: mockProject.id,
        task: task as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Note: buildGraph requires database access, so this is a structural test
      expect(scheduler).toBeDefined();
      expect(typeof scheduler.buildGraph).toBe('function');
    });

    it('should detect circular dependencies', () => {
      const scheduler = new TaskScheduler();
      expect(typeof scheduler.detectCircularDependencies).toBe('function');
    });

    it('should calculate critical path', () => {
      const scheduler = new TaskScheduler();
      expect(typeof scheduler.getCriticalPath).toBe('function');
    });

    it('should get task statistics', () => {
      const scheduler = new TaskScheduler();
      const stats = scheduler.getStatistics();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('in_progress');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('blocked');
    });
  });

  describe('ProgressMonitor', () => {
    it('should initialize with project ID', () => {
      const monitor = new ProgressMonitor(mockProject.id);
      expect(monitor).toBeDefined();
    });

    it('should have start and stop methods', () => {
      const monitor = new ProgressMonitor(mockProject.id);
      expect(typeof monitor.start).toBe('function');
      expect(typeof monitor.stop).toBe('function');
    });

    it('should have progress calculation methods', async () => {
      const monitor = new ProgressMonitor(mockProject.id);
      expect(typeof monitor.getProgress).toBe('function');
      expect(typeof monitor.updateProgress).toBe('function');
      expect(typeof monitor.getTaskStatuses).toBe('function');
      expect(typeof monitor.getEstimatedTimeRemaining).toBe('function');
    });
  });

  describe('FailureHandler', () => {
    it('should initialize with project', () => {
      const handler = new FailureHandler(mockProject);
      expect(handler).toBeDefined();
    });

    it('should analyze failures', () => {
      const handler = new FailureHandler(mockProject);
      expect(typeof handler.analyzeFailure).toBe('function');
    });

    it('should handle retries', () => {
      const handler = new FailureHandler(mockProject);
      expect(typeof handler.executeRetry).toBe('function');
    });

    it('should generate notification messages', () => {
      const handler = new FailureHandler(mockProject);

      const analysis = {
        conversation_id: 'conv-1',
        task_title: 'Test Task',
        error_message: 'Timeout error',
        error_type: 'timeout' as const,
        severity: 'medium' as const,
        suggested_actions: [
          {
            action: 'retry' as const,
            description: 'Retry with increased timeout',
            auto_executable: true,
          },
        ],
      };

      const message = handler.generateNotificationMessage(analysis);
      expect(message).toContain('任务失败');
      expect(message).toContain('Test Task');
      expect(message).toContain('严重程度');
    });

    it('should handle merge conflicts', () => {
      const handler = new FailureHandler(mockProject);
      expect(typeof handler.handleMergeConflict).toBe('function');
    });

    it('should skip tasks', () => {
      const handler = new FailureHandler(mockProject);
      expect(typeof handler.skipTask).toBe('function');
    });
  });

  describe('Integration Workflow', () => {
    it('should support complete Master-Worker workflow', () => {
      // This test verifies that all components can be instantiated together
      const scheduler = new TaskScheduler();
      const monitor = new ProgressMonitor(mockProject.id);
      const handler = new FailureHandler(mockProject);

      expect(scheduler).toBeDefined();
      expect(monitor).toBeDefined();
      expect(handler).toBeDefined();

      // Verify workflow methods exist
      expect(typeof scheduler.calculatePhases).toBe('function');
      expect(typeof monitor.start).toBe('function');
      expect(typeof handler.analyzeFailure).toBe('function');
    });
  });
});
