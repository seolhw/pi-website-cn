---
title: "连接 MCP 服务器"
---

<a id="mcp-servers"></a>

# MCP 服务器

Pi 通过标准输入输出或可流式传输的 HTTP 连接 [Model Context Protocol](https://modelcontextprotocol.io) 服务器，并将其工具和资源提供给模型。

## 快速开始

添加本地 stdio 服务器、检查连接，然后启动 Pi：

```bash
pi mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .
pi mcp list
pi
```

添加远程服务器：

```bash
pi mcp add docs --url https://example.com/mcp --bearer-token-env-var DOCS_TOKEN
pi mcp list
```

这些命令默认添加用户级服务器。添加 `--local` 或 `-l` 可改为写入项目配置：

```bash
pi mcp add -l tools --env API_KEY='${TOOLS_KEY}' -- uvx tools-mcp
```

在交互会话中使用 `/mcp` 查看连接、登录、重新连接、更改暴露方式，或启用和禁用服务器。在会话外添加、移除或更改服务器后，请运行 `/reload`。

## 配置服务器

Pi 从 `~/.pi/agent/mcp.json` 读取用户级服务器，从 `.pi/mcp.json` 读取项目级服务器。只有授予[项目信任](/security/#understand-project-trust)后才会读取项目配置。同名项目条目会覆盖用户级条目。

如果项目条目没有 `command`、`url` 或 `type`，它只会覆盖同名用户级服务器的 `enabled`、`exposure` 和 `toolExposure`，其余配置（包括 `env`、`headers` 和 `auth`）都会保留。例如，以下配置会在单个项目中禁用用户级服务器：

```json
{
  "mcpServers": {
    "internal-tools": { "enabled": false }
  }
}
```

配置格式与其他 MCP 客户端一致：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "docs": {
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer ${DOCS_TOKEN}" },
      "description": "Search and read the product documentation"
    }
  }
}
```

Stdio 服务器使用 `command`、`args`、`env` 和 `cwd`。相对 `cwd` 路径以会话目录为基准。`command`、参数或 `cwd` 开头的 `~/` 表示用户主目录。

HTTP 服务器使用 `url`、`headers` 和 `oauth`（参见[使用 OAuth 认证](#authenticate-with-oauth)）。不支持旧版 SSE 传输。

两种服务器都支持以下字段：

- `timeout`：每个请求的超时时间（秒），默认值为 60。收到进度通知时会重置计时。
- `enabled: false`：保留配置条目，但不连接服务器。
- `exposure` 和 `toolExposure`：控制模型如何调用工具（参见[控制工具暴露方式](#control-tool-exposure)）。
- `description`：用一句话说明服务器提供的功能。该说明会将服务器列入系统提示词（参见[控制工具暴露方式](#control-tool-exposure)），供工具搜索对服务器工具排序，并由 codemode 的 `describeNamespace()` 返回。若未设置，服务器连接后会使用服务器指令的首行。

个人服务器以及包含凭据的服务器应放在用户级文件中。项目级文件仅用于项目必需的服务器，并且只在受信任的项目中使用。

### 配置规则

- 服务器名称只能包含字母、数字、`_` 和 `-`。工具名称为 `mcp__<server>__<tool>`，其中除字母、数字和 `_` 以外的字符都会替换为 `_`；若同一服务器的工具名称因此冲突，所有冲突工具都会添加哈希后缀。仅 `-` 和 `_` 不同的服务器名称视为同名：后添加的服务器会被拒绝，`mcp.json` 中的服务器优先于扩展注册的服务器。
- `type` 为可选项。指定 `command` 时使用 stdio，指定 `url` 时使用可流式传输的 HTTP。若设置 `type`，其值必须为 `stdio`、`http` 或 `streamable-http`。
- 不接受 `sse`。提供 SSE 端点的服务器通常也支持可流式传输的 HTTP，常见端点为 `/mcp` 而非 `/sse`。
- `command` 只能是一个可执行文件，参数放在 `args` 中；不能将整条 Shell 命令写入 `command`。
- `env` 和 `headers` 的值可以引用环境变量，例如 `${GITHUB_TOKEN}`；也可以通过 `!command` 执行命令，但命令必须构成整个值，例如 `"Authorization": "!echo Bearer $(gh auth token)"`。
- 无效条目会被报告并跳过，不会阻止其他服务器连接。

常见的命令行配置变更可使用 `pi mcp add` 和 `pi mcp remove`。选项请参阅 [MCP 命令](/cli/#mcp-commands)。

### 查看或更改服务器

`/mcp` 会列出已配置服务器的状态、工具数量、暴露方式和配置来源，并将需要处理的服务器显示在前面。选择服务器后，可以查看工具和连接详情、重新连接、登录或退出、更改暴露方式，或启用和禁用服务器。

暴露方式和启用状态的变更会保存到定义该服务器的文件中，不会覆盖无关内容。在受信任的项目中，“在此项目中启用”和“在此项目中禁用”会为用户级服务器添加项目覆盖；之后对此服务器的更改也会保存到覆盖项中。禁用的服务器仍会显示在列表中。在交互式 TUI 之外，`/mcp` 会输出服务器状态；`/mcp login <server>`、`/mcp logout <server>` 和 `/mcp reconnect <server>` 可直接执行对应操作。

以下 Shell 命令无需启动会话即可使用：`pi mcp add`、`pi mcp remove`、`pi mcp list`、`pi mcp login` 和 `pi mcp logout`。Shell 命令不会加载扩展。

### 诊断连接问题

运行 `pi mcp list` 可连接所有已启用服务器，并输出状态、工具和错误。如果存在无效条目或已启用服务器未连接，命令会以状态码 1 退出。`/mcp` 会显示完整连接错误，以及 stdio 服务器失败时标准错误输出的末尾内容。

Pi 启动后会报告一次配置错误、连接失败和需要登录的情况。服务器日志通知会以 `<time> [<server>] <level> <logger>: <message>` 格式追加到 `~/.pi/agent/mcp.log`。文件超过 5 MB 后会轮换为 `mcp.log.1`。

会话启动时，Pi 会在后台连接所有已启用的服务器。服务器连接后，其工具才会出现；`codemode` 的说明不会列出这些工具，因此服务器连接时说明内容不会变化。首条提示词最多等待 10 秒，只等待具有 `direct` 工具的服务器，因为这些工具必须声明在请求中。其他服务器会在需要时等待：codemode 脚本会等待其点名的服务器（`mcp__<server>`）；调用 `searchTools()` 或读取 `ALL_TOOLS` 时则会等待所有服务器；`tool_search` 和资源工具也会等待所有服务器。HTTP 网络错误及临时状态码（408、429 和 5xx）会重试两次。连接断开时会显示为未连接，并在下次调用时重新连接。服务器公布的工具列表发生变化后，新增工具会被加入，撤销的工具则无法再访问。

停止 stdio 服务器时，Pi 会关闭其标准输入、发送 SIGTERM，然后向其进程组发送 SIGKILL。通过 `npx` 或 `uvx` 等包装器启动的服务器也会一并停止。

## 从其他客户端迁移配置

将转换后的条目移至 `mcp.json` 的 `mcpServers` 下，然后运行 `pi mcp list` 验证配置。

| 客户端 | 转换方式 |
|---|---|
| Claude Desktop、Claude Code 或 Cursor | 复制现有的 `mcpServers` 条目。 |
| VS Code | 将条目从顶层 `servers` 对象移出，并将 `${input:...}` 提示替换为 `${NAME}` 环境变量。 |
| Codex | 将 `[mcp_servers.<name>]` 中的 TOML 字段（如 `command`、`args`、`env` 和 `url`）转换为 JSON。 |
| OpenCode | 将 `"type": "local"` 转为 stdio 条目，将 `command` 数组拆分为 `command` 和 `args`，把 `environment` 改名为 `env`，并将 `{env:NAME}` 替换为 `${NAME}`。将 `"type": "remote"` 转为 URL 条目。 |

<a id="authenticate-with-oauth"></a>

## 使用 OAuth 认证

使用 OAuth 的远程服务器（例如 Sentry）无需在 `mcp.json` 中配置凭据：

```json
{
  "mcpServers": {
    "sentry": { "url": "https://mcp.sentry.dev/mcp" }
  }
}
```

服务器拒绝未认证的连接时，`/mcp` 会提示需要登录。选择“登录”，运行 `/mcp login sentry`，或运行 `pi mcp login sentry`。Pi 会打开授权页面并等待批准。如果浏览器运行在另一台机器上（例如通过 SSH 连接时），请将重定向后的 URL 粘贴到登录界面。运行中的会话会在下一轮使用新凭据。

Pi 会通过 Client ID Metadata Document 标识自身，或注册一个客户端；令牌保存在 `~/.pi/agent/mcp-auth.json` 中。访问令牌过期或被服务器拒绝时，Pi 会刷新令牌。如果服务器之后要求增加 scope，Pi 会再次提示登录。退出登录会删除已保存的凭据。

凭据与服务器名称和 URL 绑定。不同名称但 URL 相同的服务器（例如每个账户各配置一个）需要分别登录；不同 `mcp.json` 文件中名称和 URL 都相同的服务器则共用登录状态。

OAuth 适用于未设置 `Authorization` 请求头的 HTTP 服务器。对于不支持动态客户端注册的服务器，请配置已注册的客户端：

```json
{
  "mcpServers": {
    "example": {
      "url": "https://mcp.example.com/mcp",
      "oauth": { "clientId": "my-client", "clientSecret": "${EXAMPLE_SECRET}", "callbackPort": 8765 }
    }
  }
}
```

重定向 URI 必须与注册的 URI 匹配。`callbackPort` 使用 `http://127.0.0.1:<port>/callback`。如需使用其他 URI，请设置 `callbackUrl`；它必须使用 HTTP，并指向 `localhost`、`127.0.0.1` 或 `[::1]`。Pi 会按原样发送该 URI。如果 `callbackUrl` 未指定端口，Pi 会使用 `callbackPort` 或空闲端口并将其添加到 URI；RFC 8252 允许环回地址重定向这样处理。`clientSecret` 为可选项，可使用环境变量或命令提供。

对于未公布所需 scope 的服务器，请将 `scope` 设置为空格分隔的列表。否则 Pi 会请求服务器公布的 scope。后续新增的 scope 请求会合并到配置值中。

Pi 默认以 `pi` 的名称注册。部分服务器只接受已知客户端的注册；设置 `clientName` 可使用其他名称：

```json
{
  "mcpServers": {
    "figma": { "url": "https://mcp.figma.com/mcp", "oauth": { "clientName": "Claude Code" } }
  }
}
```

只有 Pi 注册客户端时才会发送该名称。若要使用新名称重新注册，请先退出登录。

未设置 `clientId` 时，如果授权服务器声明支持客户端元数据文档和公共客户端，Pi 会使用 pi.dev 上的 Client ID Metadata Document 标识自身；否则会动态注册客户端。只要重定向 URI 匹配，已注册的客户端就会持续使用，直到用户退出登录。使用该文档时，客户端 ID 为 `https://pi.dev/oauth/client.json`，重定向 URI 为 `http://127.0.0.1:<port>/callback`。如果授权服务器在授权响应中不发送 `iss` 参数（RFC 9207），Pi 会改用该 MCP 服务器专属的文档和重定向路径：`https://pi.dev/oauth/<id>/client.json` 和 `http://127.0.0.1:<port>/callback/<id>`。

设置了 `clientName`，或 `callbackUrl` 在 `localhost` 或 `127.0.0.1` 上的路径不是 `/callback` 时，Pi 会注册客户端，而不使用该文档。设置 `clientRegistration` 可选择方式：`auto`（默认）按上述规则自动选择，`dcr` 始终注册，`cimd` 始终使用文档。若授权服务器不支持公共客户端文档，使用 `cimd` 会导致登录失败。授权页面提示客户端无效时，请使用 `dcr`：

```json
{
  "mcpServers": {
    "example": { "url": "https://mcp.example.com/mcp", "oauth": { "clientRegistration": "dcr" } }
  }
}
```

添加服务器时，可通过 `pi mcp add --oauth-client-registration <mode>` 设置此选项。`cimd` 不能与 `clientId` 或 `clientName` 同时使用；`callbackUrl` 必须使用 `localhost` 或 `127.0.0.1`，且路径为 `/callback`。

Pi 会通过服务器的受保护资源元数据（RFC 9728）查找授权服务器，并检查其元数据是否声明了预期的发行者（RFC 8414）。部分服务器公布了错误的授权服务器，或未公布任何授权服务器，导致登录时打开不存在的页面。请将 `authServerMetadataUrl` 设置为正确授权服务器的元数据文档：

```json
{
  "mcpServers": {
    "example": {
      "url": "https://mcp.example.com/mcp",
      "oauth": { "authServerMetadataUrl": "https://example.okta.com/.well-known/openid-configuration" }
    }
  }
}
```

Pi 会使用该文档代替自动发现，并信任所配置的内容，因此只应指向可信文档。URL 必须使用 HTTPS；`localhost`、`127.0.0.1` 和 `[::1]` 除外。

<a id="control-tool-exposure"></a>

## 控制工具暴露方式

每个服务器工具都会注册为 `mcp__<server>__<tool>`。服务器的 `exposure` 决定模型如何调用这些工具：

| 暴露方式 | 行为 | 典型用途 |
|---|---|---|
| `codemode`（默认） | 可从 [`codemode`](/cli/#tools) 脚本调用，但不会声明给模型，也不会列在 codemode 说明中。脚本可通过 `searchTools()`、`describeTool()` 或 `ALL_TOOLS` 查找工具。 | 通用 MCP 服务器，尤其适用于需要由脚本组合或筛选调用的场景。 |
| `deferred` | 只有 [`tool_search`](/cli/#tools) 找到匹配项后，才会为下一次模型调用声明该工具。 | 工具数量较多、且希望发现后直接调用的服务器。 |
| `direct` | 像内置工具一样声明给模型，也可从 codemode 调用。 | 数量较少且使用频繁的工具集。 |
| `hidden` | 已注册，但无法调用。 | 应保持不可用的服务器或工具。 |

`codemode-deferred` 可作为 `codemode` 的别名使用。

具有 `codemode` 或 `deferred` 工具的服务器会列在 system 提示词的 `mcp_servers` 部分，其中说明工具的调用方式，并包含配置的 `description` 或服务器连接后提供的指令摘要。每次提示词开始时，Pi 会在等待具有 `direct` 工具的服务器后更新此部分。如果内容发生变化（例如服务器连接后出现了摘要），Pi 会将新部分追加到对话，而不是更改工具声明，因此先前的消息仍可使用缓存。`describeNamespace()` 和 `searchTools()` 的 `namespace` 选项接受 `mcp__dev-radius`、`mcp__dev_radius`、`dev-radius` 或 `dev_radius`。

具有 `codemode` 暴露方式的服务器连接后，Pi 会启用 `codemode`；具有 `deferred` 暴露方式的服务器则会启用 `tool_search`。若要让模型无需搜索即可看到某个工具，请通过 `toolExposure` 将其设为 `direct`。

`toolExposure` 可覆盖单个工具的服务器级暴露方式。键可以是服务器工具的完整名称，也可以是使用 `*` 匹配任意字符的模式。完整名称优先于模式；多个模式匹配时，以第一个为准。`hidden` 暴露方式的服务器也可以单独开放选定工具：

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "exposure": "deferred",
      "toolExposure": {
        "search_code": "direct",
        "get_*": "codemode",
        "delete_*": "hidden"
      }
    }
  }
}
```

`pi mcp list` 会标记暴露方式与服务器不同的工具。`/mcp` 的 Tools 视图也会显示实际生效的暴露方式。

暴露方式为 `codemode` 或 `deferred` 的工具可通过两种间接机制调用：codemode 脚本可以调用它们，`tool_search` 也可以加载它们。Codemode 调用不依赖活动工具集，因此在 `/tree`、恢复会话和分叉后仍可使用。由 `tool_search` 加载的工具会记录在转录中，并在该分支上继续声明。

除非某个条目以 `mcp__` 开头，否则 `--tools` 不会移除 MCP 工具；`pi --tools read,codemode,'mcp__radius__*'` 只保留 `radius` 的工具。`--exclude-tools` 接受相同的模式；`--no-mcp` 可在单次运行中禁用 MCP（参见[工具](/cli/#mcp-tools)）。

若没有 MCP 服务器但仍需启用 `codemode`，请在[设置](/settings/#tools)中添加 `"defaultTools": ["+codemode"]`。若要阻止自动启用 codemode，请在 `mcpServers` 旁设置 `"autoEnableCodemode": false`。项目级值会覆盖用户级值。如果 `codemode` 和 `tool_search` 均未启用，导致非 direct 工具无法调用，Pi 会警告一次。

文本结果超过 20 KB 时，会移除中间部分并插入 `…N chars truncated…` 标记后再发送给模型。完整文本会保存到临时文件，文件路径会包含在结果中。Codemode 脚本收到完整结果后，可先行精简再返回给模型。

Codemode 脚本会收到完整的 MCP `CallToolResult`，包括 `content`、`structuredContent` 和 `isError`。带有 `isError` 的结果会在脚本中正常返回，但直接调用时会作为错误报告。`image(result.content[0])` 可转发图像块。服务器指令不会包含在任何工具说明中；脚本可通过 `describeNamespace("mcp__<server>")` 读取指令，该方法也会返回服务器的工具名称。

## 使用资源

连接的服务器提供 [resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) 时，Pi 会添加 Codex 和 OpenCode 使用的资源工具：

- `list_mcp_resources` 以 JSON 格式列出资源：`{ server?, resources: [{ server, uri, name, ... }], nextCursor? }`。指定 `server` 时返回一页；使用 `cursor` 获取下一页。不指定 `server` 时会列出所有服务器的全部资源。
- `list_mcp_resource_templates` 列出服务器未直接列出的资源 URI 模板。
- `read_mcp_resource` 根据 `server` 和 `uri` 读取资源。文本和图像会分别以文本和图像形式发送给模型。其他二进制资源会保存到临时文件，并将路径提供给模型。脚本收到 `{ server, uri, contents }`。

这些工具可访问所有已启用且未隐藏、并提供资源的服务器。其暴露方式取这些服务器中最宽松的一种：优先级为 `direct`，其次是 `codemode` 或 `deferred`。工具结果中的资源链接会标明 `read_mcp_resource` 和服务器名称。

通过 `ui://` URI 或 `text/html;profile=mcp-app` 标识的 MCP Apps 资源会被忽略，因为 Pi 不会渲染它们。资源图标也会被忽略。

读取和列出资源遇到临时 HTTP 错误（408、429 或 5xx）时会重试一次。工具调用不会重试，因为服务器可能已经执行了操作。

## 权限

每次 MCP 调用都会经过 Pi 的工具处理流程，因此扩展的 `tool_call` 和 `tool_result` 处理器（包括权限检查）同样适用于 MCP 工具。由 codemode 脚本发起的调用会将 codemode 调用 ID 作为 `parentToolCallId` 传递。

`pi.getAllTools()` 会报告各服务器声明的注解：`readOnlyHint`、`destructiveHint`、`idempotentHint` 和 `openWorldHint`。权限扩展可根据这些提示判断哪些调用需要确认（参见[工具暴露方式](/extensions/#tool-exposure)）。资源工具会标记为只读。

## 扩展与 SDK

### 从扩展添加服务器

扩展可通过 `pi.registerMcpServer(name, config)` 为当前会话添加服务器，其配置结构与 `mcpServers` 条目相同（参见[扩展中的 MCP 服务器](/extensions/#mcp-servers)）。注册的服务器会像配置文件中的服务器一样连接，并在 `/mcp` 中显示扩展来源。

启用状态和暴露方式的更改仅对当前会话生效。同名的文件配置服务器优先级更高，`/mcp` 会列出被覆盖的扩展注册项。`pi mcp` Shell 命令不会加载扩展，因此只能看到文件中配置的服务器。

<a id="replace-the-built-in-mcp-support"></a>

### 替换内置 MCP 支持

已安装的扩展若注册 `/mcp`（例如 `pi-mcp-adapter`），就会替换会话中的内置 MCP 支持。此时 Pi 不会读取 `mcp.json` 或连接其中的服务器，`/mcp` 命令也由该扩展接管。移除扩展即可恢复内置行为。若不使用替代扩展而要禁用内置 MCP 支持，可在 `pi config` 的 Built-in 中禁用 `mcp`，或在[设置](/settings/#resources)中设为 `"extensions": ["-builtin:mcp"]`。`--no-mcp` 可在单次运行中禁用它。

注册 `codemode` 或 `tool_search` 的扩展也会替换同名内置工具。只有替代工具声明了 [`reachesTools`](/extensions/#tool-exposure) 时，Pi 才会为 MCP 服务器启用它，并等待其调用所需的服务器。命令行中的 `pi mcp` 始终使用内置实现。

### 在 SDK 中使用 MCP

SDK 会话不会加载内置扩展。请将 MCP 扩展、供 `codemode` 服务器使用的 codemode 扩展，以及供 `deferred` 服务器使用的工具搜索扩展添加到资源加载器。参见 [Codemode 与 MCP](/sdk/#codemode-mcp)。
