/**
 * Projects API
 *
 * API functions for managing Projects in the new PROJECT-centric architecture
 */

import { supabase } from '@/lib/supabase';
import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  CoreContext,
  ProjectProgress,
  CreateProjectResponse,
} from '@/types/project';
import { createConversation } from './conversations';

/**
 * Create a new project with Master Conversation
 */
export async function createProject(
  data: ProjectInsert
): Promise<{ data: CreateProjectResponse | null; error: Error | null }> {
  try {
    // 1. Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...data,
        status: data.status || 'planning',
        github_branch: data.github_branch || 'main',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error('Failed to create project');

    // 2. Create Master Conversation
    const { data: masterConversation, error: convError } = await createConversation({
      project_id: project.id,
      user_id: project.user_id,
      conversation_type: 'master',
      mode: 'team',
      title: `Master: ${project.name}`,
    });

    if (convError) throw convError;
    if (!masterConversation) throw new Error('Failed to create master conversation');

    // 3. Update project with master_conversation_id
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({ master_conversation_id: masterConversation.id })
      .eq('id', project.id)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!updatedProject) throw new Error('Failed to update project');

    // 4. Create project_created event
    await createProjectEvent({
      project_id: project.id,
      event_type: 'project_created',
      metadata: {
        message: `Project "${project.name}" created`,
        severity: 'info',
      },
    });

    return {
      data: {
        project: updatedProject,
        master_conversation: masterConversation,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error creating project:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a project by ID
 */
export async function getProject(
  id: string
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data: project, error: null };
  } catch (error) {
    console.error('Error getting project:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(
  userId: string
): Promise<{ data: Project[] | null; error: Error | null }> {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { data: projects, error: null };
  } catch (error) {
    console.error('Error getting user projects:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: ProjectUpdate
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data: project, error: null };
  } catch (error) {
    console.error('Error updating project:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { error: error as Error };
  }
}

/**
 * Update project Core Context
 */
export async function updateCoreContext(
  projectId: string,
  coreContext: Partial<CoreContext>
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    // Get current core_context
    const { data: project } = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const currentContext = (project.core_context as unknown as CoreContext) || {} as CoreContext;

    // Merge with new context
    const updatedContext: CoreContext = {
      tech_stack: {
        ...(currentContext.tech_stack || {}),
        ...(coreContext.tech_stack || {}),
      },
      requirements: {
        ...(currentContext.requirements || {}),
        ...(coreContext.requirements || {}),
      },
      architecture: {
        ...(currentContext.architecture || {}),
        ...(coreContext.architecture || {}),
      },
      file_structure: {
        ...(currentContext.file_structure || {}),
        ...(coreContext.file_structure || {}),
      },
      coding_standards: {
        ...(currentContext.coding_standards || {}),
        ...(coreContext.coding_standards || {}),
      },
    };

    // Update project
    const result = await updateProject(projectId, {
      core_context: updatedContext as any,
    });

    // Create context_updated event
    if (!result.error) {
      await createProjectEvent({
        project_id: projectId,
        event_type: 'context_updated',
        metadata: {
          message: 'Project core context updated',
          severity: 'info',
        },
      });
    }

    return result;
  } catch (error) {
    console.error('Error updating core context:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get project Core Context
 */
export async function getCoreContext(
  projectId: string
): Promise<{ data: CoreContext | null; error: Error | null }> {
  try {
    const { data: project, error } = await getProject(projectId);

    if (error) throw error;
    if (!project) throw new Error('Project not found');

    return { data: project.core_context as unknown as CoreContext, error: null };
  } catch (error) {
    console.error('Error getting core context:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update project progress
 */
export async function updateProjectProgress(
  projectId: string,
  progress: ProjectProgress
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    const result = await updateProject(projectId, {
      progress: progress as any,
    });

    return result;
  } catch (error) {
    console.error('Error updating project progress:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Mark project as completed
 */
export async function completeProject(
  projectId: string
): Promise<{ data: Project | null; error: Error | null }> {
  try {
    const result = await updateProject(projectId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    if (!result.error) {
      await createProjectEvent({
        project_id: projectId,
        event_type: 'project_completed',
        metadata: {
          message: 'Project completed successfully',
          severity: 'info',
        },
      });
    }

    return result;
  } catch (error) {
    console.error('Error completing project:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a project event
 */
export async function createProjectEvent(data: {
  project_id: string;
  conversation_id?: string;
  event_type: string;
  metadata?: {
    agent_name?: string;
    message: string;
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error';
  };
}): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('project_events')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error creating project event:', error);
    return { error: error as Error };
  }
}

/**
 * Get project events
 */
export async function getProjectEvents(
  projectId: string,
  limit: number = 50
): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data: events, error } = await supabase
      .from('project_events')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: events, error: null };
  } catch (error) {
    console.error('Error getting project events:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a task dependency
 */
export async function createTaskDependency(data: {
  project_id: string;
  dependent_conversation_id: string;
  dependency_conversation_id: string;
  dependency_type: 'blocks' | 'requires' | 'optional';
  description?: string;
}): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('task_dependencies')
      .insert({
        ...data,
        satisfied: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error creating task dependency:', error);
    return { error: error as Error };
  }
}

/**
 * Mark a dependency as satisfied
 */
export async function satisfyDependency(
  dependentId: string,
  dependencyId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('task_dependencies')
      .update({
        satisfied: true,
        satisfied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('dependent_conversation_id', dependentId)
      .eq('dependency_conversation_id', dependencyId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error satisfying dependency:', error);
    return { error: error as Error };
  }
}

/**
 * Get dependencies for a conversation
 */
export async function getConversationDependencies(
  conversationId: string
): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data: dependencies, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('dependent_conversation_id', conversationId);

    if (error) throw error;

    return { data: dependencies, error: null };
  } catch (error) {
    console.error('Error getting conversation dependencies:', error);
    return { data: null, error: error as Error };
  }
}
