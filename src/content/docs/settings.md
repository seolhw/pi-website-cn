---
title: "设置"
---

# 设置参考

本参考列出用户可配置的设置项、类型、默认值和用途。项目设置优先于 Agent 目录设置；资源列表会合并。设置文件位置和信任行为请参阅[配置](/configuration/)。

在 `settings.json` 中添加 `"$schema": "https://pi.dev/schemas/settings.schema.json"`，即可启用编辑器校验和自动补全。

<a id="model-and-thinking"></a>
## 模型与思考

<a id="model-cycling"></a>

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `defaultProvider` | string | 自动 | 启动时使用的 AI Provider。 |
| `defaultModel` | string | 自动 | 启动时使用的模型 ID。 |
| `defaultThinkingLevel` | `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "max"` | `"medium"` | 启动时使用的思考等级。 |
| `modelThinkingLevels` | object | 无 | 按精确的 `provider/modelId` 为每个模型指定启动思考等级。 |
| `thinkingBudgets` | object | 内置预算 | 为 `minimal`、`low`、`medium` 和 `high` 思考等级设置 Token 预算。 |
| `enabledModels` | `string[]` | 所有可用模型 | 用于启动选择和模型循环切换的模型模式。格式与 `--models` 相同。 |
| `hideThinkingBlock` | boolean | `false` | 在对话记录中隐藏思考内容块。 |
| `showCacheMissNotices` | boolean | `false` | 显示重要缓存未命中、成功预热缓存、压缩用量和 Provider 恢复的通知。 |
| `cacheWarming` | `"off" \| "streaming" \| "idle"` | `"idle"` | 活跃运行期间保持符合条件的 Provider 提示缓存为热状态；设为 `"idle"` 时，运行之间最多保持 30 分钟。`"streaming"` 只在活跃运行期间预热。仅限全局设置。 |

只有在模型声明了缓存有效期，并且 Pi 估算可避免的缓存未命中成本至少为 0.05 美元时，才会执行缓存预热。刷新用量会计入会话总量，但不会占用模型上下文。`/session` 会显示下一步决策；扩展可以通过 `cache_warming_decision` 覆盖该决策。请参阅[提示缓存有效期](/models/#prompt-cache-lifetimes)。

模型选择和思考控制请参阅[选择模型](/models/#model-guide)。

<a id="interaction"></a>
## 交互

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `steeringMode` | `"all" \| "one-at-a-time"` | `"one-at-a-time"` | 排队的引导消息如何发送。 |
| `followUpMode` | `"all" \| "one-at-a-time"` | `"one-at-a-time"` | 排队的后续消息如何发送。 |
| `externalEditor` | string | `$VISUAL`、`$EDITOR`，然后是平台默认值 | 通过外部编辑器快捷键打开的命令。 |
| `doubleEscapeAction` | `"tree" \| "fork" \| "none"` | `"tree"` | 编辑器为空时连续按两次 Escape 执行的操作。 |
| `treeFilterMode` | `"default" \| "no-tools" \| "user-only" \| "labeled-only" \| "all"` | `"default"` | `/tree` 初始使用的筛选模式。 |
| `defaultProjectTrust` | `"ask" \| "always" \| "never"` | `"ask"` | 默认项目权限处理方式。**只能在 Agent 目录设置中配置。** |

<a id="tools"></a>
## 工具

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `defaultTools` | `string[]` | `read`、`bash`、`edit`、`write` | 启动时启用的工具。普通名称会替换默认列表；`+name` 用于添加工具，`-name` 用于移除工具。空数组会禁用所有内置工具，但不会禁用扩展或 SDK 工具。 |
| `codemode.mode` | `"on"` \| `"only"` | `"on"` | `codemode` 工具处于活动状态时如何呈现工具。`on`：在已声明工具的描述末尾附加从脚本调用它的提示，`codemode` 只列出未声明的工具。`only`：`codemode` 列出脚本可调用的所有工具，并将活动的内置工具和扩展工具从模型侧隐藏，使模型通过 `codemode` 调用它们。 |
| `codemode.inlineBudget` | number | `3000` | `codemode` 工具描述中工具声明可使用的估算 Token 数（字符数 / 4）。放不下的工具会被省略，可通过 `searchTools()` 查找。设为 `0` 时只列出命名空间。 |

可用的内置工具有 `read`、`bash`、`powershell`、`edit`、`write`、`grep`、`find` 和 `ls`。`defaultTools` 也可以指定 `codemode` 和 `tool_search`（由默认不启用的内置扩展注册），以及其他默认不启用的扩展工具。

如果列表只包含 `+name` 和 `-name` 条目，则会修改继承的工具选择，而不是替换它。例如，以下设置会在默认工具之外启用 `codemode`：

```json
{
  "defaultTools": ["+codemode"]
}
```

以下设置会用 `powershell` 替换 `bash` 并启用 `grep`：`["-bash", "+powershell", "+grep"]`。项目设置会叠加在用户设置之上：项目列表只含 `+name` 和 `-name` 时会修改用户选择；包含普通名称时则会替换用户选择。在同一个列表中，先由普通名称确定工具集合，再按顺序应用 `+name` 和 `-name`。

`/reload` 会启用新加入 `defaultTools` 的工具，但不会禁用已移除的工具，也不会重新启用你手动关闭的、且配置未变化的工具。使用普通名称的 `--tools`、`--no-tools` 和 `--no-builtin-tools` 会覆盖 `defaultTools`，重新加载时也如此。

命令行工具选项会在单次调用中覆盖此设置。若 `--tools` 仅包含 `+name` 和 `-name`，则会修改解析后的 `defaultTools` 选择，例如 `pi --tools +codemode`。运行 `/reload` 时这些条目也会作用于重新加载后的设置，因此通过 `-name` 移除的工具仍会保持移除。请参阅[命令行](/cli/#tools)。

<a id="sessions-and-context"></a>
## 会话与上下文

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `sessionDir` | string | Agent 会话目录 | 会话存储目录。相对路径相对于工作目录解析。`PI_CODING_AGENT_SESSION_DIR` 和 `--session-dir` 优先级高于此设置。 |
| `sessionShareDestination` | `"auto" \| "gist" \| "radius"` | `"auto"` | `/share` 使用的目的地。`auto` 在已认证时使用 Radius，否则创建 GitHub gist。`gist` 始终使用 gist。`radius` 需要 Radius 认证，且不会回退到 gist。 |

<a id="compaction"></a>
### 压缩

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `compaction.enabled` | boolean | `true` | 启用自动压缩。 |
| `compaction.reserveTokens` | number | `16384` | 可用上下文 Token 低于此值时开始自动压缩。 |
| `compaction.keepRecentTokens` | number | `20000` | 不做摘要而保留的最近 Token 数。 |
| `compaction.modelOverrides` | object | 无 | 按精确的 `provider/modelId` 设置模型专属 Token 参数。 |

<a id="per-model-compaction-overrides"></a>

压缩 Token 值必须是非负安全整数。每个值分别按以下顺序解析：匹配的模型覆盖值、常规压缩设置、内置默认值。项目和用户对象会先合并，再进行模型查找。

压缩的触发、摘要和校验行为请参阅[压缩参考](/compaction/)。

<a id="branch-summaries"></a>
### 分支摘要

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `branchSummary.reserveTokens` | number | `16384` | 汇总分支历史时预留的 Token 数。 |
| `branchSummary.skipPrompt` | boolean | `false` | 跳过分支摘要提示词，并默认不生成摘要。 |

<a id="terminal-and-display"></a>
## 终端与显示

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `theme` | string | `"system"` | 内置或自定义主题名称。`system` 会根据终端主题生成颜色。 |
| `quietStartup` | boolean \| `"header"` | `false` | `true` 会隐藏启动标题和已加载资源列表。`"header"` 会保留标题（版本和快捷键提示），但隐藏模型范围行和已加载资源列表。 |
| `tuiMode` | `"regular" \| "fullscreen"` | `"fullscreen"` | 交互式终端 UI 模式。 |
| `fullscreenExitOutput` | `"transcript" \| "resume-hint"` | `"transcript"` | 退出全屏模式时输出的内容。 |
| `fullscreenScrollbar` | `"auto" \| "always" \| "hidden"` | `"auto"` | 全屏对话记录滚动条行为。 |
| `fullscreenCopyOnSelect` | boolean | `true` | 在全屏模式下自动复制选中的文本。 |
| `fullscreenWheelScrollLines` | `"auto"` \| number | `"auto"` | 全屏模式下每次鼠标滚轮事件滚动的行数，范围为 1 到 100。`"auto"` 在本地 macOS 终端中每次移动一行（这些终端已会加速滚轮和触控板输入）；其他环境及 SSH 连接中，会加速快速滚动，最多每次移动 6 行。按住 Alt 滚动时，移动距离为五倍。 |
| `editorPaddingX` | number | `0` | 编辑器水平内边距，范围为 0 到 3 个单元格。 |
| `outputPad` | `0 \| 1` | `1` | 对话消息、工具输出、`!` 命令输出和摘要块的水平内边距。 |
| `autocompleteMaxVisible` | number | `5` | 自动补全可见条目数，范围为 3 到 20。 |
| `showHardwareCursor` | boolean | `false` | 使用终端光标而不是 Pi 绘制的光标。Pi 仍会为输入法定位光标。 |
| `terminal.showImages` | boolean | `true` | 支持时在终端中显示内联图片。 |
| `terminal.imageWidthCells` | number | `60` | 内联图片的首选宽度（终端单元格数）。 |
| `terminal.clearOnShrink` | boolean | `false` | 渲染内容缩小时清除空行。未设置时，`PI_CLEAR_ON_SHRINK=1` 会启用此功能。 |
| `terminal.showTerminalProgress` | boolean | `false` | 在终端标签页中显示 OSC 9;4 进度。 |
| `terminal.hyperlinks` | `boolean \| "auto"` | `"auto"` | 覆盖 OSC 8 超链接检测。 |
| `terminal.images` | `"kitty" \| "iterm2" \| "auto" \| false` | `"auto"` | 覆盖内联图片协议检测。 |
| `terminal.trueColor` | `boolean \| "auto"` | `"auto"` | 覆盖真彩色检测。 |
| `images.autoResize` | boolean | `true` | 将图片缩放到最多 2000×2000 像素，再发送给模型。 |
| `images.blockImages` | boolean | `false` | 阻止向模型发送图片。 |
| `markdown.codeBlockIndent` | string | `"  "` | 渲染代码块时使用的缩进前缀。 |
| `markdown.mermaid` | `"off" \| "final" \| "streaming"` | `"streaming"` | Mermaid 渲染模式。 |

格式和平台详情请参阅[主题](/themes/)和[终端配置](/terminal-setup/)。

<a id="network-and-retries"></a>
## 网络与重试

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `transport` | `"auto" \| "sse" \| "websocket" \| "websocket-cached"` | `"auto"` | 对支持多种传输方式的 AI Provider 指定首选传输方式。 |
| `httpProxy` | string | 无 | 作为 `HTTP_PROXY` 和 `HTTPS_PROXY` 应用于 Pi 管理的 HTTP 客户端的代理 URL。**只能在 Agent 目录设置中配置。** |
| `httpIdleTimeoutMs` | number \| `"disabled"` | `300000` | HTTP 响应头和请求体的空闲超时时间（毫秒）。设为 `0` 或 `"disabled"` 可禁用。 |
| `websocketConnectTimeoutMs` | number \| `"disabled"` | `15000` | WebSocket 连接超时时间（毫秒）。设为 `0` 或 `"disabled"` 可禁用。 |
| `retry.enabled` | boolean | `true` | 启用 Agent 级别的临时故障自动重试。 |
| `retry.maxRetries` | number | `3` | Agent 级别的最大重试次数。 |
| `retry.baseDelayMs` | number | `2000` | 指数退避的初始延迟（毫秒）。 |
| `retry.maxAgentDelayMs` | number | `60000` | Agent 级别的最大重试延迟（毫秒）。 |
| `retry.provider.timeoutMs` | number | `httpIdleTimeoutMs` | Provider 请求超时时间（毫秒）。 |
| `retry.provider.maxRetries` | number | `0` | Provider 级别的重试次数。 |
| `retry.provider.maxRetryDelayMs` | number | `60000` | 服务器要求等待的最大延迟（毫秒）。设为 `0` 可禁用此上限。 |

除非确实需要 Provider 级别重试，否则请将 `retry.provider.maxRetries` 保持为 `0`。Provider 重试可能会延迟 Pi 自行处理配额和用量限制错误。

<a id="shell"></a>
## Shell

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `shellPath` | string | 平台默认值 | 自定义 Shell 可执行文件路径。支持路径开头使用 `~`。 |
| `shellCommandPrefix` | string | 无 | 添加到每条 Shell 命令前面的前缀。 |
| `npmCommand` | `string[]` | `npm` | 查询和安装 npm 软件包时使用的命令及参数。 |
| `selfUpdateCommand` | `string[]` | 无 | `pi update` 更新 Pi 本身时运行的命令及参数，可使用 `{packageName}`、`{version}` 和 `{installSpec}` 占位符。`PI_SELF_UPDATE_COMMAND` 优先级更高。**只能在 Agent 目录设置中配置。**请参阅[自定义更新命令](/cli/#custom-update-command)。 |

Shell 配置请参阅[Shell 别名](/shell-aliases/)；包管理器行为请参阅 [Pi 软件包](/packages/#package-guide)。

<a id="resources"></a>
## 资源

用户设置中的资源路径相对于 Agent 目录解析；项目设置中的路径相对于项目的 `.pi` 目录解析。支持绝对路径和 `~`。

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `packages` | array | `[]` | npm、git 或本地 Pi 软件包来源。请参阅 [Pi 软件包](/packages/#package-guide)。 |
| `extensions` | `string[]` | `[]` | 扩展文件或目录。 |
| `skills` | `string[]` | `[]` | Skill 文件或目录。 |
| `prompts` | `string[]` | `[]` | 提示模板文件或目录。 |
| `themes` | `string[]` | `[]` | 主题文件或目录。 |
| `enableSkillCommands` | boolean | `true` | 将 Skill 注册为 `/skill:name` 命令。 |

资源数组支持使用 `!pattern` 排除 glob 匹配项、使用 `+path` 精确包含路径，以及使用 `-path` 精确排除路径。Pi 会加载用户级和项目设置中都列出的资源。

内置扩展在 `extensions` 中的名称为 `builtin:mcp`、`builtin:llama.cpp`、`builtin:codemode` 和 `builtin:tool-search`。它们默认加载；使用 `-builtin:mcp` 可禁用某一项。项目设置中的 `+builtin:<name>` 或 `-builtin:<name>` 会覆盖用户设置。`pi config` 会在 Built-in 区域列出这些扩展。`--no-extensions` 也会禁用它们；`-e builtin:<name>` 可显式加载某一项。

<a id="updates-telemetry-and-warnings"></a>
## 更新、遥测与警告

| 设置 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `collapseChangelog` | boolean | `false` | 更新后显示精简版更新日志。也会将扩展软件包的更新日志压缩为每个软件包一行。 |
| `enableInstallTelemetry` | boolean | `true` | 启用匿名安装/更新报告以及选定的 Provider 归属请求头。此设置不控制更新检查。 |
| `enableAnalytics` | boolean | `false` | 选择共享分析数据。目前仅用于实验性的首次运行设置流程。 |
| `warnings.anthropicExtraUsage` | boolean | `true` | 当 Anthropic 订阅认证可能产生付费额外用量时发出警告。 |
