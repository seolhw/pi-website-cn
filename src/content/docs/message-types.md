---
title: "消息类型"
---

# 消息类型

Pi 会在 SDK 状态、生命周期事件、RPC 响应和持久化会话消息条目中使用 `AgentMessage`。本页说明这些共享消息及其内容块。

消息时间戳使用 Unix 毫秒时间戳，与[会话条目](/session-format/#entry-base)中的 ISO 8601 时间戳不同。

类型定义：

- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/ai/src/types.ts) 定义 Provider 使用的消息和内容块。
- [`packages/agent/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/agent/src/types.ts) 定义可扩展的 `AgentMessage` 联合类型。
- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/messages.ts) 添加 coding-agent 消息角色。

<a id="content-blocks"></a>
## 内容块

<a id="textcontent"></a>
### 文本内容（TextContent）

```typescript
interface TextContent {
  type: "text";
  text: string;
  textSignature?: string;
}
```

`textSignature` 包含 Provider 专用的消息元数据，应将其视为不透明值。

<a id="imagecontent"></a>
### 图片内容（ImageContent）

```typescript
interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
}
```

`data` 是经过 Base64 编码的图片数据。`mimeType` 表示媒体类型，例如 `image/png` 或 `image/jpeg`。

<a id="thinkingcontent"></a>
### 思考内容（ThinkingContent）

```typescript
interface ThinkingContent {
  type: "thinking";
  thinking: string;
  thinkingSignature?: string;
  redacted?: boolean;
}
```

思考签名包含 Provider 专用的重放数据，应将其视为不透明值。经过隐藏处理的内容块可以没有可见思考文本，但仍在 `thinkingSignature` 中保留加密载荷。

<a id="toolcall"></a>
### 工具调用（ToolCall）

```typescript
interface ToolCall {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, any>;
  thoughtSignature?: string;
  namespace?: string;
}
```

`thoughtSignature` 是 Provider 专用字段。`namespace` 用于标识 OpenAI Responses 中动态加载工具或带命名空间工具所属的命名空间。

<a id="usage"></a>
## 用量

助手消息始终包含用量信息。如果工具执行了嵌套的模型任务，工具结果也可能包含用量信息。

```typescript
interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cacheWrite1h?: number;
  reasoning?: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}
```

如果存在，`reasoning` 已包含在 `output` 中，不要重复累加。`cacheWrite1h` 是 `cacheWrite` 中采用一小时保留时长写入的部分。

<a id="base-messages"></a>
## 基础消息

<a id="systemmessage"></a>
### 系统消息（SystemMessage）

```typescript
interface SystemMessage {
  role: "system";
  content: string | TextContent[];
  sections?: Record<string, string | null>;
  toolsAdded?: Tool[];
  toolsRemoved?: ToolReference[];
  timestamp: number;
}
```

开头的系统消息声明初始提示词和工具。后续系统消息可以追加指令、替换或移除命名提示词区段，以及添加或移除工具。按顺序重放这些消息即可得到当前状态。

<a id="usermessage"></a>
### 用户消息（UserMessage）

```typescript
interface UserMessage {
  role: "user";
  content: string | (TextContent | ImageContent)[];
  timestamp: number;
}
```

<a id="assistantmessage"></a>
### 助手消息（AssistantMessage）

```typescript
interface AssistantMessage {
  role: "assistant";
  content: (TextContent | ThinkingContent | ToolCall)[];
  api: string;
  provider: string;
  model: string;
  responseModel?: string;
  responseId?: string;
  providerThinkingLevel?: string;
  thinkingLevel?: ModelThinkingLevel;
  diagnostics?: AssistantMessageDiagnostic[];
  usage: Usage;
  stopReason: "pending" | "stop" | "length" | "toolUse" | "error" | "aborted" | "deferred";
  deferred?: DeferredHandle;
  errorMessage?: string;
  rawStopReason?: string;
  endTurn?: boolean;
  timestamp: number;
}
```

Provider 报告具体模型时，`responseModel` 会记录该模型；它可能与请求的模型相同。`responseId`、`providerThinkingLevel`、`thinkingLevel`、`diagnostics` 和 `rawStopReason` 用于保留 Provider 或运行时细节。

流式传输期间，部分助手消息会使用 `"pending"`。`message_end` 中的完整消息会带有最终停止原因；Pi 不会将 `"pending"` 助手消息持久化到会话 JSONL 文件中。

`"deferred"` 响应会携带 `DeferredHandle`，其中包含获取该响应所需的 Provider 数据：

```typescript
interface DeferredHandle {
  provider: string;
  modelId: string;
  api: string;
  id: string;
  expiresAt?: number;
  pollAfterMs?: number;
  data?: JsonValue;
}
```

<a id="toolresultmessage"></a>
### 工具结果消息（ToolResultMessage）

```typescript
interface ToolResultMessage<TDetails = any> {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: (TextContent | ImageContent)[];
  details?: TDetails;
  usage?: Usage;
  nestedCalls?: NestedToolCalls;
  isError: boolean;
  timestamp: number;
}
```

`details` 由具体工具定义。可选的 `usage` 用于报告工具执行嵌套模型任务时产生的用量，并计入完整会话统计，但不属于主模型调用的用量。`nestedCalls` 会有限度地记录该工具调用其他工具时的元数据：

```typescript
interface NestedToolCalls {
  calls: NestedToolCallRecord[];
  complete: boolean;
}

interface NestedToolCallRecord {
  id: string;
  name: string;
  arguments?: JsonObject;
  argumentsBytes?: number;
  status: "ok" | "error" | "unfinished";
  durationMs?: number;
  error?: string;
}
```

<a id="coding-agent-messages"></a>
## Coding-agent 消息

coding-agent 软件包为 `AgentMessage` 扩展了四种角色。

<a id="bashexecutionmessage"></a>
### Bash 执行消息（BashExecutionMessage）

由直接执行的 Shell 命令创建，包括 RPC [`bash`](/rpc-commands/#bash) 命令。它不是 LLM 工具结果。

```typescript
interface BashExecutionMessage {
  role: "bashExecution";
  command: string;
  output: string;
  exitCode: number | undefined;
  cancelled: boolean;
  truncated: boolean;
  fullOutputPath?: string;
  excludeFromContext?: boolean;
  timestamp: number;
}
```

除非 `excludeFromContext` 为 `true`，否则 Pi 会在下次模型请求前将此消息转换为用户角色的文本。

<a id="custommessage"></a>
### 自定义消息（CustomMessage）

扩展发送上下文消息时会创建此类消息。

```typescript
interface CustomMessage<T = unknown> {
  role: "custom";
  customType: string;
  content: string | (TextContent | ImageContent)[];
  display: boolean;
  details?: T;
  timestamp: number;
}
```

Pi 会在模型请求中将其内容转换为用户消息。`display` 控制是否在终端中渲染；`details` 不会发送给模型。

<a id="branchsummarymessage"></a>
### 分支摘要消息（BranchSummaryMessage）

```typescript
interface BranchSummaryMessage {
  role: "branchSummary";
  summary: string;
  fromId: string | null;
  timestamp: number;
}
```

Pi 会根据持久化的 `branch_summary` 条目创建此上下文消息。

<a id="compactionsummarymessage"></a>
### 压缩摘要消息（CompactionSummaryMessage）

```typescript
interface CompactionSummaryMessage {
  role: "compactionSummary";
  summary: string;
  tokensBefore: number;
  timestamp: number;
}
```

Pi 会根据持久化的 `compaction` 条目创建此上下文消息。

<a id="agentmessage-union"></a>
## AgentMessage 联合类型

在 coding-agent 中，该联合类型等价于：

```typescript
type AgentMessage =
  | SystemMessage
  | UserMessage
  | AssistantMessage
  | ToolResultMessage
  | BashExecutionMessage
  | CustomMessage
  | BranchSummaryMessage
  | CompactionSummaryMessage;
```

在底层 agent 软件包中，`AgentMessage` 的定义为 `Message | CustomAgentMessages[keyof CustomAgentMessages]`。应用可以通过 TypeScript 声明合并添加角色，因此接收来自扩展宿主的消息时，使用方应允许出现未知的自定义角色。
