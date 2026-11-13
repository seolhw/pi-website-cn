---
title: "JSON 事件流"
---

# JSON 事件流

JSON 模式会为一次调用输出结构化的进度信息：

```bash
pi --mode json "Review this repository"
```

Pi 会先写入一个会话头，然后写入会话事件；所提供的提示词处理完毕后进程退出。RPC 模式也会输出相同结构的会话事件，但由于它是双向的长连接协议，因此没有会话头。请参阅 [RPC 模式](/rpc/)。

本页是 JSON 和 RPC 模式共用事件的权威参考。消息值使用[共享消息类型](/message-types/)。

<a id="framing-and-process-io"></a>
## 消息分帧与进程 I/O

事件流严格使用 JSONL 分帧。每条记录是一个以 LF（`\n`）结尾的 JSON 对象。仅按 LF 拆分记录，并移除可能存在的前置回车符。Unicode 行分隔符和段落分隔符在 JSON 字符串中有效，不是记录边界。

Node.js 的 `readline` 不适用于此事件流，因为它也会识别这些 Unicode 分隔符。应使用字节流或 UTF-8 流解码器，并按 LF 拆分。

应持续读取标准输出。如果读取方停止消费记录，管道缓冲区填满后 Pi 可能会被阻塞。标准输出专用于 JSONL；诊断信息和应用日志会写入标准错误。

<a id="session-header"></a>
## 会话头

JSON 模式的第一条记录是当前[会话头](/session-format/#sessionheader)：

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path"}
```

RPC 模式不会输出此记录。使用 [`get_state`](/rpc-commands/#get_state) 获取当前会话 ID 和文件路径。

<a id="event-sequence"></a>
## 事件顺序

A basic run produces records like these:

```json
{"type":"agent_start"}
{"type":"turn_start"}
{"type":"message_start","message":{"role":"user","content":"Review this repository","timestamp":1733234401000}}
{"type":"message_end","message":{"role":"user","content":"Review this repository","timestamp":1733234401000}}
{"type":"message_start","message":{"role":"assistant","content":[],"stopReason":"pending","...":"..."}}
{"type":"message_update","usage":{"...":"..."},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hello"}}
{"type":"message_end","message":{"role":"assistant","...":"..."}}
{"type":"turn_end","message":{"role":"assistant","...":"..."},"toolResults":[]}
{"type":"agent_end","messages":[{"...":"..."}],"willRetry":false}
{"type":"agent_settled","aborted":false}
```

`agent_end` 表示一次底层 Agent 运行结束。自动重试、溢出恢复、压缩后重试、引导消息或后续任务仍可能继续。`agent_settled` 表示 Pi 对该会话级运行已无待执行的自动任务。

<a id="agent-and-turn-events"></a>
## Agent 与轮次事件

| 事件 | 字段 | 含义 |
|---|---|---|
| `agent_start` | 无 | 底层 Agent 运行开始。 |
| `agent_end` | `messages`、`willRetry` | 底层运行结束。`messages` 包含本次运行生成的消息。 |
| `agent_settled` | `aborted` | Pi 不会再自动执行重试、压缩恢复或排队消息。如果运行因中止而结束，则 `aborted` 为 `true`。 |
| `turn_start` | 无 | 一轮助手回复开始。 |
| `turn_end` | `message`、`toolResults` | 一条助手回复及其产生的工具调用均已完成。 |

一轮包含一条助手回复，以及该回复产生的所有工具调用和工具结果。

<a id="message-events"></a>
## 消息事件

| 事件 | 字段 | 含义 |
|---|---|---|
| `message_start` | `message` | 消息开始。 |
| `message_update` | `usage`、`assistantMessageEvent` | 助手消息发出内容块更新。 |
| `message_end` | `message` | 消息完成。这是最终消息的权威来源。 |

<a id="reconstruct-streaming-messages"></a>
### 重建流式消息

线上的 `message_update` 记录只包含增量内容。为了保持事件流大小线性增长，这些记录会省略 SDK 事件中的累计 `message` 字段以及所有 `assistantMessageEvent.partial` 快照。

嵌套事件类型如下：

| 类型 | 除 `type` 外的字段 | 含义 |
|---|---|---|
| `start` | 无 | Provider 事件流开始；其累计的 `partial` 字段在线上会被移除。 |
| `text_start` | `contentIndex` | 文本块开始。 |
| `text_delta` | `contentIndex`、`delta` | 向文本块追加内容。 |
| `text_end` | `contentIndex`、`content` | 文本块结束，并提供权威的完整内容。 |
| `thinking_start` | `contentIndex` | 思考块开始。 |
| `thinking_delta` | `contentIndex`、`delta` | 向思考块追加文本。 |
| `thinking_end` | `contentIndex`、`content` | 思考块结束，并提供权威的完整内容。 |
| `toolcall_start` | `contentIndex`、`id`、`toolName` | 工具调用块开始。 |
| `toolcall_delta` | `contentIndex`、`delta` | 追加序列化后的参数数据。 |
| `toolcall_end` | `contentIndex`、`toolCall` | 工具调用结束，并提供完整的 `ToolCall`。 |
| `done` | `reason`、`message` | Provider 事件流成功完成。 |
| `error` | `reason`、`error` | Provider 事件流以错误或中止消息结束。 |

常规 Agent 循环会将 Provider 层的 `start`、`done` 和 `error` 转换为 `message_start` 和 `message_end` 会话事件，而不会将它们作为 `message_update` 发出。对于自行构造对应会话事件的调用方，导出的 `JsonAgentSessionEvent` 转换类型仍允许这些事件。

使用 `contentIndex` 标识内容块。实时显示时可以缓存 `delta` 字段；收到 `text_end`、`thinking_end` 或 `toolcall_end` 时，应以其中的完整内容替换重建结果。收到 `message_end.message` 后，则应以该消息整体替换部分消息。

顶层 `usage` 是 Provider 对该助手回复报告的最新累计用量。如果 Provider 在流式传输期间不报告用量，该值可能会一直为零，直到回复完成。

```json
{"type":"message_update","usage":{"input":100,"output":1,"cacheRead":0,"cacheWrite":0,"totalTokens":101,"cost":{"input":0,"output":0,"cacheRead":0,"cacheWrite":0,"total":0}},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hello "}}
```

<a id="tool-execution-events"></a>
## 工具执行事件

| 事件 | 字段 | 含义 |
|---|---|---|
| `tool_execution_start` | `toolCallId`、`toolName`、`args` | 工具开始执行。 |
| `tool_execution_update` | `toolCallId`、`toolName`、`args`、`partialResult` | 工具报告了部分结果。 |
| `tool_execution_end` | `toolCallId`、`toolName`、`result`、`isError`、`durationMs` | 工具执行完成。`durationMs` 是工具 `execute()` 方法的耗时，使用单调时钟测量；如果工具没有实际运行，则该字段不存在。 |

使用 `toolCallId` 关联工具调用的完整生命周期。`partialResult` 是工具提供的最新部分结果；它是替换还是扩展前一次更新，取决于该工具的结果约定。

```json
{"type":"tool_execution_start","toolCallId":"call_abc123","toolName":"bash","args":{"command":"ls -la"}}
{"type":"tool_execution_update","toolCallId":"call_abc123","toolName":"bash","args":{"command":"ls -la"},"partialResult":{"content":[{"type":"text","text":"partial output"}],"details":{}}}
{"type":"tool_execution_end","toolCallId":"call_abc123","toolName":"bash","result":{"content":[{"type":"text","text":"complete output"}],"details":{}},"isError":false}
```

<a id="queue-and-state-events"></a>
## 队列与状态事件

| 事件 | 字段 | 含义 |
|---|---|---|
| `queue_update` | `steering`、`followUp` | 待处理的引导消息队列或后续消息队列发生变化。两个字段都包含相应队列的完整当前内容。 |
| `entry_appended` | `entry` | 扩展通过 `pi.appendEntry()` 添加了自定义会话条目。 |
| `session_info_changed` | `name` | 会话显示名称发生变化。若没有 `name` 字段，表示名称已清除。 |
| `thinking_level_changed` | `level` | 当前思考等级发生变化。 |

`entry` 值使用持久化的[会话条目类型](/session-format/#entry-types)。

<a id="compaction-events"></a>
## 压缩事件

`compaction_start` 会报告开始压缩的原因：

```json
{"type":"compaction_start","reason":"threshold"}
```

`reason` 的值为 `"manual"`、`"threshold"` 或 `"overflow"`。

压缩成功时，`compaction_end` 会包含结果：

```json
{
  "type": "compaction_end",
  "reason": "threshold",
  "result": {
    "summary": "Summary of conversation...",
    "firstKeptEntryId": "abc123",
    "tokensBefore": 150000,
    "estimatedTokensAfter": 32000,
    "usage": {"...": "..."},
    "details": {}
  },
  "aborted": false,
  "willRetry": false
}
```

如果压缩被中止，`result` 字段不存在且 `aborted` 为 `true`。如果压缩失败，`result` 字段不存在、`aborted` 为 `false`，并由 `errorMessage` 描述失败原因。溢出恢复成功后，Pi 重试提示词前会将 `willRetry` 设为 `true`。

结果语义请参阅[压缩与分支摘要](/compaction/)。

<a id="retry-events"></a>
## 重试事件

助手轮次重试会发出：

```json
{"type":"auto_retry_start","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"529 overloaded"}
{"type":"auto_retry_end","success":true,"attempt":2}
```

最终失败时，`auto_retry_end` 的 `success` 为 `false`，并包含 `finalError` 字符串。

压缩和分支摘要重试会发出：

```json
{"type":"summarization_retry_scheduled","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"terminated"}
{"type":"summarization_retry_attempt_start","source":"compaction","reason":"threshold"}
{"type":"summarization_retry_finished"}
```

对于分支摘要，`source` 为 `"branchSummary"`，且不包含 `reason`。压缩重试的 `reason` 为 `"manual"`、`"threshold"` 或 `"overflow"`。

<a id="rpc-only-events"></a>
## 仅 RPC 模式事件

直接调用 RPC [`bash`](/rpc-commands/#bash) 命令时，每个输出块都会发出一条 `bash_execution_update`。可选的 `id` 与命令 ID 对应。最终命令响应中的输出可能会被截断，但这些事件会流式发送全部输出：

```json
{"type":"bash_execution_update","id":"req-1","delta":"total 48\n"}
```

扩展处理器抛出异常时，RPC 还会发出 `extension_error`：

```json
{"type":"extension_error","extensionPath":"/path/to/extension.ts","event":"tool_call","error":"Error message"}
```

扩展 UI 记录属于独立的 RPC 子协议，不是 `AgentSessionEvent` 值。请参阅 [RPC 扩展 UI](/rpc-extension-ui/)。

<a id="typescript-types"></a>
## TypeScript 类型

SDK 的 `AgentSessionEvent` 会为进程内调用方提供累计的流式快照。JSON 和 RPC 只会转换 `message_update`：

```typescript
type WithoutPartial<T> = T extends { partial: unknown } ? Omit<T, "partial"> : T;

type JsonAssistantMessageEvent<T> = T extends { type: "toolcall_start"; partial: unknown }
  ? WithoutPartial<T> & { id: string; toolName: string }
  : WithoutPartial<T>;

type JsonAgentSessionEvent =
  | Exclude<AgentSessionEvent, { type: "message_update" }>
  | {
      type: "message_update";
      usage: Usage;
      assistantMessageEvent: JsonAssistantMessageEvent<AssistantMessageEvent>;
    };
```

使用 `@earendil-works/pi-coding-agent` 导出的 `JsonAgentSessionEvent` 类型。其实现位于 [`json-event.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/json-event.ts)。

<a id="example"></a>
## 示例

打印一次性运行中的已完成消息：

```bash
pi --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
```
