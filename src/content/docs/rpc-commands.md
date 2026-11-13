---
title: "RPC 命令"
---

# RPC 命令

本参考列出 [RPC 模式](/rpc/)在标准输入中接受的命令。每条命令和响应都是一个 JSON 对象。共用消息值请参阅[消息类型](/message-types/)。

## 发送提示词

### prompt

向 agent 发送用户提示词。提示词被接受、排队或处理后，命令会返回响应。提示词被接受后，事件仍会异步持续发送。

```json
{"id": "req-1", "type": "prompt", "message": "Hello, world!"}
```

With images:
```json
{"type": "prompt", "message": "What's in this image?", "images": [{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}]}
```

**流式生成期间**：如果 agent 已在流式生成，必须指定 `streamingBehavior` 才能将消息排队：

```json
{"type": "prompt", "message": "New instruction", "streamingBehavior": "steer"}
```

- `"steer"`：agent 运行期间将消息排队。当前 assistant 轮次完成工具调用后、下一次 LLM 调用前发送该消息。
- `"followUp"`：等待 agent 完成；只有 agent 停止后才会发送该消息。

如果 agent 正在流式生成但未指定 `streamingBehavior`，命令会返回错误。

**扩展命令**：如果消息是扩展命令（例如 `/mycommand`），即使处于流式生成期间也会立即执行。扩展命令通过 `pi.sendMessage()` 管理自己的 LLM 交互。

**输入展开**：Skill 命令（`/skill:name`）和提示模板（`/template`）会在发送或排队前展开。

Response:
```json
{"id": "req-1", "type": "response", "command": "prompt", "success": true, "data": {"disposition": "started"}}
```

如果扩展命令或输入处理器已处理提示词，`data.disposition` 为 `"handled"`；如果 Pi 在运行期间将其排队，则为 `"queued"`；如果 Pi 接受提示词并启动运行，则为 `"started"`。该字段描述的是提交的提示词，不代表扩展启动的独立任务，也不保证任务已完成。

`success: true` 表示提示词已被接受、排队或立即处理；`success: false` 表示提示词在接受前被拒绝。接受后发生的故障会通过常规事件和消息流报告，不会针对同一请求 ID 再发送第二个 `response`。

`images` 字段为可选。每张图像都使用 `ImageContent` 格式：`{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}`。

### steer

agent 运行期间将引导消息排队。当前 assistant 轮次完成工具调用后、下一次 LLM 调用前发送该消息。Skill 命令和提示模板会展开；不允许使用扩展命令（请改用 `prompt`）。

```json
{"type": "steer", "message": "Stop and do this instead"}
```

附带图像时：
```json
{"type": "steer", "message": "Look at this instead", "images": [{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}]}
```

`images` 字段为可选。每张图像均使用 `ImageContent` 格式（与 `prompt` 相同）。

Response:
```json
{"type": "response", "command": "steer", "success": true, "data": {"disposition": "queued"}}
```

如果输入处理器已处理此引导消息，`data.disposition` 为 `"handled"`；如果 Pi 将其排队（包括处理器转换后再排队），则为 `"queued"`。该值不保证消息仍处于队列中。

如何控制引导消息的处理方式，请参阅 [set_steering_mode](#set_steering_mode)。

### follow_up

将后续消息加入队列，待 agent 完成后处理。只有 agent 不再有工具调用或引导消息时才会发送。Skill 命令和提示模板会展开；不允许使用扩展命令（请改用 `prompt`）。

```json
{"type": "follow_up", "message": "After you're done, also do this"}
```

附带图像时：
```json
{"type": "follow_up", "message": "Also check this image", "images": [{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}]}
```

`images` 字段为可选。每张图像均使用 `ImageContent` 格式（与 `prompt` 相同）。

Response:
```json
{"type": "response", "command": "follow_up", "success": true, "data": {"disposition": "queued"}}
```

`data.disposition` 的 `"handled"` 或 `"queued"` 含义与 `steer` 相同，但应用于此后续消息。

如何控制后续消息的处理方式，请参阅 [set_follow_up_mode](#set_follow_up_mode)。

### abort

中止当前操作，并等待会话进入空闲状态后再返回响应。

```json
{"type": "abort"}
```

Response:
```json
{"type": "response", "command": "abort", "success": true}
```

### clear_queue

移除排队中的引导消息和后续消息，并返回它们的文本。

```json
{"type": "clear_queue"}
```

Response:
```json
{
  "type": "response",
  "command": "clear_queue",
  "success": true,
  "data": {
    "steering": ["Change direction"],
    "followUp": ["Summarize when finished"]
  }
}
```

实现交互式 Esc 行为时，应先发送 `clear_queue`，再发送 `abort`，然后将返回的文本恢复到客户端编辑器中。如果队列消息仍保留在会话中，`abort` 会继续处理它们。

### new_session

启动新会话。扩展事件处理器 `session_before_switch` 可以取消此操作。

```json
{"type": "new_session"}
```

可选地指定父会话以跟踪会话来源：
```json
{"type": "new_session", "parentSession": "/path/to/parent-session.jsonl"}
```

Response:
```json
{"type": "response", "command": "new_session", "success": true, "data": {"cancelled": false}}
```

如果扩展取消了操作：
```json
{"type": "response", "command": "new_session", "success": true, "data": {"cancelled": true}}
```

## 状态

### get_state

获取当前会话状态。

```json
{"type": "get_state"}
```

Response:
```json
{
  "type": "response",
  "command": "get_state",
  "success": true,
  "data": {
    "model": {...},
    "thinkingLevel": "medium",
    "isStreaming": false,
    "isCompacting": false,
    "steeringMode": "all",
    "followUpMode": "one-at-a-time",
    "sessionFile": "/path/to/session.jsonl",
    "sessionId": "abc123",
    "sessionName": "my-feature-work",
    "autoCompactionEnabled": true,
    "messageCount": 5,
    "pendingMessageCount": 0
  }
}
```

`model` 字段是完整的 [Model](#model-object) 对象；未选择模型时会省略。`sessionName` 字段是通过 `set_session_name` 设置的显示名称；未设置时会省略。

### get_messages

获取对话中的所有消息。

```json
{"type": "get_messages"}
```

Response:
```json
{
  "type": "response",
  "command": "get_messages",
  "success": true,
  "data": {"messages": [...]}
}
```

消息均为 `AgentMessage` 对象（参见[消息类型](/message-types/)）。

## 模型

### set_model

切换到指定模型。

```json
{"type": "set_model", "provider": "anthropic", "modelId": "claude-sonnet-4-20250514"}
```

响应包含完整的 [Model](#model-object) 对象：
```json
{
  "type": "response",
  "command": "set_model",
  "success": true,
  "data": {...}
}
```

### cycle_model

切换到下一个可用模型。只有一个可用模型时，`data` 返回 `null`。

```json
{"type": "cycle_model"}
```

Response:
```json
{
  "type": "response",
  "command": "cycle_model",
  "success": true,
  "data": {
    "model": {...},
    "thinkingLevel": "medium",
    "isScoped": false
  }
}
```

`model` 字段是完整的 [Model](#model-object) 对象。

### get_available_models

列出所有已配置的模型。

```json
{"type": "get_available_models"}
```

响应包含完整的 [Model](#model-object) 对象数组：
```json
{
  "type": "response",
  "command": "get_available_models",
  "success": true,
  "data": {
    "models": [...]
  }
}
```

## 思考等级

### set_thinking_level

为支持思考等级的模型设置推理/思考级别。

```json
{"type": "set_thinking_level", "level": "high"}
```

可选级别：`"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"`、`"max"`

只有所选模型支持时才会提供 `"xhigh"` 和 `"max"`。部分模型（包括 GPT-5.6）同时支持这两个级别。

Response:
```json
{"type": "response", "command": "set_thinking_level", "success": true}
```

### cycle_thinking_level

轮换到下一个可用的思考等级。如果模型不支持思考功能，则返回 `null` 数据。

```json
{"type": "cycle_thinking_level"}
```

Response:
```json
{
  "type": "response",
  "command": "cycle_thinking_level",
  "success": true,
  "data": {"level": "high"}
}
```

### get_available_thinking_levels

列出当前模型支持的思考等级。不支持推理的模型会返回 `["off"]`。

```json
{"type": "get_available_thinking_levels"}
```

Response:
```json
{
  "type": "response",
  "command": "get_available_thinking_levels",
  "success": true,
  "data": {
    "levels": ["off", "minimal", "low", "medium", "high"]
  }
}
```

## 队列模式

### set_steering_mode

控制引导消息（来自 `steer`）的发送方式。

```json
{"type": "set_steering_mode", "mode": "one-at-a-time"}
```

模式：
- `"all"`：当前 assistant 轮次完成工具调用后，发送所有引导消息。
- `"one-at-a-time"`：每个 assistant 轮次完成后发送一条引导消息（默认）。

Response:
```json
{"type": "response", "command": "set_steering_mode", "success": true}
```

### set_follow_up_mode

控制后续消息（来自 `follow_up`）的发送方式。

```json
{"type": "set_follow_up_mode", "mode": "one-at-a-time"}
```

模式：
- `"all"`：agent 完成后发送所有后续消息。
- `"one-at-a-time"`：每次 agent 完成后发送一条后续消息（默认）。

Response:
```json
{"type": "response", "command": "set_follow_up_mode", "success": true}
```

## 上下文压缩

### compact

手动压缩对话上下文以减少 token 用量。

```json
{"type": "compact"}
```

附带自定义指示：
```json
{"type": "compact", "customInstructions": "Focus on code changes"}
```

Response:
```json
{
  "type": "response",
  "command": "compact",
  "success": true,
  "data": {
    "summary": "Summary of conversation...",
    "firstKeptEntryId": "abc123",
    "tokensBefore": 150000,
    "estimatedTokensAfter": 32000,
    "usage": {
      "input": 32000,
      "output": 1200,
      "cacheRead": 0,
      "cacheWrite": 0,
      "totalTokens": 33200,
      "cost": {"input": 0.01, "output": 0.02, "cacheRead": 0, "cacheWrite": 0, "total": 0.03}
    },
    "details": {}
  }
}
```

`estimatedTokensAfter` 是压缩后立即根据重建消息上下文计算的启发式估值，并非 Provider 精确统计的 token 数。`usage` 报告生成摘要所用的一次或多次 LLM 调用；自定义压缩处理器可以省略该字段。

### set_auto_compaction

在上下文接近上限时启用或禁用自动压缩。

```json
{"type": "set_auto_compaction", "enabled": true}
```

Response:
```json
{"type": "response", "command": "set_auto_compaction", "success": true}
```

## 重试

### set_auto_retry

在临时错误（过载、速率限制、5xx）发生时启用或禁用自动重试。

```json
{"type": "set_auto_retry", "enabled": true}
```

Response:
```json
{"type": "response", "command": "set_auto_retry", "success": true}
```

### abort_retry

中止正在进行的重试（取消等待并停止重试）。

```json
{"type": "abort_retry"}
```

Response:
```json
{"type": "response", "command": "abort_retry", "success": true}
```

## Bash 命令

### bash

执行 Shell 命令并将输出加入对话上下文。命令运行期间，输出会以 `bash_execution_update` 事件流式发送；响应中包含最终结果。

```json
{"id": "req-1", "type": "bash", "command": "ls -la"}
```

如果命令输出需要保存在会话中、但不应加入下一条提示词的模型上下文，请将 `excludeFromContext` 设为 `true`。

提供 `id` 可将流式发送的 `bash_execution_update` 事件关联到此命令。

Response:
```json
{
  "id": "req-1",
  "type": "response",
  "command": "bash",
  "success": true,
  "data": {
    "output": "total 48\ndrwxr-xr-x ...",
    "exitCode": 0,
    "cancelled": false,
    "truncated": false
  }
}
```

如果输出被截断，响应还会包含 `fullOutputPath`：
```json
{
  "type": "response",
  "command": "bash",
  "success": true,
  "data": {
    "output": "truncated output...",
    "exitCode": 0,
    "cancelled": false,
    "truncated": true,
    "fullOutputPath": "/tmp/pi-bash-abc123.log"
  }
}
```

**bash 结果如何传递给 LLM：**

`bash` 命令会立即执行并返回 `BashResult`。内部会创建 `BashExecutionMessage`，并将其存入 agent 的消息状态。

发送下一条 `prompt` 命令时，Pi 会先转换上下文消息，再将其发送给模型。除非 `excludeFromContext` 为 `true`，否则 `BashExecutionMessage` 会转换为以下格式的 `UserMessage`：

````
Ran `ls -la`
```
total 48
drwxr-xr-x ...
```
````

这意味着：
1. 纳入上下文的 bash 输出会在**下一条提示词**中传给模型，而不是立即传递。
2. 一条提示词之前可以运行多个 bash 命令；Pi 会纳入每条未设置 `excludeFromContext` 的命令输出。

### abort_bash

中止正在运行的 bash 命令。

```json
{"type": "abort_bash"}
```

Response:
```json
{"type": "response", "command": "abort_bash", "success": true}
```

## 会话

### get_session_stats

获取 token 用量、成本统计和当前上下文窗口使用情况。

```json
{"type": "get_session_stats"}
```

Response:
```json
{
  "type": "response",
  "command": "get_session_stats",
  "success": true,
  "data": {
    "sessionFile": "/path/to/session.jsonl",
    "sessionId": "abc123",
    "userMessages": 5,
    "assistantMessages": 5,
    "toolCalls": 12,
    "toolResults": 12,
    "totalMessages": 22,
    "tokens": {
      "input": 50000,
      "output": 10000,
      "cacheRead": 40000,
      "cacheWrite": 5000,
      "total": 105000
    },
    "cost": 0.45,
    "contextUsage": {
      "tokens": 60000,
      "contextWindow": 200000,
      "percent": 30
    }
  }
}
```

整个会话中的 assistant 消息、工具报告的用量以及上下文压缩/分支摘要生成都会计入 `tokens` 和 `cost`。`contextUsage` 包含当前上下文窗口的实际估算值，供压缩逻辑和页脚显示使用。

没有可用模型或上下文窗口时，会省略 `contextUsage`。压缩完成后，在新的 assistant 响应提供有效用量数据之前，`contextUsage.tokens` 和 `contextUsage.percent` 为 `null`。

### export_html

将会话导出为 HTML 文件。

```json
{"type": "export_html"}
```

指定自定义路径：
```json
{"type": "export_html", "outputPath": "/tmp/session.html"}
```

Response:
```json
{
  "type": "response",
  "command": "export_html",
  "success": true,
  "data": {"path": "/tmp/session.html"}
}
```

### switch_session

加载另一个会话文件。扩展事件处理器 `session_before_switch` 可以取消此操作。

```json
{"type": "switch_session", "sessionPath": "/path/to/session.jsonl"}
```

Response:
```json
{"type": "response", "command": "switch_session", "success": true, "data": {"cancelled": false}}
```

如果扩展取消了切换：
```json
{"type": "response", "command": "switch_session", "success": true, "data": {"cancelled": true}}
```

### fork

从活动分支中较早的一条用户消息创建新分支。扩展事件处理器 `session_before_fork` 可以取消此操作。响应会返回作为分叉起点的消息文本。

```json
{"type": "fork", "entryId": "abc123"}
```

Response:
```json
{
  "type": "response",
  "command": "fork",
  "success": true,
  "data": {"text": "The original prompt text...", "cancelled": false}
}
```

如果扩展取消了分叉：
```json
{
  "type": "response",
  "command": "fork",
  "success": true,
  "data": {"cancelled": true}
}
```

### clone

在当前位置将当前活动分支复制到新会话。扩展事件处理器 `session_before_fork` 可以取消此操作。

```json
{"type": "clone"}
```

Response:
```json
{
  "type": "response",
  "command": "clone",
  "success": true,
  "data": {"cancelled": false}
}
```

如果扩展取消了克隆：
```json
{
  "type": "response",
  "command": "clone",
  "success": true,
  "data": {"cancelled": true}
}
```

### get_fork_messages

获取可用作分叉起点的用户消息。

```json
{"type": "get_fork_messages"}
```

Response:
```json
{
  "type": "response",
  "command": "get_fork_messages",
  "success": true,
  "data": {
    "messages": [
      {"entryId": "abc123", "text": "First prompt..."},
      {"entryId": "def456", "text": "Second prompt..."}
    ]
  }
}
```

### get_entries

按追加顺序获取所有会话条目（不包括会话头）。会话是由稳定 ID 标识、只追加不修改的条目树，因此条目 ID 可作为持久游标：将最后看到的条目 ID 作为 `since`，即可只获取其之后的条目，即使客户端重启也适用。与 `get_messages` 不同，此命令还会返回压缩前的历史记录和已放弃的分支。

```json
{"type": "get_entries"}
```

With a cursor:
```json
{"type": "get_entries", "since": "abc123"}
```

Response:
```json
{
  "type": "response",
  "command": "get_entries",
  "success": true,
  "data": {
    "entries": [
      {"type": "message", "id": "def456", "parentId": "abc123", "timestamp": "...", "message": {"role": "user", "...": "..."}}
    ],
    "leafId": "def456"
  }
}
```

`leafId` 是当前叶条目的 ID（空会话时为 `null`），客户端可通过一次请求判断活动分支是否发生变化。如果 `since` 与任何条目 ID 都不匹配，响应中的 `success` 为 `false`。

### get_tree

以条目树形式获取会话。每个节点为 `{entry, children, label?, labelTimestamp?}`。由于导航 API 可以创建多个根节点，结果是一个数组；父级链断裂的孤立条目也会作为根节点返回。

```json
{"type": "get_tree"}
```

Response:
```json
{
  "type": "response",
  "command": "get_tree",
  "success": true,
  "data": {
    "tree": [
      {
        "entry": {"type": "message", "id": "abc123", "parentId": null, "...": "..."},
        "children": [
          {"entry": {"type": "message", "id": "def456", "parentId": "abc123", "...": "..."}, "children": []}
        ]
      }
    ],
    "leafId": "def456"
  }
}
```

### get_last_assistant_text

获取最后一条 assistant 消息的文本内容。

```json
{"type": "get_last_assistant_text"}
```

Response:
```json
{
  "type": "response",
  "command": "get_last_assistant_text",
  "success": true,
  "data": {"text": "The assistant's response..."}
}
```

如果没有 assistant 文本，`text` 值为 `null`。

### set_session_name

为当前会话设置显示名称。该名称会出现在会话列表中，便于识别会话。

```json
{"type": "set_session_name", "name": "my-feature-work"}
```

Response:
```json
{
  "type": "response",
  "command": "set_session_name",
  "success": true
}
```

可以通过 `get_state` 的 `sessionName` 字段获取当前会话名称。启动 RPC 模式时，如需设置初始名称，请向 `pi --mode rpc` 进程传入 `--name <name>` 或 `-n <name>`。

## 可发现的命令

### get_commands

获取可用命令（扩展命令、提示模板和 Skills）。通过 `prompt` 命令运行时，在名称前加上 `/`。

```json
{"type": "get_commands"}
```

Response:
```json
{
  "type": "response",
  "command": "get_commands",
  "success": true,
  "data": {
    "commands": [
      {
        "name": "fix-tests",
        "description": "Fix failing tests",
        "source": "prompt",
        "sourceInfo": {
          "path": "/home/user/myproject/.pi/agent/prompts/fix-tests.md",
          "source": "local",
          "scope": "project",
          "origin": "top-level"
        }
      }
    ]
  }
}
```

每条命令包含：
- `name`：命令名称（使用 `/name` 调用）。
- `description`：供人阅读的说明（扩展命令可选）。
- `source`：命令类型：
  - `"extension"`：通过扩展中的 `pi.registerCommand()` 注册。
  - `"prompt"`：从提示模板 `.md` 文件加载。
  - `"skill"`：从 Skill 目录加载（名称带有 `skill:` 前缀）。
- `sourceInfo`：注册此命令的资源元数据：
  - `path`：资源的绝对路径。
  - `source`：Pi 发现资源的方式，例如 `"local"`、`"auto"` 或 `"cli"`。
  - `scope`：`"user"`、`"project"` 或 `"temporary"`。
  - `origin`：直接加载的资源为 `"top-level"`，软件包资源为 `"package"`。
  - `baseDir`：适用时为软件包根目录。

**注意**：内置 TUI 命令（`/settings`、`/hotkeys` 等）不会包含在结果中。它们只在交互模式下处理，通过 `prompt` 发送不会执行。

<a id="model-object"></a>

## Model 对象

模型相关命令会返回完整的模型配置定义。成本单位为每百万 token 的美元价格。

```json
{
  "id": "claude-sonnet-4-20250514",
  "name": "Claude Sonnet 4",
  "api": "anthropic-messages",
  "provider": "anthropic",
  "baseUrl": "https://api.anthropic.com",
  "reasoning": true,
  "input": ["text", "image"],
  "contextWindow": 200000,
  "maxTokens": 16384,
  "cost": {
    "input": 3.0,
    "output": 15.0,
    "cacheRead": 0.3,
    "cacheWrite": 3.75
  }
}
```

模型配置请参阅[配置兼容端点](/models/#configure-a-compatible-endpoint)。TypeScript 项目请使用 `@earendil-works/pi-ai` 导出的 `Model` 类型。
