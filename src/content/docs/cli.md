---
title: "命令行"
---

<a id="cli-and-modes-reference"></a>

# 命令行

本页介绍 Pi 内置的命令行命令和选项。运行 `pi --help`，或在命令后追加 `--help`，即可查看当前安装版本的准确用法。顶层帮助信息也会包含已加载扩展注册的选项。

```sh
pi [options] [--] [@files...] [messages...]
pi install <source> [options]
pi remove <source> [options]
pi uninstall <source> [options]
pi update [target] [options]
pi list
pi config [options]
pi auth login <provider> [--api-key] [--no-browser]
pi auth logout <provider>
pi auth <check|print-api-key|print-bearer-token> [options]
pi mcp <add|remove|list|login|logout> [options]
```

<a id="modes"></a>

<a id="invocation-and-output"></a>

## 调用方式与输出

```sh
pi
pi --print "Summarize this repository"
git diff | pi --print "Review this change"
pi --mode json "Inspect this repository" > events.jsonl
```

当标准输入和标准输出都连接到终端时，Pi 会打开终端界面；除非使用 `--print`、`--mode json` 或 `--mode rpc` 选择其他接口。如果任一数据流被重定向，且未选择 JSON 或 RPC 模式，Pi 就会使用打印模式。如何在交互式、打印、JSON、RPC 和 SDK 集成方式之间选择，请参阅 [CLI 集成](/cli-integration/)。

| 输入 | 行为 |
|---|---|
| `message` | 提供初始提示词 |
| `@path` | 将文本文件或图像加入首条提示词 |
| 管道标准输入 | 将其内容添加到首条提示词开头 |
| `--` | 停止解析选项，使提示词可以以 `-` 开头 |

Pi 会根据当前工作目录解析 `@path`。工作目录也决定项目配置、资源发现范围和会话分组方式。

`--print` 用于控制 Pi 是否运行一次后退出。`--mode` 用于选择输出接口。当标准输入和标准输出都连接到终端时，`--mode text` 不会强制 Pi 单次运行；如需此行为，请使用 `--print`。

| 选项 | 行为 |
|---|---|
| `-p`、`--print` | 运行提供的提示词，将 assistant 的最终文本写入标准输出，然后退出 |
| `--mode text` | 选择文本输出；当标准输入和标准输出都连接到终端时，仍会打开终端界面 |
| `--mode json` | 运行提供的提示词，将 JSONL 事件写入标准输出，然后退出 |
| `--mode rpc` | 从标准输入读取 JSONL 命令，并持续将响应和事件写入标准输出，直到关闭 |
| `--export <input> [output]` | 将会话文件导出为 HTML 后退出；省略 `output` 时自动推导目标路径 |

RPC 模式不接受 `@file` 参数。JSON 和 RPC 模式会将标准输出保留给协议记录。详见 [JSON 事件流](/json/)和 [RPC 协议](/rpc/)。

<a id="model-options"></a>

## 模型

```sh
pi --model sonnet:high
```

模型选择请参阅[选择模型](/models/#model-guide)，凭据配置请参阅[服务提供方](/providers/)。

- `--provider <name>`<br>
  将 `--model` 的查找范围限制为单个 Provider。此选项必须与 `--model` 一起使用。
- `--model <pattern>`<br>
  按精确 ID 或模糊匹配的 ID/名称选择模型。支持 `provider/id` 和可选的 `:<thinking>` 后缀。如果多个 Provider 均匹配，Pi 会优先选择已有凭据的 Provider；否则会要求指定 `--provider`。
- `--api-key <key>`<br>
  使用不会持久保存的 API 密钥覆盖值。必须通过 `--model` 或 `--models` 选择模型。若多个 Provider 提供同一模型，此选项不会替你选择 Provider。
- `--thinking <level>`<br>
  设置为 `off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max`。该值会覆盖 `--model` 后缀，并限制在模型支持的能力范围内。
- `--models <patterns>`<br>
  为启动和模型轮换设置逗号分隔的范围。支持精确 ID、模糊匹配、不区分大小写的 glob，以及可选的 `:<thinking>` 后缀。如果多个 Provider 都提供同一模型，Pi 会分别添加并发出警告。
- `--list-models [search]`<br>
  列出可用模型；可选地使用模糊搜索筛选，然后退出。

<a id="session-options"></a>

## 会话

```sh
pi --continue
```

恢复、分叉、命名和存储会话的说明请参阅[会话与上下文管理](/sessions/)。

- `-c`, `--continue`<br>
  继续当前目录下最近的会话。
- `-r`, `--resume`<br>
  打开会话选择器，并在所选会话的工作目录中恢复该会话。按 Tab 可一并显示其他目录中的会话。
- `--session <path|id>`<br>
  按文件路径或完整/部分 ID 打开会话，并在其工作目录中恢复。如果该 ID 只匹配其他目录中的会话，Pi 会询问是否将其分叉到当前目录。
- `--session-id <id>`<br>
  打开当前目录中具有该 ID 的现有会话；若不存在则新建。ID 可包含字母、数字、`.`、`_` 和 `-`。
- `--fork <path|id>`<br>
  按文件路径或完整/部分 ID 选择会话，并在当前目录中将其分叉为新会话。
- `--session-dir <dir>`<br>
  覆盖会话的存储和查找目录。其优先级高于 `PI_CODING_AGENT_SESSION_DIR` 和 `sessionDir` 设置。
- `--no-session`<br>
  使用不会持久化的内存会话。
- `-n`, `--name <name>`<br>
  设置会话显示名称。

限制：

- 会话 ID 必须以字母或数字开头和结尾。
- `--fork` 不能与 `--session`、`--continue`、`--resume` 或 `--no-session` 同时使用。
- `--session-id` 不能与 `--session`、`--continue` 或 `--resume` 同时使用。可将其与 `--fork` 搭配，以指定新会话 ID。

<a id="tool-options"></a>
<a id="tools"></a>

## 工具

```sh
pi --tools read,grep,find,ls --print "Review this project"
```

默认工具选择的配置方法请参阅[设置](/settings/#tools)。

- `-t`, `--tools <list>`<br>
  使用逗号分隔的允许列表替换默认工具选择，列表可包含内置、扩展或自定义工具。条目可以是工具名称或匹配模式，其中 `*` 可匹配任意字符。除非某个条目以 `mcp__` 开头，否则 MCP 工具仍会保留（参见 [MCP 工具](#mcp-tools)）。如果列表只包含 `+name` 和 `-name` 条目，它就不是允许列表，而是用于修改默认选择。
- `-xt`, `--exclude-tools <list>`<br>
  在应用其他所有选择选项之后，禁用逗号分隔的工具名称或匹配模式，包括 MCP 工具。
- `-nbt`, `--no-builtin-tools`<br>
  禁用默认内置工具，同时保留扩展工具和自定义工具。
- `-nt`, `--no-tools`<br>
  启动时禁用所有内置工具、扩展工具、自定义工具和 MCP 工具。

除非通过 `defaultTools` 修改，默认启用的工具为 `read`、`bash`、`edit` 和 `write`。`--tools` 使用普通名称时会替换整个工具列表，因此需要列出所有希望启用的工具。和 `defaultTools` 一样，它也接受只包含 `+name`、`-name` 的列表，用来增删默认工具：`pi --tools +codemode,-write` 会保留其他默认工具、启用 `codemode` 并禁用 `write`。这些条目必须是精确工具名称，不支持 `*` 模式；按模式禁用工具请使用 `--exclude-tools`。普通名称不能与 `+name`/`-name` 条目混用。`/reload` 会启用新加入 `defaultTools` 的工具，但通过 `-name` 移除的工具仍保持禁用。

<a id="mcp-tools"></a>

`--tools` 用于选择声明给模型的工具，不会移除 MCP 工具；MCP 工具是否可用由其[暴露级别](/mcp/#control-tool-exposure)决定：`pi --tools read,codemode` 仍会保留所有可从 codemode 脚本调用的 MCP 工具。无论暴露级别如何，未被任何条目点名或匹配的 MCP 工具都不会直接声明给模型；只有列入列表的 `tool_search` 能加载它们。条目以 `mcp__` 开头后，`--tools` 也会筛选 MCP 工具，因此以下命令只保留 `radius` 服务器的工具：

```sh
pi --tools read,bash,codemode,'mcp__radius__*'
```

MCP 资源工具（`list_mcp_resources`、`list_mcp_resource_templates`、`read_mcp_resource`）也属于 MCP 工具。要移除 MCP 工具，可使用 `--exclude-tools 'mcp__*'` 或 [`--no-mcp`](#resource-options)。

| 内置工具 | 用途 |
|---|---|
| `read` | 读取文本文件和受支持的图像 |
| `bash` | 运行 Shell 命令 |
| `powershell` | 在 Windows 上运行 PowerShell 命令 |
| `edit` | 在现有文件中精确替换文本 |
| `write` | 创建或覆盖文件 |
| `grep` | 搜索文件内容 |
| `find` | 使用 glob 模式查找路径 |
| `ls` | 列出目录内容 |

内置扩展还提供两个工具，默认关闭；MCP 服务器需要时，MCP 扩展会自动启用它们（参见 [MCP](/mcp/#control-tool-exposure)）。如需手动启用，请在 `--tools` 或 `defaultTools` 中指定。

| 内置扩展 | 用途 |
|---|---|
| `codemode` | 运行可调用其他工具的 JavaScript，例如通过 `Promise.allSettled` 并行调用；只有脚本输出会返回给模型 |
| `tool_search` | 搜索尚未声明给模型的工具（例如使用 `codemode` 或 `deferred` 暴露级别的 MCP 工具），并将匹配项声明给下一次调用 |

<a id="enable-codemode"></a>
### 启用 codemode

要在每个会话中启用 `codemode`，请将其加入 `~/.pi/agent/settings.json` 或项目 `.pi/settings.json` 中的默认工具列表：

```json
{
  "defaultTools": ["+codemode"]
}
```

这样会保留 `read`、`bash`、`edit` 和 `write`，并额外启用 `codemode`。若只需对单次调用启用，可通过 `--tools` 添加：

```sh
pi --tools +codemode
```

即使不使用 MCP，codemode 也很有用：脚本可以并行调用多个工具、在大量输出传给模型前进行筛选、通过 `models.classify()` 调用 TypeSafe Jev 等分类器模型（参见[分类器模型](/models/#use-classifier-models)），以及通过 `models.generateImages()` 生成图像（参见[图像模型](/models/#use-image-models)）。

### codemode 的工作方式

脚本在 QuickJS 沙箱中运行，并通过 `tools.<name>(args)` 调用其他工具。[Codemode 脚本](/codemode/)介绍脚本 API、工具的列出与查找方式、`store()` 和 `models` 全局对象，以及相关限制。

### 工具搜索

`tool_search` 默认关闭；可通过 `"defaultTools": ["+tool_search"]` 或 `--tools` 启用。它会对尚未声明的工具使用与 `searchTools()` 相同的排序方式进行搜索，并将匹配项声明给下一次模型调用。已加载的工具会像其他工具变更一样记录在会话中，因此会继续在该分支保持声明状态。

<a id="resource-options"></a>

<a id="resources"></a>

## 资源

```sh
pi --extension ./review.ts
```

目录约定和项目授权请参阅[配置](/configuration/)，路径设置请参阅[设置](/settings/#resources)，软件包来源请参阅 [Pi 包](/packages/#package-guide)。

- `-e`, `--extension <path>`<br>
  加载扩展文件、目录或 `builtin:mcp` 等内置扩展，可重复指定。
- `-ne`, `--no-extensions`<br>
  禁用自动发现、已配置和内置扩展。显式指定的 `-e` 路径仍会加载，因此 `pi -ne -e builtin:mcp` 只保留内置 MCP 支持。
- `--no-mcp`<br>
  在本次运行中禁用内置 MCP 支持：不会连接任何服务器，也不会提供 MCP 工具或 `/mcp` 命令。但如果有扩展替代了内置 MCP 支持，此选项不会影响该扩展。
- `--skill <path>`<br>
  加载 Skill 文件或目录，可重复指定。
- `-ns`, `--no-skills`<br>
  禁用自动发现和已配置的 Skill。显式指定的 `--skill` 路径仍会加载。
- `--prompt-template <path>`<br>
  加载提示模板文件或目录，可重复指定。
- `-np`, `--no-prompt-templates`<br>
  禁用自动发现和已配置的提示模板。显式指定的 `--prompt-template` 路径仍会加载。
- `--theme <path>`<br>
  加载主题文件或目录，可重复指定。
- `--use-theme <name[/name]>`<br>
  选择本次运行时交互界面的初始主题。
- `--no-themes`<br>
  禁用自动发现和已配置的主题。显式指定的 `--theme` 路径仍会加载。
- `-nc`, `--no-context-files`<br>
  禁用对 `AGENTS.md` 和 `CLAUDE.md` 的发现。

资源路径仅对当前进程生效。相对路径以当前工作目录为基准解析。

<a id="prompt-and-display-options"></a>

## 提示词与进程

```sh
pi --append-system-prompt ./instructions.md
```

已保存的配置请参阅[配置](/configuration/)，项目授权请参阅[安全](/security/#understand-project-trust)，进程控制请参阅[环境变量](/environment-variables/)。

- `--system-prompt <text|path>`<br>
  使用指定文本或现有文件内容替换默认系统提示词。
- `--append-system-prompt <text|path>`<br>
  将指定文本或现有文件内容追加到系统提示词中，可重复指定。
- `--tui-mode <mode>`<br>
  使用 `fullscreen`（默认）或 `regular` 终端模式。
- `--verbose`<br>
  显示详细的交互式启动信息，并覆盖 `quietStartup` 设置。
- `-a`, `--approve`<br>
  在本次进程中信任项目本地配置和资源。
- `-na`, `--no-approve`<br>
  在本次进程中忽略需要授权的项目本地配置和资源。
- `--offline`<br>
  禁用自动网络活动，包括模型目录刷新。等同于设置 `PI_OFFLINE=1`。
- `-h`, `--help`<br>
  显示帮助信息（包括已加载扩展注册的选项），然后退出。
- `-v`, `--version`<br>
  显示 Pi 版本，然后退出。

扩展可以注册其他长选项。未知的短选项会被拒绝。

<a id="package-commands"></a>
## 软件包命令

```sh
pi install npm:@scope/package
```

来源格式、筛选、安装和项目范围请参阅 [Pi 包](/packages/#package-guide)。

### 常见操作

| 操作 | 命令 |
|---|---|
| 安装软件包 | `pi install <source>` |
| 列出已配置的软件包 | `pi list` |
| 移除软件包及其设置项 | `pi remove <source>` |
| 配置要加载的软件包资源 | `pi config` |

在 `install`、`remove`、`uninstall` 或 `config` 后添加 `--local` 或 `-l`，即可使用项目设置而不是全局设置。

### 更新 Pi 或软件包

不指定目标运行 `pi update` 时，会更新 Pi 本身。

| 操作 | 命令 |
|---|---|
| 更新 Pi | `pi update` |
| 更新所有已安装的软件包 | `pi update --extensions` |
| 更新一个已安装的软件包 | `pi update <source>` |
| 刷新模型目录 | `pi update --models` |
| 更新 Pi 和所有已安装的软件包 | `pi update --all` |

如果所选更新包含 Pi，可添加 `--force` 重新安装 Pi。

如果 Pi 是通过 Nix 等其他软件包管理器安装的，`pi update` 无法更新 Pi 本身。请改用对应的软件包管理器更新，例如运行 `nix profile upgrade pi`。软件包和模型目录仍可通过 Pi 更新。

<a id="custom-update-command"></a>
#### 自定义更新命令

如果 Pi 由包装脚本或其他软件包管理器提供，可设置 `PI_SELF_UPDATE_COMMAND`，让 `pi update` 执行相应的更新命令：

```sh
export PI_SELF_UPDATE_COMMAND="mise use -g npm:{packageName}@{version}"
```

只有当 pi.dev 上有更新版本时，`pi update` 才会运行该命令，并将 `{packageName}`、`{version}` 和 `{installSpec}`（即 `{packageName}@{version}`）替换为该版本对应的值。命令会按空格拆分。如果参数中包含空格，请改用 `~/.pi/agent/settings.json` 中的 `selfUpdateCommand` 设置，并传入 argv 数组，例如 `["nix", "profile", "upgrade", "pi"]`。

### 别名与命令选项

- `pi uninstall <source>` 是 `pi remove <source>` 的别名。
- `pi update --self`、`pi update self` 和 `pi update pi` 都是 `pi update` 的别名。
- `pi update --extension <source>` 是 `pi update <source>` 的别名。
- `-a`、`--approve` 会在单次命令中信任项目本地文件；`-na`、`--no-approve` 则忽略需要授权的项目本地文件。
- 在命令后追加 `-h` 或 `--help`，可查看其准确用法和选项限制。

<a id="credential-commands"></a>
## 凭据命令

`pi auth login <provider>` 会在终端中登录 Provider，然后退出，不会启动会话。它会通过账户登录并打开浏览器，类似 `/login <provider>`。不支持账户登录的 Provider 会要求输入 API 密钥。如果全局 MCP 配置中尚未使用该登录方式，登录 Radius 时还会将 Radius MCP 服务器添加到 `~/.pi/agent/mcp.json`。此命令需要交互式终端。

| 选项 | 说明 |
|---|---|
| `--api-key` | 保存 API 密钥而不是通过账户登录；读取密钥时不会回显 |
| `--no-browser` | 不打开浏览器，改用 Provider 的其他登录方式，例如通过 SSH 使用设备码；存在多种方式时会询问。不能与 `--api-key` 同时使用 |

`pi auth logout <provider>` 会删除由 `pi auth login` 或 `/login` 保存的凭据，作用类似 `/logout`。环境变量和 `models.json` 配置不会改变。如果没有保存的凭据，命令仍以状态码 `0` 退出，因此可以安全地重复执行。

```sh
pi auth login radius
pi auth logout radius
pi auth check --provider openai --json
```

其他身份验证命令需要指定 `--provider <provider>` 或 `--model <model>`。支持的身份验证方式请参阅[服务提供方](/providers/)。

| 命令 | 说明 |
|---|---|
| `pi auth check` | 输出 `ready`、`not_ready` 或 `invalid`；对应的退出状态码分别为 `0`、`1` 和 `2` |
| `pi auth print-api-key` | 输出解析后的 API 密钥 |
| `pi auth print-bearer-token` | 输出解析后的 OAuth bearer token |

| 选项 | 适用命令 | 说明 |
|---|---|---|
| `--provider <provider>` | 所有命令 | 解析指定 Provider 的凭据 |
| `--model <model>` | 所有命令 | 根据模型解析凭据；可与 `--provider` 搭配使用 |
| `--json` | `auth check` | 以 JSON 格式输出结构化结果 |
| `--credentials` | `auth check` | 凭据可用时输出已解析的凭据 |
| `--no-refresh` | `auth check` | 不刷新过期的 OAuth 凭据；默认会刷新 |
| `--min-expiry <duration>` | `print-bearer-token` | 要求令牌至少剩余指定有效期，单位可为 `ms`、`s`、`m` 或 `h`，例如 `30m` |

输出凭据的命令会将机密信息写入标准输出。

<a id="mcp-commands"></a>
## MCP 命令

这些命令可在会话外运行，因此 agent 可以通过 `bash` 调用。详见 [MCP 服务器](/mcp/)。

| 命令 | 说明 |
|---|---|
| `pi mcp add <server> [options] -- <command> [args...]` | 在 `mcp.json` 中添加或替换 stdio 服务器；使用 `--env KEY=VALUE`（可重复指定）和 `--cwd <dir>` 设置其环境变量和工作目录。命令后的参数会传递给服务器 |
| `pi mcp add <server> [options] --url <url>` | 添加或替换可流式传输的 HTTP 服务器；可使用 `--header KEY=VALUE`（可重复指定）、`--bearer-token-env-var <NAME>`（发送 `Authorization: Bearer ${NAME}`）、`--oauth-client-id`、`--oauth-client-secret`、`--oauth-callback-port`、`--oauth-client-name` 和 `--oauth-client-registration`（`auto`、`cimd` 或 `dcr`）配置身份验证 |
| `pi mcp remove <server>` | 从 `mcp.json` 中移除服务器；已保存的 OAuth 凭据会保留 |
| `pi mcp list [--json]` | 连接所有已启用的服务器，并输出其状态、工具和错误；如果配置项无效或已启用的服务器未能连接，则以 `1` 退出 |
| `pi mcp login <server> [-l] [--timeout <seconds>]` | 登录 OAuth 服务器：打开授权页面并等待浏览器回调；也可在终端中粘贴重定向 URL。`--timeout` 限制整个登录流程的时长，包括向授权服务器发送请求（默认 300 秒）。`-l` 要求服务器定义在项目的 `.pi/mcp.json` 中 |
| `pi mcp logout <server> [-l]` | 删除服务器已保存的 OAuth 凭据 |

`add` 和 `remove` 默认修改 `~/.pi/agent/mcp.json`；添加 `--local`（`-l`）则修改当前目录中的 `.pi/mcp.json`。`add` 还接受 `--exposure <mode>`（参见[暴露级别](/mcp/#control-tool-exposure)）和 `--description <text>`，但不会连接服务器；请运行 `pi mcp list` 检查连接状态。

只有已受信任项目中的 `.pi/mcp.json` 文件才会被读取。
