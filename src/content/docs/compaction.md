---
title: "上下文压缩与分支摘要"
---

# 压缩参考

本参考介绍自动压缩、分支摘要、持久化条目和扩展钩子。用户操作流程请参阅[会话与上下文管理](/sessions/#manage-conversation-context)。

**源文件**（[pi](https://github.com/earendil-works/pi)）：
- [`packages/coding-agent/src/core/compaction/compaction.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) - Auto-compaction logic
- [`packages/coding-agent/src/core/compaction/branch-summarization.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) - Branch summarization
- [`packages/coding-agent/src/core/compaction/utils.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/utils.ts) - 共用工具（文件跟踪、序列化）
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts) - Entry types (`CompactionEntry`, `BranchSummaryEntry`)
- [`packages/coding-agent/src/core/extensions/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts) - Extension event types

如需查看项目中的 TypeScript 类型定义，请检查 `node_modules/@earendil-works/pi-coding-agent/dist/`。

## 概述

Pi 有两种摘要机制：

| 机制 | 触发条件 | 用途 |
|-----------|---------|---------|
| 上下文压缩 | 上下文超出阈值，或运行 `/compact` | 总结较早的消息以释放上下文空间 |
| 分支摘要 | 使用 `/tree` 导航 | 切换分支时保留上下文 |

两者使用相近的结构化格式，并累计跟踪文件操作。摘要请求会禁用提示词缓存写入，因为这类一次性提示词通常不会再次使用。

## 上下文压缩

### 触发时机

满足以下条件时会触发自动压缩：

```
contextTokens > contextWindow - reserveTokens
```

默认情况下，`reserveTokens` 为 16384 个 token（可在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置）。它只决定何时开始压缩。摘要请求使用模型的输出上限；必要时会降低该上限，以确保输入和输出都能放入上下文窗口。

在多轮 agent 运行期间，Pi 会在工具执行完毕、结果追加后，以及开始下一条 assistant 响应前，检查规范化的投影上下文。如果超过阈值，Pi 会在 `prepareNextTurn` 期间执行压缩，然后在 `turn_start` 前进行现有的引导消息补偿轮询。如果已完成的工具批次会结束本次运行，且没有排队消息需要再次响应，则会跳过轮次间检查。Pi 也会在新用户提示词开始前检查，并在底层运行结束后执行最后一次溢出恢复。

Provider 返回上下文溢出错误，或提前以 `stopReason: "length"` 结束，都可能触发一次“压缩后重试”的恢复尝试。带有工具调用的长度受限响应会保留合成的失败工具结果，并继续使用常规工具/队列调度器，而不是强制结束运行。

也可以使用 `/compact [instructions]` 手动触发压缩；可选指示用于确定摘要重点。

### 工作原理

1. **确定截断点**：从最终会话投影末尾向前遍历，累计 token 估算值，直到达到 `keepRecentTokens`（默认 20k，可在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置）。
2. **提取消息**：收集从上一个保留边界（或会话起点）到截断点之间的投影消息。
3. **生成摘要**：调用 LLM 按结构化格式生成摘要；如有先前摘要，则将其作为迭代上下文传入。
4. **追加条目**：保存包含摘要和 `firstKeptEntryId` 的 `CompactionEntry`。
5. **重建上下文**：会话使用摘要以及从 `firstKeptEntryId` 开始的消息，重建下一次请求所需的上下文。

```
Before compaction:

  entry:  0     1     2     3      4     5     6      7      8     9
        ┌─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┘
                └────────┬───────┘ └──────────────┬──────────────┘
               messagesToSummarize            kept messages
                                   ↑
                          firstKeptEntryId (entry 4)

After compaction (new entry appended):

  entry:  0     1     2     3      4     5     6      7      8     9     10
        ┌─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│ cmp │
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┴─────┘
               └──────────┬──────┘ └──────────────────────┬───────────────────┘
                 not sent to LLM                    sent to LLM
                                                         ↑
                                              starts from firstKeptEntryId

What the LLM sees:

  ┌────────┬─────────┬─────┬─────┬──────┬──────┬─────┬──────┐
  │ system │ summary │ usr │ ass │ tool │ tool │ ass │ tool │
  └────────┴─────────┴─────┴─────┴──────┴──────┴─────┴──────┘
       ↑         ↑      └─────────────────┬────────────────┘
    prompt   from cmp          messages from firstKeptEntryId
```

重复压缩时，待摘要区段从上一次压缩保留边界（`firstKeptEntryId`）开始，而不是从压缩条目本身开始；如果在路径中找不到该保留条目，则从上一次压缩之后的条目开始。保留零条目的压缩会将自身 ID 记录为 `firstKeptEntryId`；后续压缩从该条目之后开始。这样，先前压缩后保留的消息也会纳入下一轮摘要。Pi 还会在写入新的 `CompactionEntry` 前，根据重建且经过上下文编辑的会话投影重新计算 `tokensBefore`，确保 token 数反映实际被替换的压缩前上下文。被省略的原始条目仍会保存在会话中，但不会影响截断点选择、摘要、检查点或 token 估算。

### 溢出与长度恢复顺序

恢复流程会保留现有生命周期和队列顺序。已完成的尝试仍会对 `turn_end` 和 `agent_end` 可见；运行结束后的恢复会先修复持久化的模型上下文，再开始全新的重试：

```text
persist final assistant response
→ extension/public turn_end
→ extension/public agent_end
→ append context_edit omissions for the selected attempt
→ for overflow/length: run session_before_compact and append compaction on success
→ start the retry as a fresh run
```

如果恢复压缩失败或被取消，Pi 会保留省略编辑，不追加压缩条目，也不安排内部重试。现有排队任务仍遵循常规引导和后续消息规则。恢复处理完成后，`agent_before_settle` 会看到修复后的投影。原始转录历史、导出内容、计费总额和历史搜索扩展仍可检查被省略的尝试。

### 拆分用户消息区段

用户消息区段从一条用户消息开始，包含直到下一条用户消息之前的所有轮次。通常，压缩会在用户消息边界处截断。

如果某个用户消息区段超过 `keepRecentTokens`，截断点会落在该区段内的一条 assistant 消息上，这就是被拆分的用户消息区段：

```
Split user-message span (one span exceeds budget):

  entry:  0     1     2      3     4      5      6     7      8
        ┌─────┬─────┬─────┬──────┬─────┬──────┬──────┬─────┬──────┐
        │ hdr │ usr │ ass │ tool │ ass │ tool │ tool │ ass │ tool │
        └─────┴─────┴─────┴──────┴─────┴──────┴──────┴─────┴──────┘
                ↑                                     ↑
         turnStartIndex = 1                  firstKeptEntryId = 7
                │                                     │
                └──── turnPrefixMessages (1-6) ───────┘
                                                      └── kept (7-8)

  isSplitTurn = true
  messagesToSummarize = []  (no earlier user-message spans)
  turnPrefixMessages = [usr, ass, tool, ass, tool, tool]
```

遇到被拆分的用户消息区段时，Pi 会生成并合并两份摘要：
1. **历史摘要**：先前的上下文（如果存在）。
2. **用户消息区段前缀摘要**：被拆分区段的前半部分。

### 截断点规则

有效的截断点包括：
- 用户消息
- assistant 消息
- BashExecution 消息
- 自定义消息（`custom_message`、`branch_summary`）

不能在工具结果处截断（工具结果必须与对应工具调用保留在一起）。

只有当不可见于上下文的后缀包含被省略的 assistant 尝试，且不包含任何未省略、会生成上下文的条目时，准备过程才会将保留边界向后移入该后缀。恢复操作产生的 `context_edit` 省略符合此规则；它们可以与本身不进入上下文的元数据共存。单独的元数据和新追加的自定义消息不会移动截断点。如果替换编辑影响候选输入或待摘要前缀，也会阻止边界后移，因为被省略的 assistant 回复的是编辑前的输入；最终也会被省略的后缀条目，其替换则不会造成问题。这样既能摘要超出预算的恢复输入，又能保留使已放弃尝试继续被省略的编辑，同时不会因记账操作而改变新模型输入是否原样保留。

### CompactionEntry 结构

Defined in [`session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts):

```typescript
interface CompactionEntry<T = unknown> {
  type: "compaction";
  id: string;
  parentId: string | null;
  timestamp: string;
  summary: string;
  firstKeptEntryId: string;
  tokensBefore: number;
  usage?: Usage;       // LLM usage that generated the summary
  fromHook?: boolean;  // true if provided by extension (legacy field name)
  details?: T;         // implementation-specific data
}

// Default compaction uses this for details (from compaction.ts):
interface CompactionDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

扩展可以在 `details` 中存储任何可序列化为 JSON 的数据。默认压缩会跟踪文件操作，自定义扩展实现则可以使用自己的结构。生成的摘要和扩展提供的摘要在可用时都会保存 LLM `usage`，使会话总计包含摘要生成的开销。

实现细节请参阅 [`prepareCompaction()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) 和 [`compact()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts)。如需直接以编程方式生成摘要，`generateSummary()` 会返回摘要文本，`generateSummaryWithUsage()` 会返回 `{ text, usage }`。

## 分支摘要

### 触发时机

使用 `/tree` 导航到其他分支时，Pi 会询问是否总结即将离开的工作，并将左侧分支的上下文注入新分支。

### 工作原理

1. **查找共同祖先**：旧位置和新位置共享的最深节点。
2. **收集条目**：从旧叶节点回溯到共同祖先。
3. **按预算准备内容**：在 token 预算内纳入消息，优先保留较新的消息。
4. **生成摘要**：调用 LLM 按结构化格式生成摘要。
5. **追加条目**：在导航位置保存 `BranchSummaryEntry`。

```
Tree before navigation:

         ┌─ B ─ C ─ D (old leaf, being abandoned)
    A ───┤
         └─ E ─ F (target)

Common ancestor: A
Entries to summarize: B, C, D

After navigation with summary:

         ┌─ B ─ C ─ D
    A ───┤
         └─ E ─ F ─ [summary of B,C,D] (new leaf)
```

### 累计文件跟踪

默认压缩和分支摘要都会累计跟踪文件。两者都会从待摘要消息中的工具调用提取文件操作。压缩还会继承此前由 Pi 生成的压缩条目中的文件列表；分支摘要则会继承其摘要范围内 Pi 生成的分支摘要所记录的文件列表。

因此，文件跟踪信息会在默认压缩和嵌套的默认分支摘要之间累计。对于 `fromHook` 为 `true` 的扩展生成摘要，Pi 不会自动继承其文件列表；扩展需要自行管理 `details` 格式。

### BranchSummaryEntry 结构

Defined in [`session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts):

```typescript
interface BranchSummaryEntry<T = unknown> {
  type: "branch_summary";
  id: string;
  parentId: string | null;
  timestamp: string;
  summary: string;
  fromId: string;      // Entry we navigated from
  usage?: Usage;       // LLM usage that generated the summary
  fromHook?: boolean;  // true if provided by extension (legacy field name)
  details?: T;         // implementation-specific data
}

// Default branch summarization uses this for details (from branch-summarization.ts):
interface BranchSummaryDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

与压缩条目相同，扩展也可以在 `details` 中存储自定义数据。

实现细节请参阅 [`collectEntriesForBranchSummary()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts)、[`prepareBranchEntries()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) 和 [`generateBranchSummary()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts)。

## 摘要格式

两种格式都包含目标、约束与偏好、进展、关键决策和后续步骤。压缩摘要还包含关键上下文；分支摘要则在后续步骤处结束。必要时，Pi 会在两种格式末尾附加文件列表。

压缩摘要使用以下格式：

```markdown
## Goal
[What the user is trying to accomplish]

## Constraints & Preferences
- [Requirements mentioned by user]

## Progress
### Done
- [x] [Completed tasks]

### In Progress
- [ ] [Current work]

### Blocked
- [Issues, if any]

## Key Decisions
- **[Decision]**: [Rationale]

## Next Steps
1. [What should happen next]

## Critical Context
- [Data needed to continue]

<read-files>
path/to/file1.ts
path/to/file2.ts
</read-files>

<modified-files>
path/to/changed.ts
</modified-files>
```

### 消息序列化

生成摘要前，消息会通过 [`serializeConversation()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/utils.ts) 序列化为文本：

```
[User]: What they said
[Assistant]: Response text
[Assistant tool calls]: read(path="foo.ts"); edit(path="bar.ts", ...)
[Tool result]: Output from tool
```

这样可以避免模型将其误认为需要继续的对话。

思考块会被省略。Provider 返回的是真实推理的摘要，而重放的思考内容通常不属于模型当前上下文；将其纳入可能导致摘要请求比被摘要的上下文还大。

序列化时，工具结果会截断至 2000 个字符。超出部分会替换为标记，并注明截断的字符数。这样可以将摘要请求控制在合理的 token 预算内，因为工具结果（尤其是 `read` 和 `bash` 的结果）通常是上下文中占用空间最大的部分。

## 通过扩展自定义摘要

扩展可以拦截并自定义上下文压缩和分支摘要。事件类型定义请参阅 [`extensions/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts)。

### session_before_compact

自动压缩或执行 `/compact` 前触发。可取消操作或提供自定义摘要。类型定义请参阅 `SessionBeforeCompactEvent` 和 `CompactionPreparation`。

```typescript
pi.on("session_before_compact", async (event, ctx) => {
  const { preparation, branchEntries, customInstructions, reason, willRetry, signal } = event;

  // preparation.messagesToSummarize - messages to summarize
  // preparation.turnPrefixMessages - user-message-span prefix (if isSplitTurn)
  // preparation.previousSummary - previous compaction summary
  // preparation.fileOps - extracted file operations
  // preparation.tokensBefore - context tokens before compaction
  // preparation.firstKeptEntryId - where kept messages start
  // preparation.settings - effective settings after applying model overrides

  // branchEntries - all entries on current branch (for custom state)
  // reason - "manual" (/compact), "threshold", or "overflow"
  // willRetry - whether the aborted turn is retried after compaction (overflow recovery)
  // signal - AbortSignal (pass to LLM calls)

  // Cancel:
  return { cancel: true };

  // Custom summary:
  return {
    compaction: {
      summary: "Your summary...",
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      // usage: summaryResponse.usage, // Optional; included in session totals
      details: { /* custom data */ },
    }
  };
});
```

#### 将消息转换为文本

若要使用自己的模型生成摘要，可使用 `serializeConversation` 将消息转换为文本：

```typescript
import { convertToLlm, serializeConversation } from "@earendil-works/pi-coding-agent";

pi.on("session_before_compact", async (event, ctx) => {
  const { preparation } = event;
  
  // Convert AgentMessage[] to Message[], then serialize to text
  const conversationText = serializeConversation(
    convertToLlm(preparation.messagesToSummarize)
  );
  // Returns:
  // [User]: message text
  // [Assistant]: response text
  // [Assistant tool calls]: read(path="..."); bash(command="...")
  // [Tool result]: output text

  // Now send to your model for summarization
  const { summary, usage } = await myModel.summarize(conversationText);
  
  return {
    compaction: {
      summary,
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      usage,
    }
  };
});
```

使用其他模型的完整示例请参阅 [custom-compaction.ts](../examples/extensions/custom-compaction.ts)。

### session_compact_failed

手动或自动压缩失败或中止时触发。需要将 `session_before_compact` 尝试与最终结果关联的遥测扩展可以使用此事件。

```typescript
pi.on("session_compact_failed", async (event, ctx) => {
  const { reason, errorMessage, aborted, willRetry, fromExtension } = event;
  // reason - "manual" (/compact), "threshold", or "overflow"
  // errorMessage - present for non-abort failures
  // aborted - true for canceled/aborted compactions
  // willRetry - whether the aborted turn would have retried after compaction
  // fromExtension - whether extension-provided compaction content was being used
});
```

### session_before_tree

执行 `/tree` 导航前触发，无论用户是否选择生成摘要都会触发。可取消导航或提供自定义摘要。

```typescript
pi.on("session_before_tree", async (event, ctx) => {
  const { preparation, signal } = event;

  // preparation.targetId - where we're navigating to
  // preparation.oldLeafId - current position (being abandoned)
  // preparation.commonAncestorId - shared ancestor
  // preparation.entriesToSummarize - entries that would be summarized
  // preparation.userWantsSummary - whether user chose to summarize

  // Cancel navigation entirely:
  return { cancel: true };

  // Provide custom summary (only used if userWantsSummary is true):
  if (preparation.userWantsSummary) {
    return {
      summary: {
        summary: "Your summary...",
        // usage: summaryResponse.usage, // Optional; included in session totals
        details: { /* custom data */ },
      }
    };
  }
});
```

类型定义请参阅 `SessionBeforeTreeEvent` 和 `TreePreparation`。

## 设置

在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置压缩：

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

| 设置项 | 默认值 | 说明 |
|---------|---------|-------------|
| `enabled` | `true` | 启用自动压缩 |
| `reserveTokens` | `16384` | 自动压缩开始前预留的上下文 token 数 |
| `keepRecentTokens` | `20000` | 保留的近期 token 数（不纳入摘要） |

将 `"enabled": false` 可禁用自动压缩；仍可使用 `/compact` 手动压缩。

### 按模型覆盖

使用 `compaction.modelOverrides` 为不同模型调整 token 预算：

```json
{
  "compaction": {
    "reserveTokens": 16384,
    "keepRecentTokens": 20000,
    "modelOverrides": {
      "some-provider/big-model": {
        "reserveTokens": 400000
      }
    }
  }
}
```

对于上下文窗口为 1M token 的模型，此覆盖设置会在超过 600K token 时触发压缩，并保留常规的 20000 个近期 token。其他模型仍使用常规的 16384 token 预留值。

键必须是精确且区分大小写的 `provider/modelId` 值，模型 ID 中的斜杠也必须保留。`reserveTokens` 和 `keepRecentTokens` 会分别按“模型覆盖值→常规设置→内置默认值”的顺序回退。取值必须是非负安全整数。匹配到的模型覆盖项若包含无效值，读取时会报错；只有省略的字段才会回退到常规设置。模型覆盖项必须是对象。即使当前模型有有效覆盖值，常规 token 设置无效时，读取仍会报错。只有省略的常规设置才使用内置默认值。`enabled` 仍是全局设置，不支持按模型单独配置。

这些解析后的值用于手动压缩、所有自动阈值检查、溢出恢复，以及扩展可见的 `preparation.settings`。切换模型会影响后续检查和压缩，但不会更改常规设置。已经开始的压缩会继续使用该操作启动时捕获的模型和设置。分支摘要设置不受影响。

全局和项目设置都支持覆盖值。查找前会递归合并设置文件，因此全局的模型专属值优先于项目级通用值；项目必须覆盖该模型条目才能更改它。详情请参阅[设置](/settings/#per-model-compaction-overrides)。
