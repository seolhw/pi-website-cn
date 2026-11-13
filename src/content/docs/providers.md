---
title: "模型服务提供方"
---

# 模型服务提供方

大多数托管 Provider 支持以下一种或两种认证方式：

- 通过浏览器或设备授权流程登录，使用 OAuth 认证。
- 提供 API Key。

运行 `/login [provider]` 可查看某个 Provider 支持的认证方式。Amazon Bedrock 和 Google Vertex AI 还支持使用当前环境中的云凭据。

<a id="authenticate-interactively"></a>
## 交互式认证

运行 `/login` 并选择 Provider。Pi 会引导你完成 OAuth 或 API Key 认证，并将凭据保存到 [`auth.json`](/configuration/#agent-directory)。

在远程或无头机器上，OAuth 回调可能无法送达本地进程。Pi 提示时，可将最终重定向 URL 或授权码粘贴回 Pi。

运行 `/logout` 并选择 Provider 可移除已保存的凭据。此操作不会取消设置环境变量、移除 `models.json` 中的认证信息，也不会向 Provider 撤销该凭据。

`auth.json` 可能包含 API Key 和 OAuth Token。请妥善保管，不要提交到版本库。

<a id="use-an-api-key-from-the-environment"></a>
## 通过环境变量提供 API Key

在 CI 环境或不希望 Pi 保存密钥时，可使用环境变量。启动 Pi 前设置相应变量：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

下表列出了只需一个主要 API Key 环境变量的 Provider。需要额外配置或支持环境云凭据的 Provider，请参阅[Provider 专项配置](#provider-specific-config)。

| Provider | 环境变量 |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| Ant Ling | `ANT_LING_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| DeepSeek | `DEEPSEEK_API_KEY` |
| NVIDIA NIM | `NVIDIA_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN` |
| Mistral | `MISTRAL_API_KEY` |
| Groq | `GROQ_API_KEY` |
| Cerebras | `CEREBRAS_API_KEY` |
| xAI | `XAI_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` |
| ZAI Coding Plan（全球） | `ZAI_API_KEY` |
| ZAI Coding Plan（中国） | `ZAI_CODING_CN_API_KEY` |
| OpenCode Zen 和 Go | `OPENCODE_API_KEY` |
| Radius | `RADIUS_API_KEY` |
| TypeSafe（[分类器模型](/models/#use-classifier-models)） | `TYPESAFE_API_KEY` |
| Hugging Face | `HF_TOKEN` |
| Fireworks | `FIREWORKS_API_KEY` |
| Together AI | `TOGETHER_API_KEY` |
| Baseten | `BASETEN_API_KEY` |
| Kimi For Coding | `KIMI_API_KEY` |
| Meta | `META_API_KEY` |
| MiniMax | `MINIMAX_API_KEY` |
| MiniMax（中国） | `MINIMAX_CN_API_KEY` |
| Moonshot AI（全球和中国） | `MOONSHOT_API_KEY` |
| Qwen Token Plan 和 Individual | `QWEN_TOKEN_PLAN_API_KEY` |
| Qwen Token Plan（中国）和 Individual（中国） | `QWEN_TOKEN_PLAN_CN_API_KEY` |
| Xiaomi MiMo | `XIAOMI_API_KEY` |
| Xiaomi MiMo Token Plan（中国） | `XIAOMI_TOKEN_PLAN_CN_API_KEY` |
| Xiaomi MiMo Token Plan（阿姆斯特丹） | `XIAOMI_TOKEN_PLAN_AMS_API_KEY` |
| Xiaomi MiMo Token Plan（新加坡） | `XIAOMI_TOKEN_PLAN_SGP_API_KEY` |

Anthropic 也将 `ANTHROPIC_OAUTH_TOKEN` 识别为 API 凭据，并将 `ANTHROPIC_AUTH_TOKEN` 识别为 Bearer 认证。

如果没有设置 Key 或 Token，但已设置 `ANTHROPIC_FEDERATION_RULE_ID`、`ANTHROPIC_ORGANIZATION_ID` 和 `ANTHROPIC_IDENTITY_TOKEN_FILE`，Anthropic 会使用 Workload Identity Federation：Anthropic SDK 会将身份 Token 交换为短期访问 Token，并自行刷新（刷新时会重新读取身份 Token 文件，因此长会话期间应确保该文件保持最新）。设置后，`ANTHROPIC_SERVICE_ACCOUNT_ID` 和 `ANTHROPIC_WORKSPACE_ID` 也会一并传递。

<a id="load-an-api-key-from-a-command"></a>
## 从命令加载 API Key

如果希望使用 Secret Manager，又不想将解析后的 Key 写入磁盘，可在 `auth.json` 中将 Provider 的 `key` 设置为以 `!` 开头的命令：

```json
{
  "anthropic": {
    "type": "api_key",
    "key": "!security find-generic-password -ws 'anthropic'"
  }
}
```

Pi 会在首次需要 Key 时运行该命令，并在进程生命周期内缓存其标准输出。如果输出为空、命令超时或以非零状态码退出，该 Key 会保持未解析状态，直到 Pi 重启。

<a id="provider-specific-config"></a>
## Provider 专项配置

以下 Provider 需要额外的设置、特殊的配置方式，或可以使用平台提供的凭据。

已保存的 API Key 凭据可以包含 `env` 对象。该 Provider 使用这些值时，它们的优先级高于进程环境变量：

```json
{
  "cloudflare-workers-ai": {
    "type": "api_key",
    "key": "...",
    "env": {
      "CLOUDFLARE_ACCOUNT_ID": "account-id"
    }
  }
}
```

<a id="radius"></a>
### Radius

Radius 是由 Pi 的开发团队 Earendil Works 为 Pi 打造的服务，提供可定制的 AI 网关，并内置组织级控制、分析功能以及分享 Pi 创作成果的制品功能。

在 Pi 中运行 `/login radius` 即可开始使用。这会将 Radius 添加为一个 Provider，其模型会像其他 Provider 一样出现在 `/model` 中。

Radius 还提供 MCP 服务器，因此 Pi 可以帮你管理 Radius。

Radius 目前处于早期 Alpha 阶段，仍在快速演进。更多信息请参阅 [radius.earendil.com](https://radius.earendil.com)。

Radius 认证使用其网关目录，并缓存刷新后的模型元数据，以便后续离线启动。若在 `models.json` 中配置自定义 Radius 网关，它会使用自己的目录，而不会继承公开的 `radius.pi.dev` 目录。

<a id="openrouter"></a>
### OpenRouter

通过 `/login openrouter` 或 `OPENROUTER_API_KEY` 完成认证。

设置 Key 后，Pi 只会列出该 Key 有权使用的 OpenRouter 对话模型，并使用该 Key 对应的上下文长度、最大输出量和价格。这些信息来自 OpenRouter 的 `/models/user` 端点，反映 OpenRouter 设置的保护规则和 Provider 限制。图片模型和分类器模型不会经过筛选。

Pi 会在交互模式启动时、打开 `/model` 时、运行 `/login` 后，以及执行 `pi update --models` 时在后台刷新模型列表。最近一次列表会保存下来，供离线环境、`pi -p` 和 RPC 模式使用。在 `/login` 之外切换 Key 后，旧 Key 对应的列表会保留到下次刷新。

区域端点会按区域筛选模型。要使用区域端点，请在 [`models.json`](/models/#configure-a-compatible-endpoint) 中设置基础 URL：

```json
{
  "providers": {
    "openrouter": { "baseUrl": "https://us.openrouter.ai/api/v1" }
  }
}
```

如果基础 URL 在访问 `/models/user` 时拒绝该 Key，或不提供该端点（例如将代理配置为 OpenRouter 基础 URL），Pi 就会列出所有 OpenRouter 模型。

<a id="azure-openai"></a>
### Azure OpenAI

Provider ID 为 `azure`（此前为 `azure-openai-responses`）。在 `auth.json`、`models.json` 和 `settings.json` 中均使用它作为键名，模型引用也使用该 ID，例如 `--model azure/gpt-5.4`。

`azure` Provider 通过 Responses API 提供 OpenAI 模型，并通过 Chat Completions 提供 Microsoft Foundry 模型，例如 `azure/deepseek-v4-pro`。

设置 API Key，并提供基础 URL 或资源名称：

```bash
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_BASE_URL=https://your-resource.ai.azure.com
# 或者：
export AZURE_OPENAI_RESOURCE_NAME=your-resource
```

位于 `ai.azure.com`、`cognitiveservices.azure.com` 和 `openai.azure.com` 下的资源根 URL 会被规范化为 OpenAI API 路径。

Pi 会将模型 ID 作为部署名称发送。如果部署名称不同，可通过 `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` 建立映射：

```bash
export AZURE_OPENAI_DEPLOYMENT_NAME_MAP=gpt-5.4=my-gpt-deployment,deepseek-v4-pro=my-deepseek
```

`AZURE_OPENAI_API_VERSION` 可覆盖 OpenAI 模型使用的 API 版本，默认值为 `v1`。

如果要使用 Pi 目录中没有的 Foundry 模型，请在 [`models.json`](/models/#configure-a-compatible-endpoint) 的 `azure` 下添加该模型，并设置 `api: "openai-completions"`。自定义模型必须提供 `baseUrl`；如果设置了 `AZURE_OPENAI_BASE_URL` 或 `AZURE_OPENAI_RESOURCE_NAME`，它们的优先级更高：

```json
{
  "providers": {
    "azure": {
      "baseUrl": "https://your-resource.services.ai.azure.com",
      "models": [
        { "id": "your-deployment", "api": "openai-completions" }
      ]
    }
  }
}
```

<a id="amazon-bedrock"></a>
### Amazon Bedrock

Bedrock 可使用 Bearer Token，也可以使用 AWS 环境中已有的凭据来源：

```bash
# 命名配置
export AWS_PROFILE=your-profile

# IAM Key
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
# 临时凭据必需
export AWS_SESSION_TOKEN=...

# Bedrock Bearer Token
export AWS_BEARER_TOKEN_BEDROCK=...

# 配置文件或 AWS SDK 配置未提供区域时使用
export AWS_REGION=us-west-2
# 也支持 AWS_DEFAULT_REGION
```

Pi 也支持通过标准的 `AWS_CONTAINER_CREDENTIALS_*` 和 `AWS_WEB_IDENTITY_TOKEN_FILE` 变量获取 ECS 任务凭据和 IRSA 凭据。

<a id="cloudflare-ai-gateway"></a>
### Cloudflare AI Gateway

该网关需要 Token、Account ID 和 Gateway ID：

```bash
export CLOUDFLARE_API_KEY=...
export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_GATEWAY_ID=...
```

Account ID 和 Gateway ID 可以来自进程环境，也可以放在 `auth.json` 中该凭据的 `env` 对象内。

`CLOUDFLARE_API_KEY` 用于 Pi 向网关完成认证。上游访问可以使用 Cloudflare 统一计费、网关中保存的凭据，或在 `models.json` 中为该 Provider 配置的 `Authorization` 请求头。

<a id="cloudflare-workers-ai"></a>
### Cloudflare Workers AI

Workers AI 需要 Token 和 Account ID：

```bash
export CLOUDFLARE_API_KEY=...
export CLOUDFLARE_ACCOUNT_ID=...
```

Account ID 也可以保存在凭据的 `env` 对象中。

<a id="google-vertex-ai"></a>
### Google Vertex AI

可以使用 Google Cloud API Key：

```bash
export GOOGLE_CLOUD_API_KEY=...
```

如果要使用 Application Default Credentials，请配置项目和区域：

```bash
export GOOGLE_CLOUD_PROJECT=your-project
# 也支持 GCLOUD_PROJECT
export GOOGLE_CLOUD_LOCATION=us-central1
```

然后完成认证：

```bash
gcloud auth application-default login
```

如果要改用服务账号 Key 文件，请同时设置 `GOOGLE_APPLICATION_CREDENTIALS`、项目和区域。
