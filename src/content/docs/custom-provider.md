---
title: "添加自定义 Provider"
---

# 添加自定义 Provider

Provider 扩展可将 Pi 连接到需要自定义身份验证、模型发现、请求处理或流式传输的模型服务。如果服务已支持 Pi 兼容的 API，应改用 `models.json` 配置。

Provider 扩展运行在 Pi 进程内，可以访问凭据、提示词、工具定义、模型响应和用量信息。请将其视为可信代码，避免记录密钥或 Provider 请求内容。

## 选择最简单的集成方式

| 需求 | 方案 |
|---|---|
| 为兼容 API 添加模型 | [`models.json`](/models/#configure-a-compatible-endpoint) |
| 修改现有 Provider 的端点或请求头 | `models.json` 或简单的 Provider 扩展 |
| 动态发现模型 | 提供 `refreshModels` 的 Provider |
| 添加 `/login` 流程 | 使用原生或旧版 OAuth 配置的 Provider |
| 实现尚不支持的通信协议 | 提供 `stream` 或 `streamSimple` 的 Provider |

Provider 扩展属于[扩展](/extensions/)，遵循相同的加载、信任、重载和错误处理规则。

## 注册 Provider

在扩展工厂函数中调用 `pi.registerProvider()`。Pi 会等待异步工厂函数完成后再继续启动，因此在此注册的 Provider 可用于启动时选择模型，也会显示在 `pi --list-models` 中。

注册方式有两种：

- 使用 `@earendil-works/pi-ai` 中完整的 `Provider`，以支持原生身份验证、筛选、模型发现、刷新和流式传输。
- 使用 `ProviderConfig` 注册 Provider 名称，兼容现有扩展使用的旧版配置方式。

对于除了静态端点和模型元数据之外还需处理其他逻辑的新集成，优先使用完整 Provider。Pi 会将 `models.json` 中的覆盖配置应用在已注册的原生 Provider 之上。

对于现有 Provider，只注册 `baseUrl` 或 `headers` 会保留其内置模型。旧版配置中提供 `models` 会替换该 Provider 在聊天、图像和分类器操作中的所有模型。省略 `type` 时默认为 `"chat"`；图像和分类器模型必须显式声明类型，并通过 `images` 和 `classifiers` 字段按 `api` 值提供对应实现。

### 重定向现有 Provider

只注册需要修改的字段，即可保留该 Provider 的内置目录、身份验证、API 实现和兼容性设置：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("anthropic", {
    baseUrl: "https://gateway.example.com/anthropic",
    headers: {
      "X-Gateway-Key": "$GATEWAY_API_KEY",
    },
  });
}
```

如果代理或网关保留了上游协议，请使用这种方式。不要将内置模型列表复制到扩展中，否则简单的端点覆盖就会变成可能逐渐过时的目录替换。

### 注册兼容端点

如果服务实现了受支持的协议，但拥有自己的模型目录，请注册端点，并且只列出该服务实际提供的模型：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("acme", {
    name: "Acme AI",
    baseUrl: "https://api.acme.example/v1",
    apiKey: "$ACME_API_KEY",
    api: "openai-completions",
    models: [
      {
        type: "chat",
        id: "acme-chat",
        name: "Acme Chat",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      },
    ],
  });
}
```

如果不需要扩展执行代码，优先使用 `models.json`。当注册过程依赖运行时发现、自定义身份验证，或需要与扩展的其他功能共享代码时，再使用扩展。

### 注册多种操作类型的模型

支持多种操作类型的 Provider 可以同时注册非聊天模型及其实现：

```typescript
pi.registerProvider("media-tools", {
  apiKey: "$MEDIA_TOOLS_API_KEY",
  models: [
    {
      type: "image",
      id: "image-v1",
      name: "Image V1",
      api: "media-images",
      baseUrl: "https://media.example.com/v1",
      input: ["text"],
      output: ["image"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    },
    {
      type: "classifier",
      id: "classifier-v1",
      name: "Classifier V1",
      api: "media-classifier",
      baseUrl: "https://media.example.com/v1",
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 64000,
    },
  ],
  images: {
    "media-images": { generateImages: async (model, context, options) => result },
  },
  classifiers: {
    "media-classifier": { classify: async (model, context, options) => result },
  },
});
```

模型级别的 `baseUrl` 优先于 Provider 端点。如果未提供 `models` 列表，各种操作类型的内置模型都会保留。不同操作类型中相同的模型 ID 仍视为不同模型，各自保留对应的模型级请求头。

扩展首次加载完成后执行的注册调用会立即生效。使用 `pi.unregisterProvider()` 可移除动态 Provider，并恢复其替代的内置行为。

完整示例请参阅经过验证的 [GitLab Duo Provider](../examples/extensions/custom-provider-gitlab-duo/)，其中将流式传输委托给内置 API 实现。

## 提供身份验证

静态 Provider 可以从固定值、环境变量插值或命令输出中解析 API 密钥。其语法与 `models.json` 相同：

- `$NAME` 和 `${NAME}` 用于读取环境变量。
- 以 `!command` 开头时，使用该命令的输出。
- `$$` 输出字面量 `$`。
- `$!` 输出开头的字面量 `!`。

如果集成需要存储凭据、自定义解析逻辑、Provider 专属环境变量或多种登录方式，请使用原生 Provider 身份验证。

OAuth Provider 负责提供显示名称、登录流程、令牌刷新和访问令牌解析。注册后会出现在 `/login` 中，Pi 会将返回的凭据存储到 `~/.pi/agent/auth.json`。

OAuth 回调不依赖特定界面。它们可以打开授权 URL、显示设备码、报告进度、请求输入，或让用户选择登录方式。执行网络请求时应处理取消操作，并遵循传入的中止信号。

按 Enter（`tui.select.confirm`）可打开设备登录 URL 并复制验证码，也可以手动登录。Provider 可在 `onDeviceCode` 或原生 `AuthEvent` 通知中设置 `openBrowserOnConfirm: false` 或 `copyCodeOnConfirm: false`，分别禁用这些操作。

切勿将访问令牌、刷新令牌、授权请求头或完整的 Provider 响应写入普通日志。

## 提供和刷新模型

每个模型都需要 ID、显示名称、输入能力和成本元数据。聊天模型和分类器模型还需要上下文窗口；聊天模型还需声明输出上限和推理支持；图像模型则需声明输出模态。除非某个模型需要单独覆盖，否则应在 Provider 级别选择 API 实现。

如果希望 Pi 保持空闲提示词缓存处于热状态，可将 `promptCache.short` 或 `promptCache.long` 设为 Provider 尽力维持缓存的时长（秒）。留空则禁用对应保留时长的缓存预热。

兼容性标志用于描述已验证的 API 差异。不要仅因某个端点自称兼容，就启用这些标志。

请对照实际服务器确认请求字段和响应行为。

如果模型目录来自在线服务，请使用 `refreshModels`。将 `context.signal` 传递给阻塞式 I/O，以便调用方取消刷新。

两种注册方式的刷新约定不同：

- 完整的 `Provider` 不返回值，而是调用 `context.publish({ update })` 安装由 Provider 管理的模型状态；之后其同步方法 `getModels()` 会提供最新列表。
- 旧版 `ProviderConfig.refreshModels` 返回包含多种操作类型的模型定义。Pi 会用返回列表替换该注册项的在线模型，并按要求进行持久化。

只有需要跨运行保留的目录数据才应持久化。llama.cpp 等在线服务可以只更新内存中的列表；远程目录则可以保留快照，以便离线启动。

## 复用受支持的流式 API

只要 Provider 协议匹配，就应复用 Pi AI 提供的 API 实现。

现有实现支持 Anthropic Messages、OpenAI Chat Completions 和 Responses、Google Generative AI 和 Vertex、Azure OpenAI Responses、Mistral Conversations，以及 Bedrock Converse。

Provider 仍可自定义身份验证、基础 URL、请求头、模型筛选和发现流程，同时将请求转换及流式传输委托给现有 API 实现。

这种方式比复制流处理实现更安全，因为它能保留 Pi 的消息转换、工具处理、用量统计、取消机制和兼容性行为。

## 实现自定义流式传输

只有在现有 API 实现都无法适配该服务时，才应实现 `streamSimple`。请先研究 [`packages/ai/src/api`](https://github.com/earendil-works/pi/tree/main/packages/ai/src/api) 中的实现。

流处理函数接收经过规范化的 `TranscriptContext`。系统提示词和工具声明保存在转录中的 system 消息里，因此应使用 `getCurrentSystemPrompt(context.messages)` 和 `getCurrentTools(context.messages)` 读取，不要假设存在 `context.systemPrompt` 或 `context.tools`。如果模型支持在对话中途插入 system 消息，可按原位置传递；否则调用 `collapseSystemMessages(context)`，将后续 system 消息合并到首条消息中。

自定义流处理必须：

1. 创建 assistant 消息，填写 Provider、模型、时间戳、待定的停止原因、内容和初始为零的用量。
2. 请求准备成功后，在任何内容事件之前发出一次 `start` 事件。
3. 更新消息，并正确配对发出文本、思考和工具调用事件。
4. 完成用量、成本、内容和停止原因的结算。
5. 恰好发出一个终止事件（`done` 或 `error`），然后关闭流。
6. 将取消操作转换为中止结果。

请求准备阶段可能在 `start` 事件发出前失败；此时流可以直接以 `error` 终止。缺少请求身份验证信息也可能在返回流之前同步抛出异常。

内容索引对应 assistant 消息中的内容块。发出 `partial` 字段会暴露该状态的事件之前，必须先更新对应内容块。到达 `toolcall_end` 时，工具调用参数必须已解析为有效输入。

流处理还必须遵循通过 `SimpleStreamOptions` 提供的请求监测钩子：

- 发送 Provider 请求前调用 `options.onPayload`，并使用其返回的替换请求内容（若有）。
- 收到响应后、读取响应体前调用 `options.onResponse`。
- 每解析到一个 Provider 事件，在规范化之前都要等待 `options.onProviderStreamEvent?.(providerEvent, model)` 完成。
- 传递中止信号和 Provider 专属环境变量。

这些钩子用于扩展检查请求、处理响应头事件和观察 Provider 流。遗漏它们会导致该 Provider 的行为与 Pi 内置 Provider 不一致。

## 报告错误和用量

设置明确的终止停止原因。错误或中止的消息必须提供 `errorMessage`；成功消息则应准确填写输入、输出、缓存、总 token 数和成本。

遇到 Pi 可识别的上下文溢出错误时，Pi 可以压缩上下文并重试。如果服务使用未知的错误消息，可在受保护的 `message_end` 处理器中，仅将该 Provider 的溢出响应规范化为 `context_length_exceeded`。

不要将速率限制或暂时性的 Provider 故障改写为上下文溢出。这些错误应继续使用 Pi 的常规重试机制。

## 测试集成

至少测试以下情况：

- 普通文本响应和空文本响应
- 工具调用及工具结果
- 支持时的图像输入和图像工具结果
- 用量与成本统计
- 中止行为
- 上下文溢出
- 格式错误或不完整的流
- Unicode 字符边界
- 跨 Provider 的会话切换
- 身份验证刷新和取消操作

[`packages/ai/test`](https://github.com/earendil-works/pi/tree/main/packages/ai/test) 下的 Provider 测试定义了内置 Provider 应有的行为。请参考并调整相关测试套件，不要只依赖手动提示词进行验证。

开发时可直接运行扩展；完成后将其移至 Pi 可发现的扩展目录，或通过 [Pi 包](/packages/#package-guide)分发。在活动会话中修改已发现的 Provider 扩展后，请运行 `/reload`。
