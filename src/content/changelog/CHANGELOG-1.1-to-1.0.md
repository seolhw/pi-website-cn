## [1.1.0] - 2026-10-07

### 新功能

- **OSC 7501 程序状态**：兼容终端和 agent 面板可显示 Pi 正在工作、等待对话框或登录、已完成或失败。参见[程序状态](docs/terminal-setup.md#program-status)。
- **Claude Haiku 5.5**：`anthropic/claude-haiku-5-5` 支持自适应 thinking，最高 `xhigh`/`max` effort。
- **使用 `+name`/`-name` 调整默认工具**：如 `pi -t +codemode,-write`，在默认选择基础上增删工具。参见[工具](docs/cli.md#tools)。
- **GPT-6 Luna 与图像分类**：GPT-6 Luna 可通过 Decisions API 作为分类器；codemode `models.classify()` 可向支持图像的分类器传入图像。参见[分类器模型](docs/models.md#use-classifier-models)。
- **llama.cpp 原生决策模型**：llama.cpp 0.6.0+ 提供的 Julia-1、Laya、Kev、lev、OpenJev 可通过 `/v1/systemone` 作为分类器运行。参见[分类](docs/llama-cpp.md#classification)。

### 新增

- `--tools` 新增 `+name`、`-name`，可在默认工具选择上增删工具，例如 `pi -t +codemode`
- 工具渲染上下文和 `tool_execution_end` 扩展事件新增 `durationMs`，记录最终工具结果的执行时长（[#10549](https://github.com/earendil-works/pi/issues/10549)）
- 工具渲染上下文新增 `outputPad`（[#10557](https://github.com/earendil-works/pi/pull/10557)，[@rwachtler](https://github.com/rwachtler)）
- OpenAI GPT-6 Luna 可通过 Decisions API 作为分类器，并使用 `OPENAI_API_KEY`
- codemode `models.classify()` 上下文新增 `images`，供 GPT-6 Luna 等支持图像的分类器判读
- 新增 OSC 7501 程序状态报告；`PI_PROGRAM_STATUS=1|0` 可覆盖自动检测（[#10607](https://github.com/earendil-works/pi/issues/10607)）
- session、extension 和 JSON 事件中的 `agent_settled` 新增 `aborted`，以区分取消与正常结束（[#10607](https://github.com/earendil-works/pi/issues/10607)）
- 新增 Claude Haiku 5.5，支持最高 `xhigh`/`max` 自适应 thinking 和 Bedrock 提示缓存
- llama.cpp 0.6.0+ 的 Julia-1、Laya、Kev、lev、OpenJev 通过 `/v1/systemone` 仅作为分类器列出，不作为聊天模型（[#10382](https://github.com/earendil-works/pi/pull/10382)）

### 变更

- `outputPad` 也应用于 `!` 命令、工具输出和摘要块（[#9946](https://github.com/earendil-works/pi/issues/9946)、[#10557](https://github.com/earendil-works/pi/pull/10557)，[@rwachtler](https://github.com/rwachtler)）
- `pi mcp login --timeout` 现在限制完整登录流程（包括授权服务器请求），而不只是等待浏览器（[#10565](https://github.com/earendil-works/pi/issues/10565)）

### 修复

- bash 和 PowerShell 结果恢复会话后仍显示记录的执行耗时，实时 `Took` 也不再包含墙钟等待步骤（[#10549](https://github.com/earendil-works/pi/issues/10549)）
- 托管安装更新时只保留新版本和更新前版本，不再保留所有旧版本（[#10392](https://github.com/earendil-works/pi/issues/10392)、[#10511](https://github.com/earendil-works/pi/pull/10511)，[@davidbrai](https://github.com/davidbrai)）
- 独立二进制不再从启动目录读取 `.env`、`.env.local`、`.env.development` 并注入 Pi 环境（[#10473](https://github.com/earendil-works/pi/issues/10473)）
- `!!` 命令输出出现后，命令标题仍保留暗色（[#10557](https://github.com/earendil-works/pi/pull/10557)，[@rwachtler](https://github.com/rwachtler)）
- codemode 描述现将 `searchTools()`、`describeTool()`、`describeNamespace()` 标记为 async，避免模型把未等待的 Promise 序列化成 `{}`（[#10555](https://github.com/earendil-works/pi/issues/10555)）
- codemode 多个 `text()`/`console.log()` 输出现在有清晰分隔：每个文本项有 `==> text N/M <==`，console 调用集中在一个 `<console_output>` 块中
- `/mcp` 不再等待所有 server 连接完成后才打开；连接、启用、重连或停用期间界面仍可用（[#10562](https://github.com/earendil-works/pi/issues/10562)）
- Node 24.19+ 和 26.x 使用 `node --watch` 时，不再因 Node 向图像缩放 worker 通道发送自身消息而丢弃图像（[#10527](https://github.com/earendil-works/pi/issues/10527)）
- 修复 Termux 中粘贴剪贴板无反应，以及复制失败时未提示安装 Termux:API（[#10391](https://github.com/earendil-works/pi/issues/10391)）
- `!` 和 RPC `bash` 输出的颜色转义序列跨块拆分时，不再残留 `m` 等片段（[#10504](https://github.com/earendil-works/pi/issues/10504)）
- MCP OAuth 登录在等待授权服务器时可按 Esc 取消；会话结束会中止登录，每个授权请求 15 秒超时（[#10565](https://github.com/earendil-works/pi/issues/10565)）
- MCP token 即将过期时，关闭会话不再等待最多 15 秒刷新 token（[#10565](https://github.com/earendil-works/pi/issues/10565)）
- 全屏文本选择在切换会话或重建 transcript 时会清除，不再高亮新 transcript 中无关内容（[#9311](https://github.com/earendil-works/pi/issues/9311)、[#10567](https://github.com/earendil-works/pi/pull/10567)，[@christianklotz](https://github.com/christianklotz)）
- Bedrock 上的 OpenAI 模型现在遵循所选 thinking level，而非总使用 Bedrock 默认推理强度（[#9331](https://github.com/earendil-works/pi/issues/9331)、[#10142](https://github.com/earendil-works/pi/pull/10142)，[@jsanter27](https://github.com/jsanter27)）
- `models.json` 中模型 `headers` 现在可覆盖 Codex 请求的 `originator`、`User-Agent`（[#10429](https://github.com/earendil-works/pi/pull/10429)，[@lucasmeijer](https://github.com/lucasmeijer)）
- `server_busy` 和 `servers are currently busy` provider 错误会重试，而非结束本轮（[#10543](https://github.com/earendil-works/pi/issues/10543)）
- Mistral 响应以 `finish_reason: "error"` 结束时会触发重试（[#10487](https://github.com/earendil-works/pi/issues/10487)）
- 计算输出上限时改按每 token 3.5 个字符估算输入，减少上下文超限请求（[#10497](https://github.com/earendil-works/pi/issues/10497)）
- 组织所有者禁用的 Radius 模型不再列出
- Anthropic 浏览器登录遇到 Windows Hyper-V/WSL 保留端口（例如 53692）时，现在会自动切换到可用 loopback 端口（[#10571](https://github.com/earendil-works/pi/issues/10571)）
- 修复 OpenCode、OpenCode Go、OpenRouter、Vercel AI Gateway、Google、MiniMax 等 provider 上，长提示按分段价格计费的模型会话费用少算
- Herdr 中的 Markdown 链接现在可点击（[#10573](https://github.com/earendil-works/pi/issues/10573)）

## [1.0.4] - 2026-10-05

### 新功能

- **工具模式与 `--no-mcp`**：`--tools`、`--exclude-tools` 支持 `*`，例如 `--tools read,codemode,'mcp__radius__*'` 仅保留指定 MCP server 工具；`--tools` 默认保留 MCP 工具，除非条目以 `mcp__` 开头；`--no-mcp` 可单次关闭 MCP。参见[工具](docs/cli.md#tools)及[MCP 工具](docs/cli.md#mcp-tools)。
- **Codemode 保留图像**：`tools.read()` 读取图像会返回可由 `image()` 显示的图像块。参见[调用工具](docs/codemode.md#call-tools)。

### 新增

- `--tools`、`--exclude-tools` 支持 `*` 通配模式
- 新增 `--no-mcp`，可单次关闭内置 MCP 支持

### 修复

- 修复围栏代码块多行字符串和注释在首行之后丢失语法高亮颜色（[#10143](https://github.com/earendil-works/pi/issues/10143)）
- codemode 的 `tools.read()` 现在能读取图像并返回供 `image()` 显示的图像块（[#10251](https://github.com/earendil-works/pi/issues/10251)）
- 支持 OpenID Connect client registration 的 MCP server 现在以原生客户端身份注册，修复 OAuth `invalid_redirect_uri`（[#10493](https://github.com/earendil-works/pi/issues/10493)）
- `--tools codemode` 不再因过滤掉 MCP 工具而导致没有 MCP server；除非条目以 `mcp__` 开头，否则保留 MCP 工具
- MCP 会话关闭现在会等待正在连接的 server 完成关闭，避免 transport 留存至响应或超时（[#10249](https://github.com/earendil-works/pi/issues/10249)）
- system prompt 规则和 skills 提示不再提及 `prepareLoadout` 隐藏的工具；隐藏文件读取工具时提示不再列出工具，codemode 会在声明中显示各工具的提示指南；`ToolLoadout` 新增 `getPromptGuidelines()`（[#10343](https://github.com/earendil-works/pi/issues/10343)）
- Bedrock HTTP/2 连接停滞后出现 `The pending stream has been canceled` 时会自动重试（[#10379](https://github.com/earendil-works/pi/issues/10379)）
- codemode 脚本不能再修改内置对象（如 `Array.prototype.toJSON`）导致 Pi 崩溃或工具调用悬挂；运行前会冻结内置对象（[#10444](https://github.com/earendil-works/pi/issues/10444)）

## [1.0.3] - 2026-10-05

### 新功能

- **Azure Foundry Chat Completions**：原 `azure-openai-responses` provider 更名为 `azure`，现支持 Foundry Chat Completions 部署，首个模型为 `azure/deepseek-v4-pro`。参见[Azure OpenAI](docs/providers.md#azure-openai)。
- **Codemode 图像保存到文件**：`image()` 会将图像写入临时文件，并在结果中提供路径，供后续轮次复制或移动。参见[生成图像](docs/codemode.md#generate-images)。

### 破坏性变更

- Azure provider 从 `azure-openai-responses` 更名为 `azure`。请更新 `auth.json`（或重新 `/login`）、`models.json` 及 `settings.json` 中的 provider key（`defaultProvider`、`enabledModels` 模式、`modelThinkingLevels`）；旧 provider 会话恢复时改用其他模型，且不复用提示缓存。`AZURE_OPENAI_*` 环境变量不变（[#9714](https://github.com/earendil-works/pi/pull/9714)，[@jsanter27](https://github.com/jsanter27)）

### 新增

- 新增 Azure Foundry Chat Completions 部署，首个为 `azure/deepseek-v4-pro`（[#9645](https://github.com/earendil-works/pi/issues/9645)、[#9714](https://github.com/earendil-works/pi/pull/9714)，[@jsanter27](https://github.com/jsanter27)）

### 变更

- codemode `image()` 会将图像写入临时文件并提供路径（[#10310](https://github.com/earendil-works/pi/issues/10310)）
- 截断工具输出全文、二进制 MCP 资源和 codemode 图像等输出文件现在仅用户可读
- `Home`/`End` 始终移动编辑器光标到行首/行尾；全屏 transcript 顶部/底部改用 `Ctrl+Home`/`Ctrl+End`，不再移动编辑器光标（[#10314](https://github.com/earendil-works/pi/issues/10314)）

### 修复

- 修复 OAuth 刷新期间请求取消后，ChatGPT 等订阅登录出现 `refresh_token_invalidated`
- pnpm 全局更新删除正在运行的安装后，codemode 不再在本会话余下时间持续失败；若 Pi 在磁盘上已更新或删除，会给出重启提示（[#10439](https://github.com/earendil-works/pi/issues/10439)）
- 终端关闭或从已关闭终端恢复挂起的 Pi 时，不再因 `read EIO`/`setRawMode EIO` 崩溃并要求运行 `/bug`

## [1.0.2] - 2026-10-04

### 新功能

- **按 thinking level 配置采样参数**：`models.json` 的 `samplingParamsByThinkingLevel` 可为 OpenAI 兼容 API 配置各 thinking level 的 `temperature`、`top_p` 等参数。参见[按 thinking level 配置采样](docs/models.md#configure-sampling-by-thinking-level)。

### 新增

- `models.json` 新增 `samplingParamsByThinkingLevel`，用于配置 OpenAI 兼容 API 各 thinking level 的采样参数（[#9776](https://github.com/earendil-works/pi/pull/9776)，[@mrexodia](https://github.com/mrexodia)）

## [1.0.1] - 2026-10-03

### 新功能

- **Nix flake**：`nix run github:earendil-works/pi/stable` 运行最新版，`nix profile add github:earendil-works/pi/stable` 安装。参见[安装 pi](docs/quickstart.md#1-install-pi)。
- **MCP server 项目级覆盖**：`.pi/mcp.json` 和 `/mcp` 可为单个项目启用、禁用或调整用户级 server 暴露方式。参见[配置 server](docs/mcp.md#configure-servers)。
- **MCP Client ID Metadata Documents**：`oauth.clientRegistration: "cimd"` 允许授权服务器根据文档 URL 授权 pi，而非使用动态注册。参见[OAuth 认证](docs/mcp.md#authenticate-with-oauth)。
- **任意工具的 renderer**：`pi.registerToolRenderer()` 可渲染尚未注册的工具，例如恢复会话中的 MCP 工具。参见[工具渲染](docs/extensions.md#tool-rendering)。
- **Cloudflare Clef 分类器**：codemode 脚本和扩展可使用 `@cf/cloudflare/clef` 与 `@cf/cloudflare/clef-flash`。参见[分类器模型](docs/models.md#use-classifier-models)。

### 新增

- `/login`、`/mcp`、`/mcp login` 的 OAuth 登录界面新增复制快捷键 `app.message.copy`（默认 `ctrl+x`），浏览器无法打开或链接无法选中时可复制登录 URL
- MCP 新增 `oauth.clientRegistration: "cimd"`，通过 pi.dev 上的 Client ID Metadata Document 标识 pi，而非动态注册（[#10302](https://github.com/earendil-works/pi/issues/10302)）
- MCP server 支持用户级 server 的项目覆盖：`.pi/mcp.json` 不含 `command`/`url` 的条目可设置 `enabled`、`exposure`、`toolExposure`；`/mcp` 可为当前项目启停 server（[#10277](https://github.com/earendil-works/pi/issues/10277)）
- Cloudflare Workers AI 新增 Clef、Clef Flash 分类器，可用于 codemode 和扩展（[#10316](https://github.com/earendil-works/pi/pull/10316)，[@ndisidore](https://github.com/ndisidore)；[#10322](https://github.com/earendil-works/pi/pull/10322)，[@RealAlexandreAI](https://github.com/RealAlexandreAI)）
- 新增 `pi.registerToolRenderer()`，可为工具调用指定渲染方式，包括尚未注册的工具（[#10285](https://github.com/earendil-works/pi/issues/10285)）
- 新增 macOS/Linux Nix flake，可用 `nix run github:earendil-works/pi/stable` 运行最新版或用 `nix profile add ...` 安装。参见[安装 pi](docs/quickstart.md#1-install-pi)（[#9137](https://github.com/earendil-works/pi/pull/9137)）

### 变更

- 全局 npm 安装运行 `pi update` 时，现建议迁移到 pi.dev 安装器提供的托管安装，以锁定所有依赖
- Anthropic 对话中途新增或重定义的工具现在内联到对话中；同名工具重定义可保留提示缓存，不必重发完整工具列表

### 修复

- 将 `brace-expansion` 固定为直接依赖 5.0.12，避免安装到有安全漏洞的 5.0.9（GHSA-q2hr-2g5m-vwhr、GHSA-qhr7-859c-m2p7、GHSA-6j4f-fj2g-mc7p）（[#10288](https://github.com/earendil-works/pi/issues/10288)）
- `--models` 末尾逗号不再向模型轮换列表额外加入模型（[#10334](https://github.com/earendil-works/pi/issues/10334)）
- codemode 循环打印不再因耗尽内存令 Pi 崩溃；输出超过 16 Mi 字符或 100000 项时脚本失败（[#10283](https://github.com/earendil-works/pi/issues/10283)）
- 扩展通过 `Image` 渲染的 JPEG、GIF、WebP 现在能在 Kitty、Ghostty、WezTerm、Warp 显示（[#10292](https://github.com/earendil-works/pi/issues/10292)）
- 恢复会话及 HTML 导出中的 MCP 调用会在 server 连接后正常折叠，不再一直展开（[#10285](https://github.com/earendil-works/pi/issues/10285)）
- 修复 WezTerm 中 Kitty 全屏图像滚动后缩成单行条带（[#10319](https://github.com/earendil-works/pi/issues/10319)）
- “Selected model is at capacity” provider 错误现在会重试，不再结束本轮（[#10278](https://github.com/earendil-works/pi/issues/10278)）
- Cloudflare AI Gateway Claude 模型改用带连字符的 ID（如 `claude-opus-5-5`），修复 404
- ChatGPT 登录回调端口被其他登录占用时，现在以端口占用错误退出，不再继续并让浏览器显示 “OAuth state mismatch”（[#10265](https://github.com/earendil-works/pi/issues/10265)）
- Amazon Bedrock OpenAI 模型超过 272K 输入 token 时，现在按 models.dev 阶梯价格计费（[#10326](https://github.com/earendil-works/pi/issues/10326)）
- system prompt 或工具变更后，Amazon Bedrock Claude 不再报 `Invalid signature in thinking block`（[#10324](https://github.com/earendil-works/pi/issues/10324)）
- Together 将 DeepSeek V4 Pro 重命名为 `deepseek-ai/DeepSeek-V4-Pro-0813` 后，thinking level 控件仍可用（[#10336](https://github.com/earendil-works/pi/pull/10336)，[@cv](https://github.com/cv)）
- NVIDIA 默认模型改为当前可用的 `nvidia/nemotron-3-ultra-550b-a55b`，不再指向已停止提供的 `nvidia/nemotron-3-super-120b-a12b`

### 移除

- 发布包移除 `npm-shrinkwrap.json`，npm 安装不再锁定传递依赖，库使用者可覆盖依赖；需要固定依赖请使用 pi.dev 安装器（[#5653](https://github.com/earendil-works/pi/issues/5653)）

## [1.0.0] - 2026-10-01

### 新功能

- **默认全屏**：TUI 现默认全屏；设置 `tuiMode: "regular"` 保留终端普通滚屏。参见[终端与显示](docs/settings.md#terminal-and-display)。
- **精简 codemode**：提示 token 减少约 40%，错误信息会指导模型恢复。参见[Codemode](docs/codemode.md)。
- **Codemode 图像生成**：脚本可使用会话凭据调用 `models.generateImages()`。参见[生成图像](docs/codemode.md#generate-images)及[使用图像模型](docs/models.md#use-image-models)。
- **在 `/login` 登录 Radius**：一步完成 Radius 登录及 MCP server 配置。参见[Radius](docs/providers.md#radius)。
- **Anthropic 复制验证码登录**：浏览器运行在其他机器时也可登录。参见[交互式认证](docs/providers.md#authenticate-interactively)。
- **强化 MCP OAuth**：支持 `oauth.authServerMetadataUrl`、RFC 9207 `iss` 校验、按 server 隔离凭据，以及保留已授权 scope 的增量登录。参见[OAuth 认证](docs/mcp.md#authenticate-with-oauth)。
- **仅保留页眉的安静启动**：`quietStartup: "header"` 保留版本和快捷键提示，隐藏其他启动信息。参见[终端与显示](docs/settings.md#terminal-and-display)。

### 新增

- MCP server 新增 `oauth.authServerMetadataUrl`，可在 server 未公布或公布错误授权服务器时指定元数据文档（[#10172](https://github.com/earendil-works/pi/issues/10172)）
- 新增 `quietStartup: "header"`，保留含版本和快捷键的页眉，隐藏模型范围行和已加载资源列表
- codemode 新增 `models.generateImages()`：使用会话凭据调用图像模型（如 OpenRouter），返回由 `image()` 附加到结果的 base64 图像块；用量计入会话费用。扩展可调用 `ctx.modelRegistry.generateImages()`。参见[使用图像模型](docs/models.md#use-image-models)
- Anthropic `/login` 新增复制验证码登录，适用于浏览器在另一台机器上的无头环境（[#10194](https://github.com/earendil-works/pi/pull/10194)，[@lucasmeijer](https://github.com/lucasmeijer)）

### 变更

- TUI 默认模式改为全屏；设置 `tuiMode: "regular"` 或传入 `--tui-mode regular` 可保留终端普通滚屏
- `/login` 顶层菜单末尾新增 “Sign in with Radius” 及其状态；登录后可将 Radius MCP server 写入全局 `mcp.json`（`"auth": { "provider": "radius" }`）并重载；取消登录返回原菜单
- Provider 文档改名为 [Providers](docs/providers.md)；“Cloud Providers” 改为 “Provider Specific Config”，并将 Radius 列为首项
- MCP OAuth 凭据现在按 server 名称和 URL 保存，允许同 URL 的 server 使用不同账户；旧的仅按 URL 存储的凭据迁移到首个使用它的 server（[#10252](https://github.com/earendil-works/pi/issues/10252)）
- codemode 提示 token 大幅减少：默认工具和 codemode 启用时，GPT-5.6 请求约从 5300 token 降至 3300。`codemode` 描述精简为脚本全局变量，并链接到按需读取的 [Codemode](docs/codemode.md) 参考；工具声明说明调用方式及返回值，不再重复完整定义，system prompt 中的相关说明也缩短
- codemode 错误现在提供恢复建议：不存在的工具或 `models` 成员会提示相近名称；`models.classify()`、`models.generateImages()` 会说明参数格式；未知模型提示 `models.getAvailableOfType()`；过大的 `store()` 值会解释用途；生成图像但未展示时会提醒。通过 `typeof tools.name` 探测工具的脚本应改用 `"name" in tools`
- `/login`、`/logout` 对缺少凭据的 provider 显示 “not configured”；OAuth 浏览器页面显示彩色 Pi logo

### 修复

- MCP OAuth 登录会在交换授权码之前拒绝 `iss` 指向其他授权服务器的响应，遵循 RFC 9207
- token 响应中包含 `"scope": ""` 或其他空值/null 可选 OAuth 字段时，不再报 `Invalid scope` 等错误（[#10266](https://github.com/earendil-works/pi/issues/10266)）
- `/mcp login` 换行后的登录 URL 现在仍可点击（[#10186](https://github.com/earendil-works/pi/issues/10186)）
- 单独指定 `--provider` 而未指定 `--model` 时，不再静默运行其他 provider 的默认模型，而会报错（[#10236](https://github.com/earendil-works/pi/issues/10236)）
- MCP server 请求额外 scope（`insufficient_scope`）时，增量登录会保留之前已授权的 scope，避免反复登录却丢失原权限
- transcript 中用户消息的全角行不再重复渲染两份
- `/login`、`/logout` 仅将订阅型 OAuth provider 标为 “subscription”；Radius 等其他 OAuth 登录标为 “account”
- Apple Terminal 启动页 logo 不再出现空隙，改为显示带颜色的 Pi 字样和版本
- 恢复会话或 `/reload` 时，若 MCP server 已在下次提示前重连，`tool_search` 延迟加载的工具不再被丢弃
- 系统主题中的 Catppuccin Frappe 等柔和色板不再变得过于鲜艳，保留原色度（[#10255](https://github.com/earendil-works/pi/issues/10255)、[#10293](https://github.com/earendil-works/pi/pull/10293)，[@dgtlntv](https://github.com/dgtlntv)）
- 输入前有空格时，斜杠命令自动补全仍会触发（[#10218](https://github.com/earendil-works/pi/pull/10218)，[@haoqixu](https://github.com/haoqixu)）
- 全屏模式下，样式化 token 在鼠标选择或搜索高亮边缘结束时，不再使颜色溢出高亮范围（[#10169](https://github.com/earendil-works/pi/issues/10169)）
- transcript 不再为每条已渲染消息保留多余内存；长 assistant 消息占用的堆内存约降至之前的五分之一
