---
title: "会话文件格式"
---

# 会话文件格式

会话以 JSONL（JSON Lines）文件存储，每行都是包含 `type` 字段的 JSON 对象。会话条目通过 `id`/`parentId` 字段构成树形结构，因此可以直接创建分支，无需新建文件。

以编程方式创建、持久化和遍历会话树，请参阅 [`SessionManager` API](/sdk/#sessionmanager-api)。


## 文件位置

```
~/.pi/agent/sessions/--<path>--/<timestamp>_<session-id>.jsonl
```

默认情况下，`<session-id>` 是 UUID。调用方可通过 SDK 或 `--session-id` 指定自定义 ID。对于 `<path>`，Pi 会移除开头的路径分隔符，并将 `/`、`\\` 和 `:` 替换为 `-`。

## 删除会话

删除 `~/.pi/agent/sessions/` 下对应的 `.jsonl` 文件即可移除会话。

Pi 也支持在 `/resume` 中交互式删除会话：选中会话后按 `Ctrl+D` 并确认。如果系统中有 `trash` 命令，pi 会优先使用它，避免永久删除。

## 会话版本

会话头中包含版本字段：

- **版本 1**：线性条目序列（旧格式，加载时自动迁移）
- **版本 2**：通过 `id`/`parentId` 关联的树形结构
- **版本 3**：将 `hookMessage` 角色重命名为 `custom`（统一扩展机制）

加载现有会话时，会自动将其迁移到当前版本（v3）。

## 源文件

GitHub 上的源代码（[pi](https://github.com/earendil-works/pi)）：
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts)：会话条目类型和 SessionManager
- [消息类型](/message-types/)：通用消息和内容块参考
- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/messages.ts)：扩展消息类型
- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/ai/src/types.ts)：基础消息和内容块类型
- [`packages/agent/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/agent/src/types.ts)：可扩展的 `AgentMessage` 联合类型

如需查看项目中的 TypeScript 类型定义，请检查 `node_modules/@earendil-works/pi-coding-agent/dist/` 和 `node_modules/@earendil-works/pi-ai/dist/`。

## 消息

`message` 条目存储一个 [`AgentMessage`](/message-types/)。消息内容块、角色、用量和消息时间戳的定义请参阅[消息类型](/message-types/)。

会话条目的时间戳是 ISO 8601 字符串。嵌套消息的时间戳则是以毫秒为单位的 Unix 时间戳。

<a id="entry-base"></a>

## 条目基类

除 `SessionHeader` 外，所有条目都继承自 `SessionEntryBase`：

```typescript
interface SessionEntryBase {
  type: string;
  id: string;           // Usually an 8-char hex ID; may fall back to a full UUID
  parentId: string | null;  // Parent entry ID (null for a root entry)
  timestamp: string;    // ISO timestamp
}
```

<a id="entry-types"></a>

## 条目类型

### SessionHeader

文件的第一行。仅包含元数据，不属于树结构（没有 `id`/`parentId`）。

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path/to/project"}
```

带有父会话的会话（通过 `/fork`、`/clone` 或 `newSession({ parentSession })` 创建）：

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path/to/project","parentSession":"/path/to/original/session.jsonl"}
```

### SessionMessageEntry

对话中的一条消息。`message` 字段包含一个 `AgentMessage`。system 消息保存提示词和工具配置：会话的首次请求会持久化包含所有提示词分段和工具声明的 system 消息；之后的更改则以 system 消息形式保存，按名称更新 `sections`（设为 `null` 表示移除），并列出 `toolsAdded`/`toolsRemoved`。按顺序重放这些消息即可还原当前提示词和工具，不存在单独的提示词状态条目。

```json
{"type":"message","id":"a0b1c2d3","parentId":null,"timestamp":"2024-12-03T14:00:00.000Z","message":{"role":"system","content":"","sections":{"preamble":"You are an expert coding assistant...","tools":"<tools>\n- read: ...\n</tools>","cwd":"/project"},"toolsAdded":[{"name":"read","description":"...","parameters":{}}],"timestamp":1733234400000}}
{"type":"message","id":"d4e5f6g7","parentId":"c3d4e5f6","timestamp":"2024-12-03T14:04:00.000Z","message":{"role":"system","content":"","sections":{"skills":"<skills>...</skills>"},"toolsRemoved":[{"name":"write"}],"timestamp":1733234640000}}
```

在引入 system 消息之前创建的会话没有开头的 system 消息；首次请求会将当前提示词记录为后续 system 消息，重放方式相同。

```json
{"type":"message","id":"a1b2c3d4","parentId":"prev1234","timestamp":"2024-12-03T14:00:01.000Z","message":{"role":"user","content":"Hello","timestamp":1733234401000}}
{"type":"message","id":"b2c3d4e5","parentId":"a1b2c3d4","timestamp":"2024-12-03T14:00:02.000Z","message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}],"api":"anthropic-messages","provider":"anthropic","model":"claude-sonnet-4-5","usage":{...},"stopReason":"stop","timestamp":1733234402000}}
{"type":"message","id":"c3d4e5f6","parentId":"b2c3d4e5","timestamp":"2024-12-03T14:00:03.000Z","message":{"role":"toolResult","toolCallId":"call_123","toolName":"bash","content":[{"type":"text","text":"output"}],"isError":false,"timestamp":1733234403000}}
```

assistant 消息会记录生成它的模型。较新的消息还会记录 `thinkingLevel`，即 Pi 为该响应请求的思考等级。

### ModelChangeEntry

用户在会话中切换模型时会生成此条目。最新条目表示当前选中的模型，可能是[虚拟模型](/virtual-models/)；assistant 消息记录的则是实际响应的物理模型。

```json
{"type":"model_change","id":"d4e5f6g7","parentId":"c3d4e5f6","timestamp":"2024-12-03T14:05:00.000Z","provider":"openai","modelId":"gpt-4o"}
```

### ThinkingLevelChangeEntry

用户更改思考/推理等级时会生成此条目。

```json
{"type":"thinking_level_change","id":"e5f6g7h8","parentId":"d4e5f6g7","timestamp":"2024-12-03T14:06:00.000Z","thinkingLevel":"high"}
```

### UsageEntry

记录归属于模型、但不属于 assistant 消息且不会进入 LLM 上下文的用量。`kind` 是用于标识操作的任意字符串，例如缓存预热使用 `"cache_warm"`。

```json
{"type":"usage","id":"f6g7h8i9","parentId":"e5f6g7h8","timestamp":"2024-12-03T14:08:00.000Z","kind":"cache_warm","provider":"anthropic","model":"claude-sonnet-4-5","usage":{"input":0,"output":0,"cacheRead":50000,"cacheWrite":0,"totalTokens":50000,"cost":{"input":0,"output":0,"cacheRead":0.015,"cacheWrite":0,"total":0.015}}}
```

用量条目会计入会话的 token 和成本总计，但 Pi 不会在对话树中显示它们。读取方应将未知的 `kind` 值视为普通用量，而不是拒绝处理。

### CompactionEntry

上下文压缩时创建。该条目保存较早消息的摘要，以及完整的系统提示词/工具检查点。

```json
{"type":"compaction","id":"f6g7h8i9","parentId":"e5f6g7h8","timestamp":"2024-12-03T14:10:00.000Z","summary":"User discussed X, Y, Z...","firstKeptEntryId":"c3d4e5f6","tokensBefore":50000,"systemMessage":{"role":"system","content":"You are a coding assistant.","toolsAdded":[],"timestamp":1733235000000}}
```

`firstKeptEntryId` 为必填字段，用于标识压缩条目之前保留的第一条记录。重建上下文时，Pi 会用压缩摘要替换更早的摘要范围，并保留从此条目开始的内容。若压缩操作不保留任何先前条目，此字段会记录压缩条目自身的 ID，表示不保留其前面的条目。

可选字段：
- `systemMessage`：压缩边界处重放的提示词分段和工具声明；它会成为压缩后上下文开头的 system 消息，并取代保留条目中的其他 system 消息。旧版会话条目中没有此字段。
- `usage`：生成摘要时的 LLM 用量；计入会话 token 和成本总计。
- `details`：实现专用数据，例如默认实现使用 `{ readFiles: string[], modifiedFiles: string[] }`，扩展可以存储自定义数据。
- `fromHook`：若由扩展生成则为 `true`，若由 pi 生成则为 `false`/`undefined`（旧字段名）。

### ContextEditEntry

以追加方式修改一条较早的上下文条目。它只影响后续的模型上下文；原始历史、界面、导出内容和会话统计中的目标条目及其元数据均保持不变。

```json
{"type":"context_edit","id":"g6h7i8j9","parentId":"f6g7h8i9","timestamp":"2024-12-03T14:11:00.000Z","targetId":"c3d4e5f6","replacement":null}
```

目标可以是 user、assistant、tool-result 或 custom-message 条目。`replacement: null` 会从模型上下文中省略目标条目；非空的 `replacement` 只替换目标消息内容。由于 assistant 和 tool-result 角色要求内容数组，字符串替换会规范化为单个文本块。如果多条编辑针对同一条目，活动分支上最新的编辑生效。编辑与分支相关：导航到编辑之前的位置后，目标条目原有的内容会重新出现。

### BranchSummaryEntry

通过 `/tree` 切换分支时创建，保存由 LLM 生成的摘要，概述旧分支截至共同祖先的内容，并记录被放弃路径中的上下文。

```json
{"type":"branch_summary","id":"g7h8i9j0","parentId":"a1b2c3d4","timestamp":"2024-12-03T14:15:00.000Z","fromId":"f6g7h8i9","summary":"Branch explored approach A..."}
```

`parentId` 是新分支继续的位置；`fromId` 是旧叶节点，其被放弃路径已纳入摘要。

可选字段：
- `usage`：生成摘要时的 LLM 用量；计入会话 token 和成本总计。
- `details`：默认实现使用文件跟踪数据（`{ readFiles: string[], modifiedFiles: string[] }`），扩展也可以存储自定义数据。
- `fromHook`：若由扩展生成则为 `true`，若由 pi 生成则为 `false`/`undefined`（旧字段名）。

### CustomEntry

用于持久化扩展状态，不会进入 LLM 上下文。

```json
{"type":"custom","id":"h8i9j0k1","parentId":"g7h8i9j0","timestamp":"2024-12-03T14:20:00.000Z","customType":"my-extension","data":{"count":42}}
```

可通过 `customType` 在重载时识别扩展自己的条目。交互模式可以使用 `pi.registerEntryRenderer(customType, renderer)` 渲染自定义条目，但它们仍不会进入 LLM 上下文。

Pi 会将[虚拟模型](/virtual-models/)路由器状态保存为自定义条目，其 `customType` 为 `pi.virtual-model-state`，`data` 为 `{ provider, modelId, state }`。

### CustomMessageEntry

由扩展注入、会进入 LLM 上下文的消息。

```json
{"type":"custom_message","id":"i9j0k1l2","parentId":"h8i9j0k1","timestamp":"2024-12-03T14:25:00.000Z","customType":"my-extension","content":"Injected context...","display":true}
```

字段：
- `content`：字符串或 `(TextContent | ImageContent)[]`（与 `UserMessage` 相同）
- `display`：`true` 表示在 TUI 中以不同样式显示；`false` 表示隐藏
- `details`：可选的扩展专用元数据，不会发送给 LLM

### LabelEntry

用户在条目上设置的书签或标记。

```json
{"type":"label","id":"j0k1l2m3","parentId":"i9j0k1l2","timestamp":"2024-12-03T14:30:00.000Z","targetId":"a1b2c3d4","label":"checkpoint-1"}
```

将 `label` 设为 `undefined` 可清除标签。

### SessionInfoEntry

会话元数据（例如用户自定义的显示名称）。可通过 `/name`、`--name`/`-n` 或扩展中的 `pi.setSessionName()` 设置。

```json
{"type":"session_info","id":"k1l2m3n4","parentId":"j0k1l2m3","timestamp":"2024-12-03T14:35:00.000Z","name":"Refactor auth module"}
```

设置会话名称后，会话选择器（`/resume`）会显示该名称，而不是第一条消息。

## 树形结构

条目通常构成一棵树，但导航 API 也可以创建多个根节点：
- 根条目的 `parentId` 为 `null`；第一个条目最初就是根节点。
- 其他条目通过 `parentId` 指向其父条目。
- 创建分支时，会从较早的条目生成新的子条目。
- “叶节点”表示树中的当前位置。
- 调用 `resetLeaf()` 或 `branchWithSummary(null, ...)` 后，后续条目可以成为另一个根节点。

```
[user msg] ─── [assistant] ─── [user msg] ─── [assistant] ─┬─ [user msg] ← current leaf
                                                            │
                                                            └─ [branch_summary] ─── [user msg] ← alternate branch
```

## 构建上下文

`buildContextEntries()` 会从当前叶节点向根节点遍历，在处理压缩条目的同时生成活动条目列表：

1. 收集路径上的所有条目。
2. 如果路径上有一个或多个 `CompactionEntry`，则使用最新的条目：
   - 首先包含压缩条目。
   - 包含从 `firstKeptEntryId` 开始、到压缩条目之前的所有非 system 条目。
   - 包含压缩条目之后的条目。
3. 保留所选范围内的非消息条目，以便交互模式渲染。

随后，`buildSessionProjection()` 会为每个选中目标应用最新的 `context_edit`，并返回模型可见消息及其源条目。被省略的目标不会生成消息；替换后的消息保留源条目的角色和元数据，只改变内容。原始选中条目不会被修改。

`buildSessionContext()` 会基于该投影构建发给 LLM 的消息列表：

1. 从完整路径中提取当前模型和思考等级设置。
2. 将选中的条目转换为消息：
   - `message` → 已存储的 `AgentMessage`
   - `compaction` → 完整 system 检查点，后接 `compactionSummary`
   - `branch_summary` → `branchSummary`
   - `custom_message` → `CustomMessage`
   - `context_edit` → 不会单独生成上下文消息
   - `usage` 和 `custom` → 不生成上下文消息

压缩摘要会替换 `firstKeptEntryId` 之前的条目。压缩前的 system 消息会合并到完整检查点中，而不是从保留范围重放。保留的非 system 条目以及压缩条目之后的所有条目仍会提供给 LLM。

## 解析示例

```typescript
import { readFileSync } from "fs";

const lines = readFileSync("session.jsonl", "utf8").trim().split("\n");

for (const line of lines) {
  const entry = JSON.parse(line);

  switch (entry.type) {
    case "session":
      console.log(`Session v${entry.version ?? 1}: ${entry.id}`);
      break;
    case "message":
      console.log(`[${entry.id}] ${entry.message.role}: ${JSON.stringify(entry.message.content)}`);
      break;
    case "compaction":
      console.log(`[${entry.id}] Compaction: ${entry.tokensBefore} tokens summarized`);
      break;
    case "branch_summary":
      console.log(`[${entry.id}] Branch from ${entry.fromId}`);
      break;
    case "usage":
      console.log(`[${entry.id}] Usage (${entry.kind}): ${entry.usage.totalTokens} tokens`);
      break;
    case "custom":
      console.log(`[${entry.id}] Custom (${entry.customType}): ${JSON.stringify(entry.data)}`);
      break;
    case "custom_message":
      console.log(`[${entry.id}] Extension message (${entry.customType}): ${entry.content}`);
      break;
    case "label":
      console.log(`[${entry.id}] Label "${entry.label}" on ${entry.targetId}`);
      break;
    case "model_change":
      console.log(`[${entry.id}] Model: ${entry.provider}/${entry.modelId}`);
      break;
    case "thinking_level_change":
      console.log(`[${entry.id}] Thinking: ${entry.thinkingLevel}`);
      break;
  }
}
```
