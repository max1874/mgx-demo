/**
 * Task Scheduler
 *
 * Manages task scheduling based on dependencies
 * Implements topological sorting for parallel execution
 */

import type { Conversation, Task } from '@/types/project';
import { getConversationDependencies, satisfyDependency } from '@/lib/api/projects';

export interface TaskNode {
  conversation: Conversation;
  task: Task;
  dependencies: string[]; // conversation IDs this depends on
  dependents: string[]; // conversation IDs that depend on this
}

export interface ExecutionPhase {
  phase: number;
  tasks: TaskNode[];
  canRunInParallel: boolean;
}

export class TaskScheduler {
  private nodes: Map<string, TaskNode> = new Map();
  private phases: ExecutionPhase[] = [];

  /**
   * Build dependency graph from conversations
   */
  async buildGraph(conversations: Conversation[]): Promise<void> {
    this.nodes.clear();

    // Create nodes for each conversation
    for (const conv of conversations) {
      const task = conv.task as unknown as Task;
      if (!task) continue;

      const node: TaskNode = {
        conversation: conv,
        task,
        dependencies: [],
        dependents: [],
      };

      // Get dependencies from database
      const { data: deps } = await getConversationDependencies(conv.id);
      if (deps) {
        node.dependencies = deps.map(d => d.dependency_conversation_id);
      }

      this.nodes.set(conv.id, node);
    }

    // Build reverse dependencies (dependents)
    this.nodes.forEach((node, id) => {
      node.dependencies.forEach(depId => {
        const depNode = this.nodes.get(depId);
        if (depNode) {
          depNode.dependents.push(id);
        }
      });
    });

    console.log(`📊 TaskScheduler: Built graph with ${this.nodes.size} nodes`);
  }

  /**
   * Calculate execution phases using topological sort
   */
  calculatePhases(): ExecutionPhase[] {
    this.phases = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // Calculate in-degree for each node
    this.nodes.forEach((node, id) => {
      inDegree.set(id, node.dependencies.length);
    });

    let phaseNumber = 1;

    // Repeatedly find nodes with in-degree 0 (can start)
    while (visited.size < this.nodes.size) {
      const currentPhase: TaskNode[] = [];

      // Find all nodes that can run (in-degree = 0)
      this.nodes.forEach((node, id) => {
        if (!visited.has(id) && inDegree.get(id) === 0) {
          currentPhase.push(node);
        }
      });

      if (currentPhase.length === 0) {
        // Circular dependency detected
        console.error('❌ Circular dependency detected!');
        const remaining = Array.from(this.nodes.keys()).filter(id => !visited.has(id));
        console.error('Remaining tasks:', remaining);
        break;
      }

      // Mark as visited and update in-degrees
      currentPhase.forEach(node => {
        visited.add(node.conversation.id);

        // Decrease in-degree for dependent nodes
        node.dependents.forEach(depId => {
          const currentDegree = inDegree.get(depId) || 0;
          inDegree.set(depId, Math.max(0, currentDegree - 1));
        });
      });

      this.phases.push({
        phase: phaseNumber++,
        tasks: currentPhase,
        canRunInParallel: currentPhase.length > 1,
      });
    }

    console.log(`📊 TaskScheduler: Calculated ${this.phases.length} execution phases`);
    return this.phases;
  }

  /**
   * Get execution phases
   */
  getPhases(): ExecutionPhase[] {
    return this.phases;
  }

  /**
   * Check if a task can start (all dependencies satisfied)
   */
  async canTaskStart(conversationId: string): Promise<boolean> {
    const { data: deps } = await getConversationDependencies(conversationId);

    if (!deps || deps.length === 0) {
      return true;
    }

    // Check if all dependencies are satisfied
    return deps.every(dep => dep.satisfied);
  }

  /**
   * Mark a task as completed and update dependents
   */
  async markTaskCompleted(conversationId: string): Promise<void> {
    const node = this.nodes.get(conversationId);
    if (!node) {
      console.warn(`Task ${conversationId} not found in graph`);
      return;
    }

    console.log(`✅ Marking task "${node.task.title}" as completed`);

    // Mark all dependencies as satisfied for dependent tasks
    for (const dependentId of node.dependents) {
      try {
        await satisfyDependency(dependentId, conversationId);
        console.log(`✅ Satisfied dependency for task ${dependentId}`);
      } catch (error) {
        console.error(`Failed to satisfy dependency:`, error);
      }
    }
  }

  /**
   * Get tasks that can run in the current phase
   */
  async getRunnableTasks(): Promise<TaskNode[]> {
    const runnable: TaskNode[] = [];

    for (const [id, node] of this.nodes.entries()) {
      // Skip if task is not pending
      if (node.task.status !== 'pending') {
        continue;
      }

      // Check if can start
      const canStart = await this.canTaskStart(id);
      if (canStart) {
        runnable.push(node);
      }
    }

    return runnable;
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(): string[] | null {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = this.nodes.get(nodeId);
      if (!node) return false;

      for (const depId of node.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          // Cycle detected
          path.push(depId);
          return true;
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) {
          return path;
        }
      }
    }

    return null;
  }

  /**
   * Get task statistics
   */
  getStatistics(): {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    blocked: number;
  } {
    let pending = 0;
    let in_progress = 0;
    let completed = 0;
    let failed = 0;
    let blocked = 0;

    this.nodes.forEach(node => {
      switch (node.task.status) {
        case 'pending':
          pending++;
          break;
        case 'in_progress':
          in_progress++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'blocked':
          blocked++;
          break;
      }
    });

    return {
      total: this.nodes.size,
      pending,
      in_progress,
      completed,
      failed,
      blocked,
    };
  }

  /**
   * Get critical path (longest path through dependencies)
   */
  getCriticalPath(): TaskNode[] {
    const memo = new Map<string, number>();

    const longestPath = (nodeId: string): number => {
      if (memo.has(nodeId)) {
        return memo.get(nodeId)!;
      }

      const node = this.nodes.get(nodeId);
      if (!node || node.dependencies.length === 0) {
        memo.set(nodeId, 1);
        return 1;
      }

      let maxDepth = 0;
      for (const depId of node.dependencies) {
        maxDepth = Math.max(maxDepth, longestPath(depId));
      }

      const depth = maxDepth + 1;
      memo.set(nodeId, depth);
      return depth;
    };

    // Calculate longest path for all nodes
    this.nodes.forEach((_, id) => longestPath(id));

    // Find the maximum depth
    const maxDepth = Math.max(...Array.from(memo.values()));

    // Collect nodes on the critical path
    const criticalPath: TaskNode[] = [];
    const path = new Set<string>();

    const tracePath = (depth: number): void => {
      this.nodes.forEach((node, id) => {
        if (memo.get(id) === depth && !path.has(id)) {
          criticalPath.push(node);
          path.add(id);

          if (depth > 1) {
            // Find the dependency that leads to the critical path
            for (const depId of node.dependencies) {
              if (memo.get(depId) === depth - 1) {
                tracePath(depth - 1);
                break;
              }
            }
          }
        }
      });
    };

    tracePath(maxDepth);
    return criticalPath.reverse();
  }
}
