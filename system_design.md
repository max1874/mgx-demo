# MGX Demo - M2 AI Agent Integration System Design

## 1. Implementation Approach

### 1.1 Core Architecture
We will implement a multi-agent collaboration system with the following key components:

1. **LLM Provider Abstraction Layer**
   - Create a unified interface for multiple LLM providers (OpenRouter)
   - Support streaming responses for real-time user feedback
   - Implement retry logic with exponential backoff for API failures
   - Handle rate limiting and error recovery

2. **Agent System**
   - Define a BaseAgent class with common functionality
   - Implement 6 specialized agents (Mike, Emma, Bob, Alex, David, Iris)
   - Each agent has unique capabilities and system prompts
   - Support both synchronous and streaming message processing

3. **Message Router & Orchestrator**
   - Route user messages to appropriate agents based on mode (team/engineer)
   - Implement state machine for agent collaboration workflow
   - Handle agent-to-agent communication
   - Track execution status and manage concurrent agent operations

4. **Real-time Integration**
   - Use Supabase Realtime for message synchronization
   - Track agent execution status in real-time
   - Support streaming responses with progressive rendering
   - Handle connection failures and reconnection

5. **State Management**
   - Create AgentContext for managing active agents and their states
   - Track execution progress (idle → thinking → executing → completed/failed)
   - Provide hooks for UI components to react to state changes

### 1.2 Technology Stack
- **LLM API**: OpenRouter (supports GPT-4, Claude, Gemini, DeepSeek)
- **Streaming**: Server-Sent Events (SSE) / Fetch API with streaming
- **State Management**: React Context API + Zustand (optional)
- **Database**: Supabase (PostgreSQL with Realtime)
- **Type Safety**: TypeScript with strict mode

### 1.3 Key Challenges & Solutions
| Challenge | Solution |
|-----------|----------|
| LLM API instability | Multi-provider support with automatic fallback |
| Streaming response handling | Implement SSE parser with buffer management |
| Agent coordination | State machine with clear transition rules |
| Real-time sync | Supabase Realtime with optimistic updates |
| Error recovery | Retry logic with exponential backoff |

## 2. Main User-UI Interaction Patterns

### 2.1 Sending a Message
1. User types message in chat input
2. User presses Enter or clicks Send button
3. Message immediately appears in chat (optimistic update)
4. Message is saved to Supabase database
5. Agent system is triggered via message router

### 2.2 Receiving Agent Response (Streaming)
1. Agent starts processing (status: "thinking")
2. Streaming response begins (status: "executing")
3. Tokens appear progressively in chat bubble
4. User sees real-time typing effect
5. Response completes (status: "completed")
6. Final message is saved to database

### 2.3 Agent Status Visualization
1. Sidebar shows all available agents
2. Active agent is highlighted
3. Agent status indicator shows current state:
   - 🟢 Idle: Ready to process
   - 🟡 Thinking: Analyzing request
   - 🔵 Executing: Generating response
   - ✅ Completed: Task finished
   - ❌ Failed: Error occurred

### 2.4 Mode Switching
1. User clicks mode toggle (Team Mode ↔ Engineer Mode)
2. UI updates to show available agents for selected mode
3. Message routing behavior changes accordingly
4. Previous conversation context is preserved

### 2.5 Error Handling
1. If agent fails, error message is displayed
2. User can click "Retry" button
3. System automatically retries with exponential backoff
4. After max retries, user is notified and can manually retry

## 3. System Architecture

```plantuml
@startuml
!define RECTANGLE class

package "Frontend Layer" {
  [React UI] as UI
  [Chat Components] as Chat
  [Agent Status UI] as StatusUI
}

package "Business Logic Layer" {
  [Agent Context] as Context
  [Message Router] as Router
  [Agent Orchestrator] as Orchestrator
}

package "Agent Layer" {
  [BaseAgent] as Base
  [Mike Agent] as Mike
  [Emma Agent] as Emma
  [Bob Agent] as Bob
  [Alex Agent] as Alex
  [David Agent] as David
  [Iris Agent] as Iris
}

package "LLM Provider Layer" {
  [LLM Provider Interface] as LLMInterface
  [OpenRouter Provider] as OpenRouter
  [Stream Handler] as Stream
}

package "Data Layer - Supabase" {
  database "PostgreSQL" {
    [messages] as Messages
    [agents] as Agents
    [agent_executions] as Executions
    [conversations] as Conversations
  }
  [Supabase Realtime] as Realtime
  [Supabase Auth] as Auth
}

package "External Services" {
  cloud "OpenRouter API" as OpenRouterAPI
}

UI --> Context
UI --> Chat
UI --> StatusUI
Chat --> Router
Context --> Orchestrator
Router --> Orchestrator
Orchestrator --> Base
Base <|-- Mike
Base <|-- Emma
Base <|-- Bob
Base <|-- Alex
Base <|-- David
Base <|-- Iris
Mike --> LLMInterface
Emma --> LLMInterface
Bob --> LLMInterface
Alex --> LLMInterface
David --> LLMInterface
Iris --> LLMInterface
LLMInterface <|.. OpenRouter
OpenRouter --> Stream
OpenRouter --> OpenRouterAPI
Orchestrator --> Messages
Orchestrator --> Executions
Router --> Conversations
UI --> Realtime
Realtime --> Messages
UI --> Auth

note right of Orchestrator
  State Machine:
  IDLE → PLANNING → 
  EXECUTING → COMPLETED
end note

note right of OpenRouter
  Supports:
  - GPT-4
  - Claude 3
  - Gemini Pro
  - DeepSeek
end note
@enduml
```

## 4. UI Navigation Flow

```plantuml
@startuml
[*] --> Home

state "Home" as Home {
  [*] --> SelectMode
  SelectMode : Choose Team/Engineer Mode
}

state "Chat Interface" as Chat {
  [*] --> ViewMessages
  ViewMessages --> TypeMessage
  TypeMessage --> SendMessage
  SendMessage --> ViewMessages
  ViewMessages --> ViewAgentStatus
  ViewAgentStatus --> ViewMessages
}

state "Agent Sidebar" as Sidebar {
  [*] --> ViewAgents
  ViewAgents --> SelectAgent
  SelectAgent --> ViewAgentDetails
  ViewAgentDetails --> ViewAgents
}

Home --> Chat : Start Conversation
Home --> Sidebar : View Agents
Chat --> Sidebar : Switch to Agents
Sidebar --> Chat : Back to Chat
Chat --> Home : Exit
Sidebar --> Home : Exit

note right of Chat
  Max depth: 3 levels
  - View Messages
  - Type/Send
  - View Status
end note

note right of Sidebar
  High-frequency actions:
  - View active agents
  - Check agent status
  - Quick agent selection
end note
@enduml
```

## 5. Data Structures and Interfaces

```plantuml
@startuml
interface ILLMProvider {
  +generateResponse(prompt: string, options: LLMOptions): Promise<string>
  +streamResponse(prompt: string, options: LLMOptions): AsyncIterator<string>
  +getAvailableModels(): string[]
}

class OpenRouterProvider {
  -apiKey: string
  -baseURL: string
  -retryConfig: RetryConfig
  +generateResponse(prompt: string, options: LLMOptions): Promise<string>
  +streamResponse(prompt: string, options: LLMOptions): AsyncIterator<string>
  +getAvailableModels(): string[]
  -handleError(error: Error): void
  -retryWithBackoff(fn: Function, retries: number): Promise<any>
}

class BaseAgent {
  #name: string
  #displayName: string
  #description: string
  #capabilities: string[]
  #systemPrompt: string
  #llmProvider: ILLMProvider
  #config: AgentConfig
  +processMessage(message: AgentMessage): Promise<AgentResponse>
  +streamMessage(message: AgentMessage): AsyncIterator<string>
  +getStatus(): AgentStatus
  #buildPrompt(message: AgentMessage): string
  #parseResponse(response: string): AgentResponse
}

class MikeAgent {
  +processMessage(message: AgentMessage): Promise<AgentResponse>
  -routeToAgent(task: Task): string
  -coordinateTeam(agents: BaseAgent[]): void
}

class EmmaAgent {
  +processMessage(message: AgentMessage): Promise<AgentResponse>
  -analyzeRequirements(input: string): Requirements
  -generatePRD(requirements: Requirements): string
}

class AlexAgent {
  +processMessage(message: AgentMessage): Promise<AgentResponse>
  -generateCode(spec: CodeSpec): string
  -reviewCode(code: string): CodeReview
}

class MessageRouter {
  -agents: Map<string, BaseAgent>
  -mode: ConversationMode
  +routeMessage(message: Message): BaseAgent
  +setMode(mode: ConversationMode): void
  -selectAgent(message: Message): string
}

class AgentOrchestrator {
  -router: MessageRouter
  -activeExecutions: Map<string, AgentExecution>
  -stateMachine: StateMachine
  +executeTask(message: Message): Promise<void>
  +getExecutionStatus(executionId: string): AgentStatus
  +cancelExecution(executionId: string): void
  -transitionState(from: State, to: State): void
}

enum AgentStatus {
  IDLE
  THINKING
  EXECUTING
  COMPLETED
  FAILED
}

enum ConversationMode {
  TEAM
  ENGINEER
  RESEARCH
  RACE
}

class AgentMessage {
  +id: string
  +conversationId: string
  +role: MessageRole
  +content: string
  +metadata: MessageMetadata
  +createdAt: Date
}

class AgentExecution {
  +id: string
  +conversationId: string
  +agentId: string
  +input: any
  +output: any
  +status: AgentStatus
  +tokensUsed: number
  +executionTimeMs: number
  +errorMessage: string?
  +createdAt: Date
  +completedAt: Date?
}

class AgentResponse {
  +content: string
  +metadata: ResponseMetadata
  +tokensUsed: number
  +executionTime: number
}

class LLMOptions {
  +model: string
  +temperature: number
  +maxTokens: number
  +stream: boolean
  +stopSequences: string[]
}

class RetryConfig {
  +maxRetries: number
  +initialDelay: number
  +maxDelay: number
  +backoffMultiplier: number
}

ILLMProvider <|.. OpenRouterProvider
BaseAgent <|-- MikeAgent
BaseAgent <|-- EmmaAgent
BaseAgent <|-- AlexAgent
BaseAgent --> ILLMProvider
MessageRouter --> BaseAgent
AgentOrchestrator --> MessageRouter
AgentOrchestrator --> AgentExecution
BaseAgent ..> AgentMessage
BaseAgent ..> AgentResponse
OpenRouterProvider ..> LLMOptions
OpenRouterProvider ..> RetryConfig
@enduml
```

## 6. Program Call Flow

```plantuml
@startuml
actor User
participant "Chat UI" as UI
participant "Message Router" as Router
participant "Agent Orchestrator" as Orchestrator
participant "Mike Agent" as Mike
participant "Alex Agent" as Alex
participant "OpenRouter Provider" as LLM
participant "Supabase DB" as DB
participant "Supabase Realtime" as Realtime

User -> UI: Type and send message
activate UI

UI -> DB: INSERT message
note right
  Input: {
    "conversation_id": "uuid",
    "role": "user",
    "content": "Create a landing page",
    "metadata": {}
  }
end note
DB --> UI: Message saved
UI -> Realtime: Subscribe to updates

UI -> Router: Route message
activate Router
Router -> Router: Determine mode (Team/Engineer)
alt Team Mode
  Router -> Orchestrator: Execute with team
  activate Orchestrator
  
  Orchestrator -> Mike: Process message
  activate Mike
  Mike -> LLM: Generate response (stream)
  note right
    Input: {
      "model": "gpt-4",
      "messages": [{
        "role": "system",
        "content": "You are Mike, a team leader..."
      }, {
        "role": "user", 
        "content": "Create a landing page"
      }],
      "stream": true
    }
  end note
  
  activate LLM
  loop Stream tokens
    LLM --> Mike: Token chunk
    Mike -> DB: INSERT partial message
    DB -> Realtime: Broadcast update
    Realtime --> UI: Stream token
    UI --> User: Display progressive text
  end
  LLM --> Mike: Stream complete
  deactivate LLM
  
  Mike -> Mike: Analyze task
  Mike -> Orchestrator: Delegate to Alex
  deactivate Mike
  
  Orchestrator -> DB: INSERT agent_execution
  note right
    Input: {
      "conversation_id": "uuid",
      "agent_id": "alex-id",
      "status": "pending",
      "input": {"task": "create_landing_page"}
    }
  end note
  
  Orchestrator -> Alex: Generate code
  activate Alex
  Alex -> LLM: Generate code (stream)
  note right
    Input: {
      "model": "claude-3-sonnet",
      "messages": [{
        "role": "system",
        "content": "You are Alex, a full-stack engineer..."
      }, {
        "role": "user",
        "content": "Create a landing page with..."
      }],
      "stream": true
    }
  end note
  
  activate LLM
  loop Stream code
    LLM --> Alex: Code chunk
    Alex -> DB: UPDATE message (append)
    DB -> Realtime: Broadcast update
    Realtime --> UI: Stream code
    UI --> User: Display progressive code
  end
  LLM --> Alex: Stream complete
  deactivate LLM
  
  Alex -> DB: UPDATE agent_execution
  note right
    Output: {
      "status": "completed",
      "output": {"code": "...", "files": [...]},
      "tokens_used": 1500,
      "execution_time_ms": 3200
    }
  end note
  deactivate Alex
  
  Orchestrator -> DB: INSERT final message
  DB -> Realtime: Broadcast completion
  Realtime --> UI: Task completed
  deactivate Orchestrator
  
else Engineer Mode
  Router -> Alex: Process directly
  activate Alex
  Alex -> LLM: Generate code (stream)
  loop Stream response
    LLM --> Alex: Token
    Alex -> DB: UPDATE message
    DB -> Realtime: Broadcast
    Realtime --> UI: Display
  end
  Alex -> DB: Save final result
  deactivate Alex
end

deactivate Router
UI --> User: Show complete response
deactivate UI

note over User, DB
  Key Features:
  1. Streaming responses for real-time feedback
  2. Agent coordination via state machine
  3. Real-time updates via Supabase
  4. Execution tracking in database
  5. Error handling with retries
end note
@enduml
```

## 7. Database ER Diagram

```plantuml
@startuml
entity "users" as users {
  * id : uuid <<PK>>
  --
  * email : varchar
  * encrypted_password : varchar
  created_at : timestamp
}

entity "profiles" as profiles {
  * id : uuid <<PK, FK>>
  --
  username : varchar
  avatar_url : varchar
  credits : integer
  subscription_tier : varchar
  created_at : timestamp
  updated_at : timestamp
}

entity "projects" as projects {
  * id : uuid <<PK>>
  --
  * user_id : uuid <<FK>>
  * name : varchar
  description : text
  permission : varchar
  generated_code : jsonb
  version : integer
  parent_project_id : uuid <<FK>>
  created_at : timestamp
  updated_at : timestamp
}

entity "conversations" as conversations {
  * id : uuid <<PK>>
  --
  * project_id : uuid <<FK>>
  * user_id : uuid <<FK>>
  mode : varchar
  title : varchar
  created_at : timestamp
  updated_at : timestamp
}

entity "messages" as messages {
  * id : uuid <<PK>>
  --
  * conversation_id : uuid <<FK>>
  * role : varchar
  agent_name : varchar
  * content : text
  metadata : jsonb
  created_at : timestamp
}

entity "agents" as agents {
  * id : uuid <<PK>>
  --
  * name : varchar
  * display_name : varchar
  * description : text
  capabilities : varchar[]
  * system_prompt : text
  config : jsonb
  is_active : boolean
  created_at : timestamp
  updated_at : timestamp
}

entity "agent_executions" as executions {
  * id : uuid <<PK>>
  --
  * conversation_id : uuid <<FK>>
  * agent_id : uuid <<FK>>
  input : jsonb
  output : jsonb
  * status : varchar
  error_message : text
  tokens_used : integer
  execution_time_ms : integer
  created_at : timestamp
  completed_at : timestamp
}

entity "files" as files {
  * id : uuid <<PK>>
  --
  * project_id : uuid <<FK>>
  * user_id : uuid <<FK>>
  * name : varchar
  * path : varchar
  content : text
  storage_path : varchar
  size : integer
  mime_type : varchar
  created_at : timestamp
}

users ||--o{ profiles : "profiles.id -> users.id"
users ||--o{ projects : "projects.user_id -> users.id"
users ||--o{ conversations : "conversations.user_id -> users.id"
users ||--o{ files : "files.user_id -> users.id"
projects ||--o{ conversations : "conversations.project_id -> projects.id"
projects ||--o{ files : "files.project_id -> projects.id"
projects ||--o{ projects : "parent_project_id (self-reference)"
conversations ||--o{ messages : "messages.conversation_id -> conversations.id"
conversations ||--o{ executions : "executions.conversation_id -> conversations.id"
agents ||--o{ executions : "executions.agent_id -> agents.id"

note right of agents
  Stores 6 AI agents:
  - Mike (Team Leader)
  - Emma (Product Manager)
  - Bob (Architect)
  - Alex (Engineer)
  - David (Data Analyst)
  - Iris (Researcher)
end note

note right of executions
  Tracks agent execution:
  - Status: pending/running/completed/failed
  - Performance metrics
  - Token usage
  - Execution time
end note

note right of messages
  Supports streaming:
  - Progressive updates
  - Real-time sync
  - Agent attribution
end note
@enduml
```

## 8. Unclear Aspects & Assumptions

### 8.1 Clarifications Needed

1. **LLM Model Selection Strategy**
   - How should the system decide which LLM model to use for each agent?
   - Should users be able to override the default model selection?
   - What's the fallback strategy if the primary model fails?

2. **Agent Coordination Logic**
   - How should Mike determine which agent(s) to delegate tasks to?
   - Should multiple agents work in parallel or sequentially?
   - How to handle conflicts when multiple agents provide different solutions?

3. **Streaming Response Handling**
   - Should partial responses be saved to the database incrementally?
   - How to handle stream interruptions (network issues, user cancellation)?
   - What's the buffer size for streaming tokens?

4. **Cost Management**
   - How to track and limit token usage per user/conversation?
   - Should there be warnings when approaching credit limits?
   - How to handle rate limiting from OpenRouter API?

5. **Error Recovery**
   - What's the maximum number of retries for failed API calls?
   - Should the system automatically switch to a different model on failure?
   - How to present error messages to users without exposing technical details?

### 8.2 Assumptions Made

1. **OpenRouter API Stability**
   - Assuming OpenRouter API has >99% uptime
   - Assuming response times are typically <5 seconds for non-streaming
   - Assuming rate limits are sufficient for MVP usage

2. **Agent Capabilities**
   - Assuming each agent can handle its designated tasks independently
   - Assuming system prompts are sufficient for agent behavior
   - Assuming no need for agent memory beyond conversation context

3. **User Behavior**
   - Assuming users will primarily use Engineer Mode for simple tasks
   - Assuming average conversation length is <50 messages
   - Assuming most users will stay within free tier limits

4. **Technical Constraints**
   - Assuming Supabase free tier is sufficient for MVP
   - Assuming browser supports Server-Sent Events for streaming
   - Assuming TypeScript strict mode is acceptable

5. **Security**
   - Assuming Supabase RLS policies are sufficient for data protection
   - Assuming API keys stored in environment variables are secure
   - Assuming no need for end-to-end encryption of messages

### 8.3 Proposed Solutions

1. **Model Selection**: Implement a configuration-based approach where each agent has a preferred model, with automatic fallback to alternatives.

2. **Agent Coordination**: Start with sequential execution (Mike → Agent → Response), add parallel execution in later iterations.

3. **Streaming**: Save complete messages only, use Realtime for progressive UI updates without database writes for each token.

4. **Cost Management**: Implement client-side token estimation and server-side validation, with warnings at 80% credit usage.

5. **Error Recovery**: Max 3 retries with exponential backoff (1s, 2s, 4s), automatic model switching after 2 consecutive failures.

## 9. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] LLM Provider abstraction layer
- [ ] BaseAgent class implementation
- [ ] OpenRouter integration with streaming
- [ ] Basic error handling and retry logic

### Phase 2: Agent Implementation (Week 1-2)
- [ ] Implement all 6 agents (Mike, Emma, Bob, Alex, David, Iris)
- [ ] Define system prompts for each agent
- [ ] Test individual agent responses
- [ ] Optimize prompts based on testing

### Phase 3: Orchestration (Week 2)
- [ ] Message Router implementation
- [ ] Agent Orchestrator with state machine
- [ ] Agent Context for state management
- [ ] Integration with Supabase

### Phase 4: UI Integration (Week 2)
- [ ] Update ChatArea with streaming support
- [ ] Add agent status indicators
- [ ] Implement mode switching UI
- [ ] Add error handling UI

### Phase 5: Testing & Optimization (Week 2)
- [ ] Unit tests for all components
- [ ] Integration tests for agent workflows
- [ ] Performance optimization
- [ ] Documentation and examples

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Agent Response Time | <3s (non-streaming) | Average time from message send to first token |
| Streaming Latency | <500ms | Time to first token in stream |
| API Success Rate | >95% | Successful API calls / Total calls |
| Agent Task Accuracy | >80% | User satisfaction rating |
| Token Efficiency | <2000 tokens/task | Average tokens used per task |
| System Uptime | >99% | Availability monitoring |

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-28  
**Author**: Bob (System Architect)  
**Reviewers**: Mike (Project Lead), Emma (Product Manager)