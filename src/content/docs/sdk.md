---
title: "使用 SDK"
---

# SDK

`@earendil-works/pi-coding-agent` 可将 Pi 嵌入 Node.js 或 Bun 进程中，让 TypeScript 直接访问命令行应用使用的 agent、会话、工具、模型和资源。

需要在同一进程中集成 TypeScript 时，请使用 SDK。若需与语言无关的接口或隔离子进程，请参阅 [CLI 集成](/cli-integration/)。

```typescript
import { createAgentSession } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession();

try {
  await session.prompt("What files are in the current directory?");
  console.log(session.getLastAssistantText());
} finally {
  session.dispose();
}
```

此示例使用当前工作目录、发现的资源、已保存的设置和已配置的凭据。运行结束后，`prompt()` 才会完成。

[完整的最小示例](../examples/sdk/01-minimal.ts)还会流式处理文本事件。所有 [SDK 示例](../examples/sdk/)都会随仓库一起进行类型检查。

<a id="session-management"></a>

## 会话生命周期

`createAgentSession()` 会创建一个 `AgentSession`。会话管理单个对话及其模型、工具、排队消息、压缩状态和扩展运行时。

可通过 `session.messages`、`session.model`、`session.thinkingLevel`、`session.systemPrompt` 和 `session.getActiveToolNames()` 读取当前状态。

`session.systemPrompt` 是只读属性，返回当前生效的 system 提示词，包括尚未发送给模型的更改。工具变更会在下一次请求前告知模型。

<a id="sessionmanager-api"></a>

### 会话存储

会话默认持久化。`SessionManager` 管理持久化或内存中的条目树，并跟踪当前活动叶节点。创建分支会切换该叶节点，但不会删除已放弃的分支。Pi 重建模型上下文时，管理器会选取活动分支并应用压缩。

最终模型上下文以 `SessionManager` 为准。若要恢复外部历史记录，请使用包含这些条目的管理器构建会话。给 `session.agent.state.messages` 赋值不会替换已持久化的上下文。

如果宿主程序不需要会话文件，可使用内存管理器：

```typescript
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});
```

创建、打开、继续、列出和分叉会话的经过验证示例请参阅 [sessions 示例](../examples/sdk/11-sessions.ts)。持久化 JSONL 格式见[会话文件格式](/session-format/)，转录数据类型见[消息类型](/message-types/)。具体方法和签名请查阅导出的 TypeScript 声明或 [`session-manager.ts`](../src/core/session-manager.ts)。

`cwd` 指定用于发现项目资源、加载上下文文件、归组会话以及解析内置工具路径的工作区。如果目标目录与 `process.cwd()` 不同，请显式传入。

`session.dispose()` 会中止正在进行的任务、使扩展上下文失效、断开与 agent 的连接并移除事件监听器。会话不再需要时应调用此方法。

`AgentSessionRuntime` 提供 `newSession()`、`switchSession()`、`fork()` 和 `importFromJsonl()`。每项操作都会替换活动的 `AgentSession`，并为目标工作目录重新创建服务。

运行时替换会话后，订阅仍属于旧的 `AgentSession`，必须重新绑定。示例请参阅[会话运行时示例](../examples/sdk/13-session-runtime.ts)。

## 发送提示词

普通用户消息进入 agent 前，`prompt()` 会处理扩展命令并展开文件提示模板。对于已接受的 agent 运行，该方法会在运行结束（包括自动重试）后完成。

会话正在流式运行时发送提示词，必须明确选择引导当前运行还是作为后续消息处理。未指定时，`prompt()` 会直接拒绝，而不会擅自推断。

引导消息会在当前 assistant 轮次及其工具调用完成后发送；后续消息则会在当前运行的待处理任务全部结束后发送。`steer()` 和 `followUp()` 可直接执行这两种操作：输入被排队（包括经扩展转换后排队）时返回 `"queued"`，被扩展处理时返回 `"handled"`。

`abort()` 会停止当前操作并等待会话空闲；`waitForIdle()` 只等待会话空闲，不会中止操作。

## 订阅事件

宿主程序需要接收流式输出时，应在发送提示词前订阅事件：

```typescript
const unsubscribe = session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

try {
  await session.prompt("Explain this repository");
} finally {
  unsubscribe();
}
```

会话事件会报告消息更新、工具执行、队列、压缩、重试和运行生命周期变化。

`message_end` 包含最终完成的消息。`agent_end` 表示一次底层 agent 运行结束，但之后仍可能发生自动恢复或处理排队任务。

宿主程序需要确认 Pi 不会自动继续时，应等待 `agent_settled`。

## 配置会话

未提供覆盖项时，工厂会创建 `ModelRuntime`、基于文件的 `SettingsManager`、持久化 `SessionManager`、`DefaultResourceLoader` 以及已配置的默认工具。

以下各项都可以显式指定：

- `modelRuntime`、`model`、`thinkingLevel` 和 `scopedModels`：控制模型访问和选择。
- `settingsManager`：提供合并后的设置或内存配置。
- `sessionManager`：提供持久化或内存中的对话历史。
- `resourceLoader`：提供扩展、Skills、提示模板、主题和上下文文件。
- `tools`、`noTools`、`excludeTools` 和 `customTools`：控制活动工具集。

需要标准资源发现并覆盖部分配置时，请使用 `DefaultResourceLoader`。如果宿主程序完全负责资源存储和发现，则应提供自定义 `ResourceLoader`。

<a id="inlineextension"></a>

可以通过 `DefaultResourceLoader` 提供内联扩展工厂。只有当扩展需要在诊断信息和启动输出中使用稳定名称时，才为其指定 `InlineExtension` 名称。命名内联扩展设置 `replaceable: true` 后，如果其他扩展在加载时注册了同名工具、命令或标志，该内联扩展就会被跳过，避免同时加载导致冲突。CLI 内置的 codemode、工具搜索和 MCP 扩展均可替换。带有 `builtin: true` 的命名条目并非内联扩展：它提供 `builtin:<name>` 扩展的代码，并像已配置的扩展文件一样加载。此类扩展默认加载，会列在 `pi config` 中；可通过 `extensions` 设置中的 `-builtin:<name>` 或 `noExtensions` 禁用，也可通过 `additionalExtensionPaths: ["builtin:<name>"]` 显式加载。它会在项目可信状态确定后加载，因此无法处理 `project_trust`。CLI 的内置扩展使用此机制。

<a id="codemode-mcp"></a>

CLI 会将 `codemode`、`tool_search` 和 MCP 作为内置扩展加载，SDK 会话则不会。请将 `createCodemodeExtension()`、`createToolSearchExtension()` 和 `createMcpExtension()` 添加到 `DefaultResourceLoader` 的 `extensionFactories` 中。`codemode` 和 `tool_search` 注册后默认处于未启用状态：可通过 `defaultTools` 设置启用（`["+codemode", "+tool_search"]` 会保留其他默认工具），也可由 MCP 扩展按需启用：对 `codemode` 暴露的服务器启用 `codemode`，对 `deferred` 暴露的服务器启用 `tool_search`。MCP 扩展会在 `session_start` 时连接服务器，因此请调用 `session.bindExtensions()`。参见 [Codemode 与 MCP](../examples/sdk/14-codemode-mcp.ts)。

针对模型、工具、扩展和完整控制的示例分别见[模型](../examples/sdk/02-custom-model.ts)、[工具](../examples/sdk/05-tools.ts)、[扩展](../examples/sdk/06-extensions.ts)和[完整控制](../examples/sdk/12-full-control.ts)。

## 示例

| 示例 | 用途 |
|---|---|
| [最小示例](../examples/sdk/01-minimal.ts) | 创建会话、发送提示词、观察运行并释放会话 |
| [自定义模型](../examples/sdk/02-custom-model.ts) | 选择模型和思考等级 |
| [System 提示词](../examples/sdk/03-custom-prompt.ts) | 替换或追加 system 提示词 |
| [Skills](../examples/sdk/04-skills.ts) | 发现、筛选和添加 Skills |
| [工具](../examples/sdk/05-tools.ts) | 选择内置工具及其工作目录 |
| [扩展](../examples/sdk/06-extensions.ts) | 加载文件扩展和内联扩展 |
| [上下文文件](../examples/sdk/07-context-files.ts) | 添加或替换项目指令 |
| [提示模板](../examples/sdk/08-prompt-templates.ts) | 添加文件式提示模板 |
| [凭据](../examples/sdk/09-api-keys-and-oauth.ts) | 配置凭据和模型存储 |
| [设置](../examples/sdk/10-settings.ts) | 提供基于文件或内存的设置 |
| [会话](../examples/sdk/11-sessions.ts) | 控制会话持久化和恢复 |
| [完整控制](../examples/sdk/12-full-control.ts) | 替换默认发现和状态服务 |
| [会话运行时](../examples/sdk/13-session-runtime.ts) | 安全地替换活动会话 |
| [Codemode 和 MCP](../examples/sdk/14-codemode-mcp.ts) | 添加 `codemode`、`tool_search` 和 MCP 扩展 |

<a id="exports"></a>

## 相关资料

- [选择模型](/models/#model-guide)：介绍模型选择和兼容端点；[服务提供方](/providers/)：介绍凭据和各 Provider 的配置。
- [配置](/configuration/)：说明常规资源发现和配置；[设置](/settings/)：列出全部设置项。
- [会话与上下文](/sessions/)：说明会话行为；[会话格式](/session-format/)：定义持久化条目；[消息类型](/message-types/)：定义共用转录数据。
- [扩展](/extensions/)、[Skills](/skills/)和[提示模板](/prompt-templates/)：介绍通过 `ResourceLoader` 提供的资源。
- [CLI 集成](/cli-integration/)：介绍 SDK 同进程集成之外的 print、JSON 和 RPC 方案。
