# Agent Implementation System Design

## 1. Implementation Approach

We will implement 3 additional AI agents to complement the existing Mike (Team Leader) and Alex (Full-stack Engineer):

1. **Emma** - Product Manager: Requirements analysis, PRD writing, user stories
2. **Bob** - System Architect: Technical architecture, system design, technology selection
3. **David** - Data Analyst: Data processing, analysis, visualization

### Technical Strategy

- **Inherit from BaseAgent**: All agents extend the abstract BaseAgent class
- **Consistent Architecture**: Follow the same pattern as MikeAgent and AlexAgent
- **OpenRouter Integration**: Use the configured OpenRouter API with Claude 3.5 Sonnet
- **Message Protocol**: Implement standardized agent communication via MessageProtocol
- **LLM Provider Abstraction**: Leverage the existing LLMProvider interface

### Key Design Decisions

1. **System Prompts**: Each agent has a specialized system prompt that defines their expertise and communication style
2. **Task Handling**: Agents implement `canHandleTask()` to determine if they can process specific tasks
3. **Message Processing**: Agents handle different MessageTypes (USER_REQUEST, TASK_ASSIGNMENT, AGENT_QUESTION, etc.)
4. **Error Handling**: Graceful error handling with fallback to asking Mike for clarification

## 2. Main User-Agent Interaction Patterns

### Scenario 1: Requirements Analysis (Emma)
```
User → Mike: "I need a todo app"
Mike → Emma: TASK_ASSIGNMENT (Requirements Analysis)
Emma → LLM: Analyze requirements and create PRD
Emma → Mike: TASK_COMPLETED (PRD document)
Mike → User: Present PRD for approval
```

### Scenario 2: Architecture Design (Bob)
```
Mike → Bob: TASK_ASSIGNMENT (System Architecture Design)
Bob → LLM: Design system architecture
Bob → Mike: TASK_COMPLETED (Architecture document with diagrams)
Mike → Alex: TASK_ASSIGNMENT (Implementation)
```

### Scenario 3: Data Analysis (David)
```
User → Mike: "Analyze this dataset"
Mike → David: TASK_ASSIGNMENT (Data Analysis)
David → LLM: Process and analyze data
David → Mike: TASK_COMPLETED (Analysis report with visualizations)
```

## 3. Architecture

```plantuml
@startuml
package "Agent System" {
  abstract class BaseAgent {
    #config: AgentConfig
    #llmProvider: LLMProvider
    #context: AgentContext
    +processMessage(message: AgentMessage): Promise<AgentMessage | null>
    +executeTask(task: Task): Promise<Task>
    +canHandleTask(task: Task): boolean
    #generateResponse(userMessage: string): Promise<string>
  }
  
  class MikeAgent extends BaseAgent {
    -handleUserRequest(message: AgentMessage): Promise<AgentMessage>
    -handleTaskCompletion(message: AgentMessage): Promise<AgentMessage>
    -createTasksFromAnalysis(analysis: string): Task[]
  }
  
  class EmmaAgent extends BaseAgent {
    -handleTaskAssignment(message: AgentMessage): Promise<AgentMessage>
    -analyzeRequirements(description: string): Promise<string>
    -createPRD(requirements: string): Promise<string>
    -createUserStories(requirements: string): Promise<string[]>
  }
  
  class BobAgent extends BaseAgent {
    -handleTaskAssignment(message: AgentMessage): Promise<AgentMessage>
    -designArchitecture(requirements: string): Promise<string>
    -selectTechnology(requirements: string): Promise<string>
    -createSystemDiagram(architecture: string): Promise<string>
  }
  
  class AlexAgent extends BaseAgent {
    -handleTaskAssignment(message: AgentMessage): Promise<AgentMessage>
    -createImplementationPlan(task: Task): Promise<string>
    -generateCode(task: Task, plan: string): Promise<string>
  }
  
  class DavidAgent extends BaseAgent {
    -handleTaskAssignment(message: AgentMessage): Promise<AgentMessage>
    -analyzeData(data: any): Promise<string>
    -createVisualization(data: any): Promise<string>
    -extractInsights(analysis: string): Promise<string[]>
  }
  
  class AgentOrchestrator {
    -agents: Map<AgentRole, BaseAgent>
    -llmProvider: LLMProvider
    -messageHistory: AgentMessage[]
    -activeTasks: Map<string, Task>
    +processUserRequest(message: string): Promise<void>
    -executeTasks(tasks: Task[]): Promise<void>
    -executeTask(task: Task): Promise<void>
  }
}

package "LLM Integration" {
  interface LLMProvider {
    +complete(messages: LLMMessage[]): Promise<LLMResponse>
    +streamComplete(messages: LLMMessage[], onChunk: Function): Promise<void>
  }
  
  class OpenRouterProvider implements LLMProvider {
    -apiKey: string
    -model: string
    -baseURL: string
  }
}

package "Communication Protocol" {
  enum AgentRole {
    MIKE
    EMMA
    BOB
    ALEX
    DAVID
    USER
    SYSTEM
  }
  
  enum MessageType {
    USER_REQUEST
    AGENT_MESSAGE
    TASK_ASSIGNMENT
    TASK_ACCEPTED
    TASK_COMPLETED
    AGENT_QUESTION
  }
  
  class AgentMessage {
    +id: string
    +type: MessageType
    +from: AgentRole
    +to: AgentRole
    +content: string
    +metadata: Record<string, any>
    +timestamp: Date
  }
  
  class Task {
    +id: string
    +title: string
    +description: string
    +assignee: AgentRole
    +status: TaskStatus
    +priority: string
    +dependencies: string[]
    +result: any
  }
}

AgentOrchestrator --> BaseAgent : manages
BaseAgent --> LLMProvider : uses
BaseAgent --> AgentMessage : sends/receives
BaseAgent --> Task : executes
AgentOrchestrator --> OpenRouterProvider : creates
@enduml
```

## 4. UI Navigation Flow

```plantuml
@startuml
state "Chat Interface" as Chat {
  [*] --> Idle
  
  Idle --> UserInput : user types message
  UserInput --> MikeProcessing : send to Mike
  
  MikeProcessing --> EmmaWorking : assign to Emma
  MikeProcessing --> BobWorking : assign to Bob
  MikeProcessing --> AlexWorking : assign to Alex
  MikeProcessing --> DavidWorking : assign to David
  
  EmmaWorking --> TaskComplete : PRD ready
  BobWorking --> TaskComplete : Architecture ready
  AlexWorking --> TaskComplete : Code ready
  DavidWorking --> TaskComplete : Analysis ready
  
  TaskComplete --> MikeProcessing : report to Mike
  TaskComplete --> Idle : all tasks done
  
  state MikeProcessing {
    [*] --> AnalyzeRequest
    AnalyzeRequest --> CreateTasks
    CreateTasks --> AssignTasks
    AssignTasks --> [*]
  }
  
  state EmmaWorking {
    [*] --> AnalyzeRequirements
    AnalyzeRequirements --> WritePRD
    WritePRD --> CreateUserStories
    CreateUserStories --> [*]
  }
  
  state BobWorking {
    [*] --> DesignArchitecture
    DesignArchitecture --> SelectTechnology
    SelectTechnology --> CreateDiagrams
    CreateDiagrams --> [*]
  }
  
  state AlexWorking {
    [*] --> PlanImplementation
    PlanImplementation --> WriteCode
    WriteCode --> TestCode
    TestCode --> [*]
  }
  
  state DavidWorking {
    [*] --> ProcessData
    ProcessData --> AnalyzeData
    AnalyzeData --> CreateVisualizations
    CreateVisualizations --> [*]
  }
}
@enduml
```

## 5. Class Diagram

```plantuml
@startuml
interface IAgent {
  +getRole(): AgentRole
  +getName(): string
  +getDescription(): string
  +setContext(context: AgentContext): void
  +processMessage(message: AgentMessage): Promise<AgentMessage | null>
  +executeTask(task: Task): Promise<Task>
  +canHandleTask(task: Task): boolean
}

abstract class BaseAgent implements IAgent {
  #config: AgentConfig
  #llmProvider: LLMProvider
  #context?: AgentContext
  
  +constructor(config: AgentConfig)
  +getRole(): AgentRole
  +getName(): string
  +getDescription(): string
  +setContext(context: AgentContext): void
  {abstract} +processMessage(message: AgentMessage): Promise<AgentMessage | null>
  {abstract} +executeTask(task: Task): Promise<Task>
  {abstract} +canHandleTask(task: Task): boolean
  #generateResponse(userMessage: string, conversationHistory?: AgentMessage[]): Promise<string>
  #generateStreamingResponse(userMessage: string, onChunk: (content: string) => void, conversationHistory?: AgentMessage[]): Promise<void>
  #sendMessage(type: MessageType, content: string, to?: AgentRole, metadata?: Record<string, any>): AgentMessage
  #updateTask(task: Task, status: TaskStatus, result?: any, error?: string): Task
  #log(message: string, level: 'info' | 'warn' | 'error'): void
}

class EmmaAgent extends BaseAgent {
  -EMMA_SYSTEM_PROMPT: string
  
  +constructor(llmProvider: LLMProvider)
  +processMessage(message: AgentMessage): Promise<AgentMessage | null>
  +executeTask(task: Task): Promise<Task>
  +canHandleTask(task: Task): boolean
  -handleTaskAssignment(message: AgentMessage): Promise<AgentMessage>
  -handleMessage(message: AgentMessage): Promise<AgentMessage>
  -analyzeRequirements(description: string): Promise<string>
  -createPRD(requirements: string): Promise<string>
  -createUserStories(requirements: string): Promise<string[]>
}

class BobAgent extends BaseAgent {
  -BOB_SYSTEM_PROMPT: string
  
  +constructor(llmProvider: LLMProvider)
  +processMessage(message: AgentMessage): Promise<AgentMessage | null>
  +executeTask(task: Task): Promise<Task>
  +canHandleTask(task: Task): boolean
  -handleTaskAssignment(message: AgentMessage): Promise<AgentMessage>
  -handleMessage(message: AgentMessage): Promise<AgentMessage>
  -designArchitecture(requirements: string): Promise<string>
  -selectTechnology(requirements: string): Promise<string>
  -createSystemDiagram(architecture: string): Promise<string>
}

class DavidAgent extends BaseAgent {
  -DAVID_SYSTEM_PROMPT: string
  
  +constructor(llmProvider: LLMProvider)
  +processMessage(message: AgentMessage): Promise<AgentMessage | null>
  +executeTask(task: Task): Promise<Task>
  +canHandleTask(task: Task): boolean
  -handleTaskAssignment(message: AgentMessage): Promise<AgentMessage>
  -handleMessage(message: AgentMessage): Promise<AgentMessage>
  -analyzeData(data: any): Promise<string>
  -createVisualization(data: any): Promise<string>
  -extractInsights(analysis: string): Promise<string[]>
}

class AgentConfig {
  +role: AgentRole
  +name: string
  +description: string
  +systemPrompt: string
  +llmProvider: LLMProvider
}

interface LLMProvider {
  +complete(messages: LLMMessage[]): Promise<LLMResponse>
  +streamComplete(messages: LLMMessage[], onChunk: (chunk: LLMResponse) => void): Promise<void>
}

class LLMMessage {
  +role: 'system' | 'user' | 'assistant'
  +content: string
}

class LLMResponse {
  +content: string
  +done: boolean
  +model?: string
  +usage?: {prompt_tokens: number, completion_tokens: number, total_tokens: number}
}

BaseAgent --> AgentConfig : uses
BaseAgent --> LLMProvider : uses
EmmaAgent ..> AgentConfig : creates
BobAgent ..> AgentConfig : creates
DavidAgent ..> AgentConfig : creates
LLMProvider ..> LLMMessage : receives
LLMProvider ..> LLMResponse : returns
@enduml
```

## 6. Sequence Diagram

```plantuml
@startuml
actor User
participant "ChatArea" as UI
participant "AgentOrchestrator" as Orchestrator
participant "MikeAgent" as Mike
participant "EmmaAgent" as Emma
participant "BobAgent" as Bob
participant "AlexAgent" as Alex
participant "OpenRouterProvider" as LLM
participant "Supabase" as DB

User -> UI: "Create a todo app with user authentication"
activate UI

UI -> DB: createMessage(user_message)
note right
  Input: {
    conversation_id: "uuid",
    role: "user",
    content: "Create a todo app..."
  }
end note
DB --> UI: message_saved

UI -> Orchestrator: processUserRequest(message)
activate Orchestrator

Orchestrator -> Mike: processMessage(USER_REQUEST)
activate Mike

Mike -> LLM: complete([system_prompt, user_message])
note right
  System Prompt: "You are Mike, Team Leader..."
  User Message: "Create a todo app..."
end note
LLM --> Mike: analysis_result
note right
  Output: {
    content: "Project Analysis:\n1. Needs Emma for PRD\n2. Needs Bob for architecture\n3. Needs Alex for implementation"
  }
end note

Mike -> Mike: createTasksFromAnalysis(analysis)
Mike --> Orchestrator: AgentMessage with tasks[]
note right
  Output: {
    type: "AGENT_MESSAGE",
    from: "Mike",
    content: "I've analyzed your request...",
    metadata: {
      tasks: [
        {id: "t1", title: "Requirements Analysis", assignee: "Emma"},
        {id: "t2", title: "Architecture Design", assignee: "Bob", dependencies: ["t1"]},
        {id: "t3", title: "Implementation", assignee: "Alex", dependencies: ["t2"]}
      ]
    }
  }
end note
deactivate Mike

Orchestrator -> DB: createMessage(mike_response)
DB --> Orchestrator: message_saved

Orchestrator -> UI: onAgentMessage("Mike", content)
UI --> User: Display Mike's analysis

Orchestrator -> Orchestrator: executeTasks(tasks)

== Task 1: Requirements Analysis ==

Orchestrator -> Emma: processMessage(TASK_ASSIGNMENT)
activate Emma

Emma -> Emma: canHandleTask(task)
Emma --> Orchestrator: TASK_ACCEPTED

Orchestrator -> Emma: executeTask(task)

Emma -> Emma: analyzeRequirements(description)
Emma -> LLM: complete([system_prompt, requirements])
note right
  System Prompt: "You are Emma, Product Manager..."
  Input: "Analyze requirements for todo app with auth"
end note
LLM --> Emma: requirements_analysis

Emma -> Emma: createPRD(requirements)
Emma -> LLM: complete([system_prompt, create_prd_prompt])
LLM --> Emma: prd_document

Emma --> Orchestrator: Task(COMPLETED, result: {prd})
note right
  Output: {
    status: "COMPLETED",
    result: {
      prd: "# Product Requirements Document\n## Overview\n...",
      userStories: ["As a user, I want to...", ...]
    }
  }
end note
deactivate Emma

Orchestrator -> DB: createMessage(emma_result)
DB --> Orchestrator: message_saved

Orchestrator -> UI: onAgentMessage("Emma", prd_content)
UI --> User: Display PRD

== Task 2: Architecture Design ==

Orchestrator -> Bob: processMessage(TASK_ASSIGNMENT)
activate Bob

Bob -> Bob: canHandleTask(task)
Bob --> Orchestrator: TASK_ACCEPTED

Orchestrator -> Bob: executeTask(task)

Bob -> Bob: designArchitecture(requirements)
Bob -> LLM: complete([system_prompt, design_prompt])
note right
  System Prompt: "You are Bob, System Architect..."
  Input: "Design architecture for todo app based on PRD"
end note
LLM --> Bob: architecture_design

Bob -> Bob: selectTechnology(requirements)
Bob -> LLM: complete([system_prompt, tech_selection_prompt])
LLM --> Bob: technology_stack

Bob --> Orchestrator: Task(COMPLETED, result: {architecture})
note right
  Output: {
    status: "COMPLETED",
    result: {
      architecture: "## System Architecture\n...",
      techStack: {frontend: "React", backend: "Supabase", ...},
      diagrams: "```plantuml\n...\n```"
    }
  }
end note
deactivate Bob

Orchestrator -> DB: createMessage(bob_result)
DB --> Orchestrator: message_saved

Orchestrator -> UI: onAgentMessage("Bob", architecture_content)
UI --> User: Display Architecture

== Task 3: Implementation ==

Orchestrator -> Alex: processMessage(TASK_ASSIGNMENT)
activate Alex

Alex -> Alex: canHandleTask(task)
Alex --> Orchestrator: TASK_ACCEPTED

Orchestrator -> Alex: executeTask(task)

Alex -> Alex: createImplementationPlan(task)
Alex -> LLM: complete([system_prompt, plan_prompt])
LLM --> Alex: implementation_plan

Alex -> Alex: generateCode(task, plan)
Alex -> LLM: complete([system_prompt, code_generation_prompt])
note right
  System Prompt: "You are Alex, Full-stack Engineer..."
  Input: "Implement todo app based on architecture"
end note
LLM --> Alex: code_files

Alex --> Orchestrator: Task(COMPLETED, result: {code})
note right
  Output: {
    status: "COMPLETED",
    result: {
      plan: "Implementation Plan:\n1. Setup project\n2. ...",
      code: {
        "App.tsx": "import React...",
        "TodoList.tsx": "export const TodoList...",
        ...
      }
    }
  }
end note
deactivate Alex

Orchestrator -> DB: createMessage(alex_result)
DB --> Orchestrator: message_saved

Orchestrator -> UI: onAgentMessage("Alex", code_content)
deactivate Orchestrator

UI --> User: Display Code & Preview
deactivate UI
@enduml
```

## 7. Database ER Diagram

The existing database schema already supports the agent system:

```plantuml
@startuml
entity "conversations" as conv {
  * id : uuid <<PK>>
  --
  * project_id : uuid <<FK>>
  * user_id : uuid <<FK>>
  * mode : text
  * created_at : timestamp
}

entity "messages" as msg {
  * id : uuid <<PK>>
  --
  * conversation_id : uuid <<FK>>
  * role : text
  agent_name : text
  * content : text
  metadata : jsonb
  * created_at : timestamp
}

entity "projects" as proj {
  * id : uuid <<PK>>
  --
  * user_id : uuid <<FK>>
  * name : text
  description : text
  permission : text
  generated_code : jsonb
  version : integer
  parent_project_id : uuid <<FK>>
  * created_at : timestamp
  * updated_at : timestamp
}

conv ||--o{ msg : "has many"
proj ||--o{ conv : "has many"

note right of msg
  agent_name can be:
  - "Mike" (Team Leader)
  - "Emma" (Product Manager)
  - "Bob" (System Architect)
  - "Alex" (Full-stack Engineer)
  - "David" (Data Analyst)
  
  metadata stores:
  - tasks: Task[]
  - analysis: string
  - prd: string
  - architecture: string
  - code: Record<string, string>
  - visualizations: string[]
end note
@enduml
```

## 8. Anything UNCLEAR

### Clarifications Needed

1. **Agent Priority**: When multiple agents can handle a task, which one should take priority?
   - **Assumption**: Mike's task assignment is authoritative

2. **Streaming vs Non-streaming**: Should all agents support streaming responses?
   - **Assumption**: Start with non-streaming, add streaming in Phase 2

3. **Error Recovery**: How should agents handle LLM API failures?
   - **Assumption**: Retry 3 times, then ask Mike for help

4. **Task Dependencies**: How to handle circular dependencies?
   - **Assumption**: Mike's task creation logic prevents circular dependencies

5. **Data Visualization**: Should David generate actual chart code or just descriptions?
   - **Assumption**: Start with descriptions, add actual chart generation in Phase 2

## 9. Implementation Phases

### Phase 1: Core Agent Implementation (Week 1)
- Implement EmmaAgent, BobAgent, DavidAgent classes
- Define system prompts for each agent
- Implement basic message handling and task execution
- Add agents to MessageProtocol enum

### Phase 2: Orchestrator Integration (Week 1)
- Update AgentOrchestrator to register new agents
- Implement task routing logic
- Test agent collaboration flow
- Update MikeAgent to create tasks for new agents

### Phase 3: Testing & Refinement (Week 2)
- Unit tests for each agent
- Integration tests for agent collaboration
- Prompt optimization based on test results
- Error handling improvements

### Phase 4: UI Integration (Week 2)
- Update ChatArea to display agent-specific messages
- Add agent status indicators
- Implement task progress visualization
- Add agent selection UI (if needed)

## 10. Success Criteria

- [ ] All 3 new agents (Emma, Bob, David) implemented and registered
- [ ] Agents can handle their respective task types
- [ ] Mike can successfully delegate tasks to appropriate agents
- [ ] Agent responses are saved to database with correct agent_name
- [ ] UI displays agent messages with correct avatars
- [ ] End-to-end flow works: User → Mike → Emma/Bob/David → Alex → Result
- [ ] Error handling works gracefully
- [ ] Code follows existing patterns and conventions