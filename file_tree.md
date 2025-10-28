# MGX Demo - M2 AI Agent Integration File Structure

## Project Directory Structure

```
/workspace/mgx-demo/frontend/
├── src/
│   ├── lib/
│   │   ├── llm/
│   │   │   ├── types.ts                    # LLM type definitions
│   │   │   ├── LLMProvider.ts              # LLM Provider interface
│   │   │   ├── OpenRouterProvider.ts       # OpenRouter implementation
│   │   │   ├── StreamHandler.ts            # Streaming response handler
│   │   │   └── RetryLogic.ts               # Error retry mechanism
│   │   │
│   │   ├── agents/
│   │   │   ├── types.ts                    # Agent type definitions
│   │   │   ├── BaseAgent.ts                # Base agent class
│   │   │   ├── MikeAgent.ts                # Team leader agent
│   │   │   ├── EmmaAgent.ts                # Product manager agent
│   │   │   ├── BobAgent.ts                 # System architect agent
│   │   │   ├── AlexAgent.ts                # Full-stack engineer agent
│   │   │   ├── DavidAgent.ts               # Data analyst agent
│   │   │   ├── IrisAgent.ts                # Deep researcher agent
│   │   │   └── index.ts                    # Agent registry
│   │   │
│   │   ├── orchestrator/
│   │   │   ├── types.ts                    # Orchestrator type definitions
│   │   │   ├── MessageRouter.ts            # Message routing logic
│   │   │   ├── AgentOrchestrator.ts        # Agent coordination
│   │   │   ├── StateMachine.ts             # State machine implementation
│   │   │   └── TaskQueue.ts                # Task queue management
│   │   │
│   │   └── supabase.ts                     # Supabase client (existing)
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx                 # Auth context (existing)
│   │   ├── LayoutContext.tsx               # Layout context (existing)
│   │   └── AgentContext.tsx                # NEW: Agent state management
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatArea.tsx                # UPDATED: Chat interface
│   │   │   ├── MessageBubble.tsx           # NEW: Message component
│   │   │   ├── StreamingMessage.tsx        # NEW: Streaming message
│   │   │   ├── AgentAvatar.tsx             # NEW: Agent avatar
│   │   │   └── AgentStatusIndicator.tsx    # NEW: Status indicator
│   │   │
│   │   ├── agent/
│   │   │   ├── AgentCard.tsx               # NEW: Agent info card
│   │   │   ├── AgentList.tsx               # NEW: Agent list
│   │   │   └── AgentExecutionLog.tsx       # NEW: Execution log
│   │   │
│   │   └── ui/                             # shadcn/ui components (existing)
│   │
│   ├── hooks/
│   │   ├── useAgent.ts                     # NEW: Agent hook
│   │   ├── useStreaming.ts                 # NEW: Streaming hook
│   │   └── useAgentExecution.ts            # NEW: Execution tracking
│   │
│   ├── types/
│   │   └── database.ts                     # Database types (existing)
│   │
│   └── utils/
│       ├── tokenCounter.ts                 # NEW: Token counting utility
│       ├── promptBuilder.ts                # NEW: Prompt building utility
│       └── errorHandler.ts                 # NEW: Error handling utility
│
├── supabase/
│   └── migrations/
│       ├── 20250128000001_initial_schema.sql       # Existing
│       ├── 20250128000002_row_level_security.sql   # Existing
│       └── 20250128000003_insert_agents.sql        # NEW: Agent seed data
│
├── .env                                    # UPDATED: Add OpenRouter API key
├── .env.example                            # UPDATED: Add OpenRouter API key
└── package.json                            # UPDATED: Add new dependencies
```

## File Descriptions

### LLM Layer (`src/lib/llm/`)

#### `types.ts`
Type definitions for LLM operations:
- `LLMOptions`: Configuration for LLM calls
- `LLMResponse`: Response structure
- `StreamChunk`: Streaming token chunk
- `RetryConfig`: Retry configuration

#### `LLMProvider.ts`
Abstract interface for LLM providers:
- `generateResponse()`: Non-streaming generation
- `streamResponse()`: Streaming generation
- `getAvailableModels()`: List available models
- `estimateTokens()`: Token estimation

#### `OpenRouterProvider.ts`
OpenRouter API implementation:
- API key management
- HTTP client configuration
- Request/response handling
- Model selection logic
- Error handling

#### `StreamHandler.ts`
Streaming response handler:
- Server-Sent Events (SSE) parsing
- Buffer management
- Chunk processing
- Stream completion detection

#### `RetryLogic.ts`
Error retry mechanism:
- Exponential backoff
- Max retry limit
- Error classification
- Fallback strategies

### Agent Layer (`src/lib/agents/`)

#### `types.ts`
Agent type definitions:
- `AgentConfig`: Agent configuration
- `AgentMessage`: Message structure
- `AgentResponse`: Response structure
- `AgentStatus`: Status enum
- `AgentCapability`: Capability enum

#### `BaseAgent.ts`
Base class for all agents:
- Common properties (name, description, capabilities)
- Message processing interface
- Streaming support
- Error handling
- Logging

#### `MikeAgent.ts` - `IrisAgent.ts`
Specialized agent implementations:
- Unique system prompts
- Specific capabilities
- Custom processing logic
- Model preferences

#### `index.ts`
Agent registry:
- Agent factory
- Agent lookup by name
- Agent initialization

### Orchestrator Layer (`src/lib/orchestrator/`)

#### `types.ts`
Orchestrator type definitions:
- `ConversationMode`: Mode enum (team/engineer/research/race)
- `AgentExecution`: Execution tracking
- `TaskState`: State machine states
- `TaskTransition`: State transitions

#### `MessageRouter.ts`
Message routing logic:
- Mode-based routing
- Agent selection
- Load balancing
- Priority handling

#### `AgentOrchestrator.ts`
Agent coordination:
- Task execution
- State management
- Agent communication
- Execution tracking

#### `StateMachine.ts`
State machine implementation:
- State definitions
- Transition rules
- Event handling
- State validation

#### `TaskQueue.ts`
Task queue management:
- Queue operations
- Priority queue
- Concurrent execution
- Task cancellation

### Context Layer (`src/contexts/`)

#### `AgentContext.tsx`
Agent state management:
- Active agents tracking
- Execution status
- Real-time updates
- Context provider

### Component Layer (`src/components/`)

#### `chat/ChatArea.tsx` (Updated)
Enhanced chat interface:
- Streaming message support
- Agent status display
- Mode switching
- Error handling UI

#### `chat/MessageBubble.tsx`
Message component:
- User/agent differentiation
- Markdown rendering
- Code block highlighting
- Timestamp display

#### `chat/StreamingMessage.tsx`
Streaming message component:
- Progressive rendering
- Typing indicator
- Token-by-token display
- Completion animation

#### `chat/AgentAvatar.tsx`
Agent avatar component:
- Agent icon/image
- Status indicator
- Tooltip with info

#### `chat/AgentStatusIndicator.tsx`
Status indicator component:
- Status icon
- Color coding
- Animation effects
- Status text

#### `agent/AgentCard.tsx`
Agent information card:
- Agent details
- Capabilities list
- Status display
- Action buttons

#### `agent/AgentList.tsx`
Agent list component:
- All agents display
- Filter by status
- Sort by activity
- Selection handling

#### `agent/AgentExecutionLog.tsx`
Execution log component:
- Execution history
- Performance metrics
- Error logs
- Timeline view

### Hooks Layer (`src/hooks/`)

#### `useAgent.ts`
Agent management hook:
- Get agent by name
- Get active agents
- Agent status updates

#### `useStreaming.ts`
Streaming management hook:
- Stream initialization
- Token handling
- Stream completion
- Error recovery

#### `useAgentExecution.ts`
Execution tracking hook:
- Start execution
- Track progress
- Get execution status
- Cancel execution

### Utilities Layer (`src/utils/`)

#### `tokenCounter.ts`
Token counting utility:
- Estimate tokens
- Count tokens
- Model-specific counting

#### `promptBuilder.ts`
Prompt building utility:
- System prompt formatting
- Context injection
- Few-shot examples
- Prompt templates

#### `errorHandler.ts`
Error handling utility:
- Error classification
- Error messages
- Retry logic
- User-friendly errors

### Database Layer (`supabase/migrations/`)

#### `20250128000003_insert_agents.sql`
Agent seed data:
- Insert 6 agents
- Set system prompts
- Configure capabilities
- Set default configs

### Configuration Files

#### `.env` (Updated)
Environment variables:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_OPENROUTER_API_KEY=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
```

#### `package.json` (Updated)
New dependencies:
```json
{
  "dependencies": {
    "eventsource-parser": "^1.1.1",
    "tiktoken": "^1.0.10"
  }
}
```

## Implementation Order

### Phase 1: Foundation
1. `src/lib/llm/types.ts`
2. `src/lib/llm/LLMProvider.ts`
3. `src/lib/llm/RetryLogic.ts`
4. `src/lib/llm/StreamHandler.ts`
5. `src/lib/llm/OpenRouterProvider.ts`

### Phase 2: Agents
6. `src/lib/agents/types.ts`
7. `src/lib/agents/BaseAgent.ts`
8. `src/lib/agents/MikeAgent.ts`
9. `src/lib/agents/EmmaAgent.ts`
10. `src/lib/agents/BobAgent.ts`
11. `src/lib/agents/AlexAgent.ts`
12. `src/lib/agents/DavidAgent.ts`
13. `src/lib/agents/IrisAgent.ts`
14. `src/lib/agents/index.ts`

### Phase 3: Orchestration
15. `src/lib/orchestrator/types.ts`
16. `src/lib/orchestrator/StateMachine.ts`
17. `src/lib/orchestrator/TaskQueue.ts`
18. `src/lib/orchestrator/MessageRouter.ts`
19. `src/lib/orchestrator/AgentOrchestrator.ts`

### Phase 4: State Management
20. `src/contexts/AgentContext.tsx`
21. `src/hooks/useAgent.ts`
22. `src/hooks/useStreaming.ts`
23. `src/hooks/useAgentExecution.ts`

### Phase 5: UI Components
24. `src/components/chat/AgentAvatar.tsx`
25. `src/components/chat/AgentStatusIndicator.tsx`
26. `src/components/chat/MessageBubble.tsx`
27. `src/components/chat/StreamingMessage.tsx`
28. `src/components/chat/ChatArea.tsx` (update)
29. `src/components/agent/AgentCard.tsx`
30. `src/components/agent/AgentList.tsx`
31. `src/components/agent/AgentExecutionLog.tsx`

### Phase 6: Database & Config
32. `supabase/migrations/20250128000003_insert_agents.sql`
33. `.env` (update)
34. `.env.example` (update)
35. `package.json` (update)

### Phase 7: Utilities
36. `src/utils/tokenCounter.ts`
37. `src/utils/promptBuilder.ts`
38. `src/utils/errorHandler.ts`

## Total Files

- **New Files**: 37
- **Updated Files**: 4
- **Total**: 41 files

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-28  
**Author**: Bob (System Architect)