# MGX Demo Refactoring Plan

## Overview
This document outlines the plan to refactor MGX Demo by removing the Project concept and fixing the chat functionality.

## Task 1: Remove Project Concept

### Goal
Simplify the data model by removing the projects table and making each conversation a standalone entity.

### Changes Required

#### 1. Database Schema Updates (`src/types/database.ts`)
- Remove `project_id` from conversations table
- Keep projects table definition for backward compatibility but mark as deprecated
- Update conversation types to remove project_id dependency

#### 2. API Layer Updates
- `src/lib/api/conversations.ts`: Remove project_id parameter from createConversation
- Remove `getConversationsByProject` function
- Add `getConversationsByUser` function
- Update all conversation queries to work without project_id

#### 3. Context Updates (`src/contexts/LayoutContext.tsx`)
- Remove `currentProject` and `projects` state
- Remove `setCurrentProject` and `refreshProjects` functions
- Add `conversations` state
- Add `refreshConversations` function
- Update context interface

#### 4. UI Updates
- `src/components/layout/Sidebar.tsx`: 
  - Display conversations list instead of projects
  - Update create button to create conversations
  - Remove project-related UI elements
  
- `src/components/chat/ChatArea.tsx`:
  - Remove project dependency from conversation initialization
  - Update conversation creation to not require project_id

## Task 2: Fix Chat Functionality

### Issues Identified
1. Messages not appearing after sending
2. No optimistic UI updates
3. Streaming not working properly
4. Real-time updates may not be triggering

### Root Causes
1. AgentOrchestrator saves messages but UI doesn't show them immediately
2. No optimistic update before database save
3. Real-time subscription might not be working correctly
4. Message creation flow is asynchronous but UI doesn't reflect pending state

### Fixes Required

#### 1. Optimistic UI Updates (`src/components/chat/ChatArea.tsx`)
- Add local state for pending messages
- Show user message immediately when sent
- Show loading indicator for agent response
- Merge pending messages with real messages from database

#### 2. Message Flow Improvements
- Add message status tracking (pending, sent, failed)
- Implement retry mechanism for failed messages
- Add visual feedback for message states

#### 3. Real-time Subscription (`src/hooks/useRealtimeMessages.ts`)
- Verify subscription is working correctly
- Add connection status monitoring
- Add error handling and reconnection logic

#### 4. AgentOrchestrator Updates (`src/lib/agents/AgentOrchestrator.ts`)
- Ensure messages are saved correctly
- Add proper error handling
- Emit events for UI updates

## Implementation Order

1. **Phase 1: Database Schema** (Low Risk)
   - Update type definitions
   - Test with existing data

2. **Phase 2: API Layer** (Medium Risk)
   - Update conversation API
   - Add user-based queries
   - Test API functions

3. **Phase 3: Context & State** (Medium Risk)
   - Update LayoutContext
   - Remove project dependencies
   - Test state management

4. **Phase 4: UI Updates** (High Risk)
   - Update Sidebar
   - Update ChatArea
   - Test user interactions

5. **Phase 5: Chat Fixes** (Critical)
   - Implement optimistic updates
   - Fix message flow
   - Test real-time functionality
   - Verify end-to-end chat experience

## Testing Checklist

### Project Removal
- [ ] Can create new conversations without projects
- [ ] Can view conversation list
- [ ] Can switch between conversations
- [ ] No errors related to missing project_id

### Chat Functionality
- [ ] User message appears immediately after sending
- [ ] Agent response appears in real-time
- [ ] Messages persist after page refresh
- [ ] Multiple messages work correctly
- [ ] Error states are handled gracefully
- [ ] Real-time updates work across browser tabs

## Rollback Plan

If issues occur:
1. Keep database schema backward compatible
2. Use feature flags to toggle between old/new behavior
3. Maintain project_id as optional field during transition
4. Test thoroughly in development before production

## Success Criteria

1. Users can create and manage conversations without projects
2. Chat works like ChatGPT web interface
3. Messages appear immediately and update in real-time
4. No data loss during refactoring
5. All existing features continue to work