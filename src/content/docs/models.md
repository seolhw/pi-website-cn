---
title: "选择模型"
---

# 选择模型

使用内置 Provider 时，先运行 `/login`，再通过 `/model` 选择模型。只有在 Pi 未内置所需 Provider 或端点时，才需要自定义模型配置。

<a id="choose-a-connection"></a>
## 选择连接方式

| 现有条件 | 建议的配置方式 |
|---|---|
| 受支持的订阅 | 通过 `/login` 登录 |
| Provider API Key | 通过 `/login` 保存，或设置对应的环境变量 |
| 本地 GGUF 模型 | 将 Pi 连接到 llama.cpp Router |
| 兼容 OpenAI、Anthropic 或 Google API 的端点 | 添加到 `models.json` |
| 使用自定义协议或认证流程的 Provider | 编写或安装 Provider 扩展 |

请在[模型目录](https://pi.dev/models)中查看当前 Provider、模型 ID、能力、上下文限制和价格。Pi 启动时会使用内置目录，也可以叠加来自 pi.dev 的较新目录数据。缓存的目录数据在离线时仍可使用；运行 `pi update --models` 可强制刷新。

<a id="authenticate"></a>
## 认证

运行 `/login` 并选择 Provider。Pi 会将凭据保存到 [`auth.json`](/configuration/#agent-directory)。运行 `/logout` 可移除该 Provider 已保存的凭据。

也可以通过 Provider 对应的环境变量提供 API Key。这适用于 CI 等不希望 Pi 写入凭据的环境。环境变量和 Provider 专项设置请参阅[模型服务提供方](/providers/)。

配置了多个凭据来源时，Pi 按以下优先级使用：运行时 `--api-key`、`auth.json` 中保存的凭据、`models.json` 中的 `apiKey`，最后是 Provider 环境变量或当前云环境凭据。Provider 扩展可以定义自己的认证行为。

请妥善保管 `auth.json` 和任何凭据命令。信任项目后，项目设置和扩展可以在 Pi 进程中执行。加载不可信目录中的配置前，请先阅读[安全说明](/security/)。

<a id="select-a-model"></a>
## 选择模型

运行 `/model` 搜索可用模型。选择器会显示认证可用的 Provider 所提供的模型。在某个模型上按 `Ctrl+S` 可将其设为新会话的默认模型。

运行 `/thinking` 为当前模型选择思考等级。在该选择器中按 `Ctrl+S` 可保存启动时使用的等级。Pi 只会提供所选模型支持的等级。

按 `Ctrl+P` 可循环切换可用模型。使用 `/scoped-models` 控制循环范围并保存选择，也可以通过[设置](/settings/#model-cycling)配置模型模式。

会话会记录模型和思考等级的变更。恢复会话时，Pi 会还原这些值，但不会影响新会话的默认设置。

<a id="connect-local-models"></a>
## 连接本地模型

Pi 可直接连接 llama.cpp Router。Router 会发现 GGUF 文件，并按需加载模型。Pi 使用 `/llama` 管理 Router，使用 `/model` 选择已加载的模型。

服务器启动、模型目录结构、下载和连接故障排查请参阅[使用 llama.cpp 运行本地模型](/llama-cpp/)。

对于 Ollama、LM Studio、vLLM、SGLang 等兼容服务器，请在 `models.json` 中[配置兼容端点](#configure-a-compatible-endpoint)。

<a id="configure-a-compatible-endpoint"></a>
## 配置兼容端点

如果服务端点使用 Pi 已支持的 API，请通过 [`models.json`](/configuration/#agent-directory) 配置。这适用于大多数 Ollama、LM Studio、vLLM、SGLang 和代理服务。

```json
{
  "$schema": "https://pi.dev/schemas/models.schema.json",
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  }
}
```

这个占位 Key 会让模型在 Pi 中可用；Ollama 会忽略它。对于需要认证的端点，`apiKey` 和请求头的值可以使用 `$NAME` 或 `${NAME}` 环境变量插值、字面值，或以 `!command` 开头的命令。`$$` 和 `$!` 分别表示字面字符 `$` 和 `!`。`models.json` 中的命令会在请求时运行，Pi 不会缓存结果。

打开 `/model` 时会重新加载该文件。`models` 条目会在该 Provider 下添加模型，或替换同 ID 的模型。使用 `modelOverrides` 可修改现有内置模型或扩展提供模型的元数据，而无需替换 Provider 的模型列表。未知的覆盖 ID 会被忽略。

要通过代理访问内置 Provider，只需设置其 `baseUrl`。模型和认证方式保持不变：

```json
{
  "providers": {
    "anthropic": { "baseUrl": "https://proxy.example.com/v1" }
  }
}
```

所有字段请参阅[模型配置](/models-configuration/)。

<a id="describe-model-input-and-caching"></a>
### 描述模型输入与缓存

使用 `inputLimits.images.resize` 控制 Pi 在将新图片附件、`read` 结果和工具结果中的图片存入对话历史前如何编码：

```json
{
  "id": "vision-model",
  "input": ["text", "image"],
  "inputLimits": {
    "images": {
      "resize": {
        "maxWidth": 1568,
        "maxHeight": 1568,
        "maxBytes": 524288,
        "jpegQuality": 75
      }
    }
  }
}
```

`maxBytes` 限制 Base64 编码后的载荷大小。省略缩放字段时，使用较保守的默认值：2000×2000 像素、编码后 4.5 MiB，以及 JPEG 质量 80。图片只编码一次；切换模型不会重新处理历史图片。模型目录还可以通过 `inputLimits.maxRequestBytes`、`images.maxPerMessage` 和 `images.maxPerRequest` 声明请求硬性限制，但 Pi 目前不会据此重写或拒绝历史内容。

<a id="prompt-cache-lifetimes"></a>

使用 `promptCache` 声明 Provider 对 `short` 或 `long` 保留级别所提供的尽力而为缓存有效期（秒）：

```json
{ "id": "claude-sonnet-5", "promptCache": { "short": 300, "long": 3600 } }
```

如果文档给出有效期范围，请采用较保守的较短值。对于当前保留级别未声明缓存有效期的模型，不会执行缓存预热。`modelOverrides` 条目可为内置或扩展模型设置 `inputLimits` 或 `promptCache`，也包括通过已验证代理访问的模型。请参阅[`cacheWarming`](/settings/#model-and-thinking)。

<a id="configure-sampling-by-thinking-level"></a>
### 按思考等级配置采样参数

兼容 OpenAI 的 API 支持自由格式的 `samplingParams` 模型默认值，以及 `samplingParamsByThinkingLevel` 覆盖项。后者使用 Pi 的思考等级键（`off`、`minimal`、`low`、`medium`、`high`、`xhigh` 和 `max`），而不是 `thinkingLevelMap` 中对应的 Provider 值：

```json
{
  "id": "qwen-thinking-model",
  "reasoning": true,
  "samplingParams": {
    "temperature": 1.0,
    "top_p": 0.95
  },
  "samplingParamsByThinkingLevel": {
    "off": {
      "temperature": 0.7,
      "top_p": 0.8
    },
    "high": {
      "top_k": 20
    }
  }
}
```

Pi 会先将不支持的思考等级限制到模型可用范围，然后依次合并模型的 `samplingParams`、当前等级的覆盖项，以及请求级别的 `samplingParams`。对于同一个键，后面的值优先。未设置的等级会继承模型默认值。`modelOverrides` 会将每个等级的条目按键与基础模型合并。这些字段只适用于 `openai-completions`、`openai-responses` 和 `azure-openai-responses`；其他 API 会忽略它们。

兼容性设置应描述已验证的端点请求或响应行为差异。不能仅凭端点声称兼容 OpenAI 或 Anthropic 就启用这些设置。

<a id="use-classifier-models"></a>
## 使用分类器模型

分类器模型不会进行普通对话，而是针对 JSON 状态回答有类型的问题：从多个选项中选择、回答是或否，或给出评分，并为结果提供概率。Pi 内置了 TypeSafe 的 Jev 模型、Workers AI 和 OpenRouter 上的 Cloudflare Clef、Clef Flash 和 Clef Omni 模型、通过 [Decisions API](https://developers.openai.com/api/docs/guides/decisions) 提供的 OpenAI GPT-6 Luna，以及通过 GitHub Copilot 提供的 Microsoft-Decision-1：

| Provider | 模型 ID | 认证方式 |
|---|---|---|
| `typesafe` | `jev-latest` | `TYPESAFE_API_KEY` |
| `openrouter` | `typesafe/jev-1.13`, `typesafe/jev-1.14`, `~typesafe/jev-latest`, `cloudflare/clef`, `cloudflare/clef-flash`, `cloudflare/clef-omni` | `OPENROUTER_API_KEY` or `/login` |
| `cloudflare-workers-ai` | `typesafe/jev`, `typesafe/jev-1.14.0`, `@cf/cloudflare/clef`, `@cf/cloudflare/clef-flash`, `@cf/cloudflare/clef-omni` | `CLOUDFLARE_API_KEY` and `CLOUDFLARE_ACCOUNT_ID` |
| `vercel-ai-gateway` | `typesafe-ai/jev` | `AI_GATEWAY_API_KEY` |
| `opencode` | `jev-1.13`, `jev-1.13-free` | `OPENCODE_API_KEY` |
| `openai` | `gpt-6-luna` | `OPENAI_API_KEY` |
| `github-copilot` | `microsoft-decision-1` | `COPILOT_GITHUB_TOKEN` or `/login` |

[llama.cpp Router](/llama-cpp/#classification) 中的对话模型也会列为分类器模型。

OpenAI Decisions API 需要 API Key，ChatGPT 登录凭据无法用于该 API。因此，即使已设置 `OPENAI_API_KEY`，只要 `openai` 通过 `/login` 登录，`gpt-6-luna` 就不会显示为可用；要使用该 Key，请先退出 `openai` 登录状态。该 API 会拒绝超过 922K Token 的输入；但运行时间超过约 5 秒的请求（目前大致对应输入超过 600K Token）会因网关超时而失败。

分类器模型不会出现在 `/model` 中。模型需要通过 [`codemode`](/cli/#enable-codemode) 工具访问分类器；除非 MCP 服务器启用了该工具，否则它默认关闭。可在[设置](/settings/#tools)中使用 `"defaultTools": ["+codemode"]` 启用。之后，脚本可通过 `models.getAvailableOfType("classifier")` 列出分类器模型，并调用 `models.classify(model, { state, questions })`：

```js
const jev = await models.getModelOfType("classifier", "typesafe", "jev-latest");
const result = await models.classify(jev, {
  state: { message: "The change works, thanks." },
  questions: {
    approved: {
      type: "bool",
      instructions: "Does the user approve of the result?",
      criteria: { true: "Approval", false: "No approval" },
    },
  },
});
return result.answers;
```

问题和答案类型请参阅 [Codemode](/codemode/#classify)。

如果分类器模型的 `input` 包含 `"image"`，它也可以判断通过 `images` 传入的图片；其他分类器模型收到图片时会返回错误。GPT-6 Luna、`typesafe` 和 `cloudflare-workers-ai` 的 Jev、`cloudflare-workers-ai` 的 Clef，以及目录中声明支持图片输入的 OpenRouter 模型均支持图片输入。Jev 支持 PNG 和 JPEG 图片；TypeSafe 自有 API 的图片输入仍属实验性功能。Clef 支持 PNG、JPEG 和 WebP，每个请求最多四张。`vercel-ai-gateway` 和 `opencode` 上的 Jev 仅支持文本。

每个 System One 服务都有自己的图片请求格式，由模型的 `compat.imageInput` 指定。内置模型已设置此字段，因此覆盖 Provider 的 `baseUrl` 后仍会保留该配置。若自定义 Provider 代理其他服务的分类器，请在 `models.json` 的 Provider 级别 `compat` 中设置此字段（参阅 [System One 兼容性](/models-configuration/#typesafe-system-one)）。特别注意，OpenRouter 会以 TypeSafe 格式成功响应请求而不报错，但会丢弃图片。

当服务报告 Token 数量时（所有 System One 服务都会报告），`result.usage` 会包含 Token 数和对应费用。Pi 会将脚本调用分类器产生的用量加到 `codemode` 工具结果中，因此也会计入页脚和 `/session` 的会话费用。费用根据模型目录中的价格计算；未设定价格的模型（例如 TypeSafe 直连的 `jev-latest`）只报告 Token，不产生费用。

扩展可不经过 codemode，直接通过 `ctx.modelRegistry.classify()` 调用分类器。[虚拟模型](/virtual-models/#route-requests)也可以利用分类器路由请求，示例请参阅 `jev-router.ts`。

<a id="use-image-models"></a>
## 使用图像模型

图像模型根据提示词和可选的输入图片生成图像。Pi 会在 `openrouter` Provider 下列出 OpenRouter 的图像模型，例如 `google/gemini-2.5-flash-image` 和 `black-forest-labs/flux.2-pro`；它们与 OpenRouter 对话模型使用相同的 `OPENROUTER_API_KEY` 或 `/login` 凭据。

与分类器模型一样，图像模型不会出现在 `/model` 中；模型通过 [`codemode`](/cli/#enable-codemode) 工具访问它们。脚本使用 `models.getAvailableOfType("image")` 列出图像模型，并调用 `models.generateImages(model, { input })`。结果中的 `output` 包含 Base64 图片块；`image()` 会将其附加到 `codemode` 结果中，以便模型查看：

```js
const painter = await models.getModelOfType("image", "openrouter", "google/gemini-2.5-flash-image");
const result = await models.generateImages(painter, {
  input: [{ type: "text", text: "A red fox in the snow, watercolor" }],
});
if (result.stopReason !== "stop") return result.errorMessage;
for (const block of result.output) if (block.type === "image") image(block);
```

`input` 也可以包含 `{ type: "image", data, mimeType }` 图片块，用于编辑或作为参考图片。与分类器调用一样，Pi 会将脚本图像调用的用量加入 `codemode` 工具结果。生成的图片不会保存到磁盘。完整 API 请参阅 [Codemode](/codemode/#generate-images)。

扩展可不经过 codemode，直接通过 `ctx.modelRegistry.generateImages()` 生成图像。

<a id="add-a-custom-provider"></a>
## 添加自定义 Provider

如果 Provider 需要自定义流式传输、模型发现或认证行为，请使用扩展。扩展工作流程请参阅[自定义 Provider](/custom-provider/)。

<a id="troubleshooting"></a>
## 故障排查

<a id="a-model-does-not-appear"></a>
### 模型未显示

确认对应 Provider 已配置可用的认证信息。自定义模型可以从 `models.json` 加载，但在 Pi 能解析凭据前不会出现在 `/model` 中。对于 llama.cpp，只有 Router 当前已加载的模型才会显示。

<a id="authentication-works-in-one-shell-only"></a>
### 认证只在一个 Shell 中生效

检查 Key 是否来自环境变量而非 `auth.json`。启动 Pi 的进程必须能够访问这些环境变量。

<a id="sign-in-opens-a-browser-on-a-remote-machine"></a>
### 远程机器上的登录流程打开了浏览器

如果 Provider 支持无头认证流程，请使用该流程完成登录。有些 Provider 允许将最终重定向 URL 或授权码粘贴回 Pi。请参阅[交互式认证](/providers/#authenticate-interactively)。

<a id="a-compatible-endpoint-rejects-requests"></a>
### 兼容端点拒绝请求

检查 `models.json` 中的 API 类型和兼容性设置。上游服务器必须支持对应的请求字段和行为。
