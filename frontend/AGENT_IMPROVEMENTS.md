# Agent 协作系统改进计划

基于 MetaGPT 的设计和当前遇到的问题,制定以下改进计划。

## 🐛 当前问题

### 问题 1: Mike 误判简单问候
**案例**: "你好,你能做什么"
- **错误行为**: Mike 创建任务分配给 Alex
- **正确行为**: Mike 应直接回答介绍团队能力
- **状态**: ✅ 已修复 (添加中文能力查询识别)

### 问题 2: Agent 误解任务意图
**案例**: Alex 收到 "你好,你能做什么" 的任务
- **Alex 的理解**: 实现一个多语言问候功能
- **实际意图**: 回答用户关于能力的问题
- **根本原因**: 任务描述不清晰,缺少上下文

### 问题 3: 缺少反馈循环
**问题**: 没有机制验证 agent 的输出是否符合用户意图
- MetaGPT 有 QA Engineer 检查代码
- 我们的系统缺少质量验证环节

## 🎯 MetaGPT 核心机制学习

### 1. 消息订阅机制 (`_watch`)
```python
# ProductManager 只响应特定类型的消息
self._watch([UserRequirement, PrepareDocuments])
```

**借鉴**:
- 每个 agent 应明确声明它关注哪些类型的消息
- 不是所有消息都需要所有 agent 处理

### 2. 顺序执行模式 (`react_mode`)
```python
# 按顺序执行 actions
self.rc.react_mode = RoleReactMode.BY_ORDER
self.set_actions([PrepareDocuments, WritePRD])
```

**借鉴**:
- Emma 完成 PRD 后,才触发 Bob
- Bob 完成架构后,才触发 Alex
- 当前我们的依赖检查在 Orchestrator,应该在 agent 级别

### 3. 环境驱动执行
```python
# 发布消息到环境
self.env.publish_message(Message(content=idea))
# 环境协调所有角色
await self.env.run()
```

**借鉴**:
- 消息应该发布到共享环境
- Agent 从环境中获取消息,而不是直接传递

### 4. 明确的 Action 定义
```python
# 每个角色有明确的 actions
class ProductManager:
    todo_action = "WritePRD"

class Architect:
    todo_action = "WriteDesign"
```

**借鉴**:
- 每个 agent 应该有明确的输出类型
- Emma 输出 PRD 文档
- Bob 输出架构设计
- Alex 输出实现计划

## 📋 改进计划

### ✅ 阶段 1: 快速修复 (已完成)
- [x] 改进 Mike 的问候识别
- [x] 添加中文能力查询支持
- [x] 提供格式化的团队介绍

### 🔄 阶段 2: 任务上下文增强 (进行中)

#### 2.1 改进任务描述生成
**目标**: Mike 创建的任务应该包含完整上下文

**实现**:
```typescript
// 当前
task.description = "Work on: 你好,你能做什么"

// 改进后
task.description = `
原始用户请求: "你好,你能做什么"

任务类型: 简单问答
目标: 回答用户关于团队能力的问题

预期输出:
- 清晰介绍团队成员
- 说明各自的专业领域
- 提供示例应用场景

上下文:
- 这是一个简单咨询,不是开发任务
- 用户使用中文,请用中文回复
- 重点在于展示团队能力,而不是技术实现
`
```

#### 2.2 添加任务类型枚举
```typescript
enum TaskType {
  INQUIRY = 'inquiry',           // 咨询问答
  REQUIREMENT_ANALYSIS = 'requirement_analysis',  // 需求分析
  ARCHITECTURE_DESIGN = 'architecture_design',     // 架构设计
  IMPLEMENTATION = 'implementation',               // 实现开发
  DATA_ANALYSIS = 'data_analysis',                 // 数据分析
}
```

#### 2.3 Agent 根据任务类型调整行为
```typescript
// EmmaAgent.ts
async executeTask(task: Task): Promise<Task> {
  if (task.type === TaskType.INQUIRY) {
    // 简单回答,不生成 PRD
    return this.answerInquiry(task);
  } else if (task.type === TaskType.REQUIREMENT_ANALYSIS) {
    // 生成完整 PRD
    return this.generatePRD(task);
  }
}
```

### 🚀 阶段 3: 环境和消息池 (计划中)

#### 3.1 实现共享消息池
```typescript
class SharedMessagePool {
  private messages: Map<string, Message[]> = new Map();

  publish(conversationId: string, message: Message) {
    // 发布消息到池中
  }

  subscribe(conversationId: string, messageType: MessageType) {
    // 订阅特定类型的消息
  }
}
```

#### 3.2 Agent 订阅机制
```typescript
class EmmaAgent extends BaseAgent {
  // Emma 只关注用户需求和 Mike 的任务分配
  watchedMessageTypes = [
    MessageType.USER_REQUIREMENT,
    MessageType.TASK_ASSIGNMENT
  ];
}
```

### 🔍 阶段 4: 质量验证 (未来)

#### 4.1 添加验证步骤
```typescript
class ReviewAgent extends BaseAgent {
  async reviewOutput(task: Task, output: any): Promise<boolean> {
    // 检查输出是否符合任务要求
    // 如果不符合,返回 false 并提供修改建议
  }
}
```

#### 4.2 反馈循环
```
用户请求 → Mike 分析 → Agent 执行 → Review 验证
                                    ↓ (不通过)
                              Agent 修正 → Review 再验证
```

## 🎯 近期优先级

1. **高优先级** (本周完成)
   - ✅ 修复 Mike 的中文问候识别
   - ⏳ 改进任务描述生成 (添加任务类型和上下文)
   - ⏳ Agent 根据任务类型调整行为

2. **中优先级** (两周内)
   - 实现共享消息池
   - 添加消息订阅机制
   - 改进依赖管理

3. **低优先级** (一个月内)
   - 添加质量验证环节
   - 实现反馈循环
   - 完善错误处理

## 📚 参考资料

- MetaGPT 源码: `/Users/ritsu/MetaGPT/`
- MetaGPT 论文: https://arxiv.org/abs/2308.00352
- 当前实现: `/Users/ritsu/Downloads/1028/mgx-demo/frontend/src/lib/agents/`

## 🔗 相关文件

- `MikeAgent.ts` - 团队负责人,请求分类
- `EmmaAgent.ts` - 产品经理,需求分析
- `BobAgent.ts` - 架构师,系统设计
- `AlexAgent.ts` - 全栈工程师,实现开发
- `AgentOrchestrator.ts` - 任务编排器
- `MessageProtocol.ts` - 消息协议定义
