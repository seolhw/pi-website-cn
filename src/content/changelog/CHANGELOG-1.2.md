## [1.2.0] - 2026-10-12

### 新功能

- **按 key 筛选 OpenRouter 模型列表**：仅列出该 key 可用模型，并显示其上下文、最大输出和价格，包括 `models.json` 配置的区域端点。参见[OpenRouter](docs/providers.md#openrouter)。
- **发布配置 schema**：为 `settings.json`、`models.json`、快捷键和主题提供 `$schema`，供编辑器验证和补全。参见[设置](docs/settings.md)、[模型](docs/models.md)、[快捷键](docs/keybindings.md)、[主题](docs/themes.md)。
- **远程会话复制剪贴板**：`PI_CLIPBOARD_OSC52=1` 可在 Pi 无法识别远程会话时将复制内容发送到客户端剪贴板。参见[Pi 进程配置](docs/environment-variables.md#pi-process-configuration)。
- **Codemode 改进**：工具声明显示整数、最小/最大值、默认值等约束；工具行显示已用时间和总耗时。参见[Codemode](docs/codemode.md)。
- **扩展触发的运行也触发 `before_agent_start`**：`pi.sendMessage(..., { triggerTurn: true })` 使用与提示相同的初始化流程。参见[事件和并发](docs/extensions.md#events-and-concurrency)。

### 破坏性变更

- 发布由 schema 生成的 models、settings、keybindings、themes 配置 schema：`https://pi.dev/schemas/*.schema.json`。主题 schema 改为 `https://pi.dev/schemas/theme.schema.json`；启动时加载的主题也会验证。请更新 `$schema`，将可复用颜色放在 `vars` 下并移除不支持的元数据（[#9880](https://github.com/earendil-works/pi/pull/9880)、[#10751](https://github.com/earendil-works/pi/pull/10751)，[@christianklotz](https://github.com/christianklotz)）
- `before_agent_start` 现在也响应空闲时由 `pi.sendMessage(..., { triggerTurn: true })` 启动的运行。`BeforeAgentStartEvent` 按 `messageType` 区分：`"user"` 包含 `prompt`、`images`，`"custom"` 包含起始 `message` 而无 `prompt`。handler 返回消息适用于两种运行；待发送的 `deliverAs: "nextTurn"` 也会传递给自定义消息运行。仅处理用户提示的 handler 应检查 `event.messageType === "user"`（[#10267](https://github.com/earendil-works/pi/issues/10267)、[#5581](https://github.com/earendil-works/pi/issues/5581)、[#10739](https://github.com/earendil-works/pi/pull/10739)，[@davidbrai](https://github.com/davidbrai)）
- 运行启动期间（包括 `before_agent_start`）会话即视为忙碌：`ctx.isIdle()` 返回 false；`pi.sendMessage()` 加入正在启动的运行；`pi.sendUserMessage()` 必须指定 `deliverAs`；此时请求 abort 会在运行启动后中止运行（[#10739](https://github.com/earendil-works/pi/pull/10739)，[@davidbrai](https://github.com/davidbrai)）
- `pi mcp list --json` 对提供 resources 的 server 返回 `resources: true`，不再返回资源及模板数量；连接时也不再枚举资源（[#10526](https://github.com/earendil-works/pi/issues/10526)）

### 新增

- 工具定义新增 `reachesTools`，声明某工具可能调用的其他工具（如 `codemode`、`tool_search`）；MCP 扩展据此等待所需 server，并判断替换工具是否能访问 MCP 工具
- 工具 namespace 新增 `aliases`；codemode 的 `describeNamespace()` 和 `searchTools()` 的 `namespace` 可按别名匹配，MCP namespace 使用 server 名称
- OpenRouter 模型列表按 API key 筛选，仅显示该 key 可用聊天模型及对应上下文、最大输出、价格（含 guardrail 和区域 endpoint），列表会缓存以供离线使用（[#10353](https://github.com/earendil-works/pi/issues/10353)、[#10672](https://github.com/earendil-works/pi/pull/10672)，[@davidbrai](https://github.com/davidbrai)）
- 新增 `PI_CLIPBOARD_OSC52=1`，写入本地剪贴板后也通过 OSC 52 向终端发送复制内容，支持无法检测远程会话的多路复用器或远程 IDE（[#10826](https://github.com/earendil-works/pi/issues/10826)、[#10835](https://github.com/earendil-works/pi/issues/10835)、[#10114](https://github.com/earendil-works/pi/issues/10114)）
- codemode 工具行运行时显示已用时，完成后显示总耗时（[#10708](https://github.com/earendil-works/pi/issues/10708)）

### 变更

- `showHardwareCursor` 现在只使用终端光标，不再同时绘制 Pi 反色光标
- codemode 工具声明以 `@` 注释标注整数、最小/最大值、长度、模式和默认值约束，供脚本读取（[#10707](https://github.com/earendil-works/pi/issues/10707)）
- codemode MCP 工具声明直接列出结果类型 `content`、`structuredContent`、`isError`，不再引用未定义的 `CallToolResult<T>`；描述中也移除共享 MCP 类型
- `serializeConversation()`（压缩、分支摘要、错误报告）现在省略 thinking block，避免回放的 thinking 不在当前上下文中却令摘要请求超过上下文上限

### 修复

- codemode 的 `// @options:` 不在首行时不再被忽略；若 `timeout_ms` 未应用，会在运行前报错（[#10631](https://github.com/earendil-works/pi/issues/10631)）
- Mistral 长时间 thinking 时不再因请求超时中止 stream；超时仅限制等待响应头（[#10609](https://github.com/earendil-works/pi/issues/10609)）
- 修复主仓库内嵌 git worktree 的符号链接 `AGENTS.md` 导致项目上下文文件全未加载（[#10681](https://github.com/earendil-works/pi/issues/10681)）
- codemode 工具说明现正确指出：声明输出 schema 的工具即使失败也会 resolve 并返回值（如非零退出的 bash）
- `triggerTurn: true` 运行的首次工具调用后，不再删除 `before_agent_start` 添加的 system prompt 区块，以免提示词变化并重复破坏 provider 缓存（[#10267](https://github.com/earendil-works/pi/issues/10267)、[#10739](https://github.com/earendil-works/pi/pull/10739)，[@davidbrai](https://github.com/davidbrai)）
- codemode 大量调用 `text()` 后不再因输出合并的平方级复杂度阻塞数秒至数分钟（[#10678](https://github.com/earendil-works/pi/issues/10678)）
- Print 模式 `-p` 的最终回复达到输出上限时现在打印部分文本、向 stderr 警告并以 1 退出，而非无提示地以 0 退出（[#10799](https://github.com/earendil-works/pi/issues/10799)）
- `pi mcp login --timeout` 的帮助和文档现说明其限制完整登录流程（[#10636](https://github.com/earendil-works/pi/issues/10636)）
- `extensions`、`skills`、`prompts`、`themes` 设置中的 `!pattern`、`+path`、`-path` 现在会展开 `~`（[#10765](https://github.com/earendil-works/pi/issues/10765)）
- MCP server 连接时不再列举所有资源，因此提供 resources 的 server 不必等枚举完成才注册工具；`/mcp` 和 `pi mcp list` 显示是否提供资源（[#10526](https://github.com/earendil-works/pi/issues/10526)）
- MCP server 按规范返回数组、`null` 或基本类型的结构化内容时，工具调用不再失败；未声明输出 schema 的 MCP 工具将 `structuredContent` 类型标为 `unknown`（[#10416](https://github.com/earendil-works/pi/issues/10416)）
- Windows 上旧锁目录仍在删除时读写 `auth.json` 遇到 `EPERM` 会短暂重试（[#10801](https://github.com/earendil-works/pi/issues/10801)）
- OpenRouter 的 `openrouter/auto` 等路由模型不再显示每百万 token -$1,000,000；负数占位价格按 0 处理（[#10672](https://github.com/earendil-works/pi/pull/10672)，[@davidbrai](https://github.com/davidbrai)）
- Anthropic 因 grammar 大小、工具数或联合类型限制拒绝 strict 工具集时，会以首选工具非 strict 重试一次（[#10409](https://github.com/earendil-works/pi/issues/10409)）
- “The upstream provider returned an error” 现在视为临时 provider 错误并重试（[#10842](https://github.com/earendil-works/pi/issues/10842)）
- 全屏覆盖层聚焦时仍可用鼠标滚动 transcript（[#10769](https://github.com/earendil-works/pi/issues/10769)）
- 终端颜色响应分片时不再把十六进制值泄漏到提示并触发外部编辑器（[#10256](https://github.com/earendil-works/pi/issues/10256)、[#10657](https://github.com/earendil-works/pi/issues/10657)）
- Herdr 从 1.1.0 起可正常渲染内嵌图像（[#10774](https://github.com/earendil-works/pi/pull/10774)，[@ogulcancelik](https://github.com/ogulcancelik)）
- Kitty 键盘协议或 modifyOtherKeys 下，快捷键可正确匹配 `+`、`ctrl++` 等移位符号（[#9880](https://github.com/earendil-works/pi/pull/9880)，[@christianklotz](https://github.com/christianklotz)）
- 自定义编辑器中的压缩状态指示器现使用编辑器边框色或 thinking level 色，而非默认 muted 色（[#10809](https://github.com/earendil-works/pi/issues/10809)、[#10810](https://github.com/earendil-works/pi/pull/10810)，[@Jay-Madden](https://github.com/Jay-Madden)）
- MCP 工具调用在等待 OAuth 刷新期间取消或超时后，不会在刷新结束时仍发送到 server（[#10598](https://github.com/earendil-works/pi/issues/10598)）
- OAuth 未发现授权服务器元数据、无法校验响应 `iss` 时，现在会以 issuer mismatch 结束登录（报告者：[@AizenvoltPrime](https://github.com/AizenvoltPrime)）
- Node 24/26 使用 `node --watch` 运行 Pi 时，codemode 不再因 bridge 错误失败（[#10725](https://github.com/earendil-works/pi/issues/10725)）

### 移除

- 移除未发布的实验性 server、client、plugin 栈（`src/experimental`、`src/cli/experimental`）及源码专用导出 `./client`、`./experimental/plugin`；这些内容从未进入发布包。其依赖的 `@earendil-works/pi-client`、`pi-protocol`、`pi-server` 不再发布
- 移除 `@earendil-works/chord` 依赖
