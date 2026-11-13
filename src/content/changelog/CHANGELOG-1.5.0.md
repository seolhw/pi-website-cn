## [1.5.0] - 2026-11-02

### 新功能

- **扩展更新日志**：扩展包更新后，在下次全新启动时查看变更；作者可配置日志路径，`collapseChangelog` 可折叠通知。参见[显示更新日志](docs/packages.md#show-a-changelog)。
- **更快的流式渲染**：大型工具调用改为增量解析；代码较多的回答和工具行复用语法高亮及 Markdown 渲染结果，减少重复计算。参见[保持渲染流畅](docs/tui.md#keep-rendering-responsive)。
- **自定义自更新命令**：通过 `PI_SELF_UPDATE_COMMAND` 或 `selfUpdateCommand` 使用包装脚本或其他包管理器更新 Pi。参见[自定义更新命令](docs/cli.md#custom-update-command)。
- **GPT-6.1 Terra**：可通过 OpenAI、Azure OpenAI Responses 和 OpenAI Codex 使用，支持工具搜索、中途更改 thinking level 和关闭 thinking；Codex 上下文窗口为 500K。参见[模型](docs/cli.md#models)。

### 破坏性变更

- 工具参数验证改用 `@earendil-works/pi-schema`。TypeBox 的 JSON Schema 以外功能（`Type.Refine()`、`Type.BigInt()`、`Type.Undefined()`、codec、`Format.Set()` 格式）不再用于工具参数。普通 JSON Schema 工具（包括 MCP）现在也采用与 TypeBox 工具相同的强制转换，例如数字字符串转数字、单值包装为数组。验证错误改用 pi-schema 消息，而非 TypeBox 消息。参见[工具参数 schema 与 TypeBox](docs/extensions.md#tool-parameter-schemas-and-typebox)。

### 新增

- 扩展包可在更新后显示更新日志。Pi 读取 `package.json` 中的 `pi.changelogPath`，或默认读取根目录的 `CHANGELOG.md`，并在下次全新启动时显示高于上次已读版本的条目；`collapseChangelog` 可将每个包折叠为一行（[#5958](https://github.com/earendil-works/pi/issues/5958)、[#8790](https://github.com/earendil-works/pi/pull/8790)）
- `pi.exec()` 新增 `maxBuffer` 限制 stdout 和 stderr 合计大小，结果新增表示输出是否超限的 `truncated`（[#11360](https://github.com/earendil-works/pi/issues/11360)）
- 设备码登录现在会在按 Enter 后打开验证页并复制代码；provider 可通过 `openBrowserOnConfirm: false` 和 `copyCodeOnConfirm: false` 分别关闭相应操作（[#9282](https://github.com/earendil-works/pi/issues/9282)、[#9301](https://github.com/earendil-works/pi/pull/9301)）
- `pi update` 支持通过包装脚本或其他包管理器更新。设置 `PI_SELF_UPDATE_COMMAND`（如 `mise use -g npm:{packageName}@{version}`）或全局 `selfUpdateCommand`；Pi 会在检测到新版本时执行，并填充 `{packageName}`、`{version}`、`{installSpec}`。参见[自定义更新命令](docs/cli.md#custom-update-command)（[#7756](https://github.com/earendil-works/pi/issues/7756)、[#5607](https://github.com/earendil-works/pi/issues/5607)）
- 扩展可通过注入到工具渲染上下文、消息和条目渲染器选项中的 `keyText()`、`keyHint()` 显示用户配置的快捷键。直接从 `@earendil-works/pi-coding-agent` 导入可能解析到扩展自己的副本，无法读取 Pi 快捷键；文档现建议使用注入函数（[#4748](https://github.com/earendil-works/pi/issues/4748)）
- `MarkdownTransformContext` 新增已保存会话条目的 `messageId` 和 ISO `timestamp`；实时渲染时为 `undefined`（[#7952](https://github.com/earendil-works/pi/pull/7952)）
- 内联 `ctx.ui.custom()` 新增 `blocked` 选项，让审批提示等自定义对话框报告 Pi 正在等待用户；覆盖层不受影响。参见[自定义界面和覆盖层](docs/tui.md#use-custom-screens-and-overlays)（[#11428](https://github.com/earendil-works/pi/issues/11428)）
- `Usage.cost.totalFromProvider` 用于区分 SDK 和扩展用量中的实际账单与目录估算；仅当所有组成项都来自 provider 报告时，汇总才标记为 provider 报告（[#11178](https://github.com/earendil-works/pi/pull/11178)）
- Radius 等 pi-messages provider 返回的消息新增具体 `responseModel` 元数据，包括请求虚拟模型时。参见 [AssistantMessage](docs/message-types.md#assistantmessage)（[#11265](https://github.com/earendil-works/pi/pull/11265)）
- 为 OpenAI、Azure OpenAI Responses、OpenAI Codex 新增 GPT-6.1 Terra，支持工具搜索、中途更改 thinking level 和关闭 thinking；Codex 上下文窗口为 500K

### 变更

- 扩展仍可从 `@earendil-works/pi-ai` 导入 `Type`、`Static`、`TSchema`；Pi 将其映射到 pi-ai 兼容入口及其捆绑的 TypeBox。pi-ai 本身不再重新导出 TypeBox，但其 `StringEnum` 仍为 TypeBox `TUnsafe<T>`。内置工具工厂（如 `createReadTool()`）返回 `TypeBoxAgentTool<typeof schema>`，保留 TypeBox `params` 类型
- 收紧系统提示词
- pi.dev 安装器安装的 Pi 更新时不再向 `npm ci` 传递 `--min-release-age=0`：发行 lockfile 已锁定所有包，该参数不起作用，且可能被安全扫描器阻止（[#11262](https://github.com/earendil-works/pi/issues/11262)）
- `/model` 和 `/scoped-models` 在模型名称包含 ID 中没有的额外词时，会在 ID 旁显示名称，例如 `models.json` 中重命名的模型（[#5916](https://github.com/earendil-works/pi/issues/5916)、[#11347](https://github.com/earendil-works/pi/pull/11347)）
- MCP OAuth 默认优先使用 Pi 的 Client ID Metadata Document；授权服务器不支持时则动态注册客户端。`oauth.clientRegistration: "auto"` 会在设置 `clientName` 或非默认 `callbackUrl` 时注册，`"dcr"` 始终注册；可用 `pi mcp add --oauth-client-registration` 设置（[#11426](https://github.com/earendil-works/pi/issues/11426)）
- OpenAI 默认模型从 `gpt-5.5` 改为 `gpt-6.1-sol`，包括 ChatGPT 登录后未选模型时（[#11442](https://github.com/earendil-works/pi/issues/11442)）
- 内置模型目录更新至 models.dev v2；Realtime 和纯图像模型不再作为聊天模型提供，并加入较新的 OpenAI、Google 聊天模型

### 修复

- 更新 glob 匹配，避免放大的 glob 模式造成拒绝服务
- 修复没有需信任资源（如仅有 `AGENTS.md`）的项目忽略已保存 “Do not trust” 决定的问题。现在 `trust.json` 中的决定优先，只有未保存决定时才自动信任（[#10947](https://github.com/earendil-works/pi/issues/10947)）
- 修复 Apple Terminal 将 `Shift+Enter` 发送为 `ESC` + Return 时，该快捷键被当作 follow-up 而非换行的问题；现在会检查本地 Shift 状态。未按 Shift 的 `Alt+Enter` 仍会排入 follow-up（[#11559](https://github.com/earendil-works/pi/issues/11559)）
- 修复普通 TUI 模式运行期间 Rex 和 iTerm2 中的 OSC 7501 工作状态消失的问题；普通模式不再输出会被终端误认作新 Shell 提示符的 OSC 133 标记（[#11519](https://github.com/earendil-works/pi/issues/11519)）
- 修复 SDK 会话的压缩、分支和错误报告摘要将存储的 OAuth token 当作显式 API key 传给模型的问题；现在会正确使用 OAuth 登录（[#11520](https://github.com/earendil-works/pi/issues/11520)）
- 修复扩展以不同顺序设置相同活动工具时系统提示词重复更新；保留仍启用工具的原顺序，新启用工具追加在末尾（[#11495](https://github.com/earendil-works/pi/issues/11495)）
- 修复 `pi.exec()` 输出过大时因 `RangeError: Invalid string length` 崩溃。默认上限取 256 MiB 和运行时字符串上限中的较小值；超过后终止命令并返回 `truncated: true` 和非零退出码（[#11360](https://github.com/earendil-works/pi/issues/11360)）
- 命令超时或中止后若忽略 SIGTERM，`pi.exec()` 现在会在 5 秒后发送 SIGKILL
- 修复 agent 目录通过符号链接访问时 `pi install`/`pi remove` 令 `package-lock.json` 不断增加嵌套条目的问题；现在会将解析后的真实路径交给 npm（[#11358](https://github.com/earendil-works/pi/issues/11358)）
- MCP 登录拒绝非 `http:`/`https:` 的授权端点和 OAuth 元数据 URL，避免恶意 server 通过 `file:` 或自定义协议调用系统 URL 处理程序
- 自动下载 `fd`、`rg` 时不再为 ARM32 等无预编译版本的架构下载 x86-64 二进制；改为警告并建议通过系统包管理器安装（[#11209](https://github.com/earendil-works/pi/issues/11209)）
- 修复 `/model` 模糊搜索将散落字符匹配排在真正匹配项之前的问题，例如搜索 `opus` 时不再把 `gpt-oss-120b` 和 `claude-sonnet-4.5` 排在 `claude-opus-4.1` 前面（[#11220](https://github.com/earendil-works/pi/issues/11220)、[#11296](https://github.com/earendil-works/pi/pull/11296)）
- 修复 `/resume` 搜索在会话消息和 ID 任意位置模糊匹配的问题，例如 `1024` 不再匹配 UUID 中的数字片段。会话名称和工作目录仍可模糊匹配；ID、消息文本改为精确子串匹配（[#11220](https://github.com/earendil-works/pi/issues/11220)、[#11024](https://github.com/earendil-works/pi/issues/11024)、[#11296](https://github.com/earendil-works/pi/pull/11296)）
- 修复包含数千条记录的会话导出为 HTML 后显示空白页（[#11225](https://github.com/earendil-works/pi/issues/11225)、[#11293](https://github.com/earendil-works/pi/pull/11293)）
- HTML 导出现在包含 system prompt、工具以及 `/reload` 后的 system 区块更新（[#11261](https://github.com/earendil-works/pi/issues/11261)、[#3464](https://github.com/earendil-works/pi/issues/3464)、[#11290](https://github.com/earendil-works/pi/pull/11290)）
- 修复 macOS 中止 bash 命令后偶尔仍执行命令列表后续步骤（如 `long_step; next_step`）；现在会先停止整个进程组（[#11252](https://github.com/earendil-works/pi/issues/11252)、[#11289](https://github.com/earendil-works/pi/pull/11289)）
- 修复流式大型工具调用每个 delta 都重新解析累计参数造成的 CPU 和内存开销：provider 和代理流每个 delta 只解析一次；grammar 工具不再复制全部输入；交互式渲染器每帧最多运行一次（[#9265](https://github.com/earendil-works/pi/issues/9265)）
- 登录对话框不再打开非网页 URL，或将 URL 中的控制字符输出到终端，以免破坏超链接或注入转义序列
- 修复 `tui.select.pageUp`/`pageDown` 在自动补全、`/settings` 及模型、登录、分支、MCP、llama.cpp 等选择器中被忽略的问题。全屏下菜单打开时翻页键移动菜单而非滚动对话记录；绑定为 Ctrl+V 的翻页键也会翻动自动补全菜单（[#7629](https://github.com/earendil-works/pi/issues/7629)，基于 [#7680](https://github.com/earendil-works/pi/pull/7680)，[@muyiyr](https://github.com/muyiyr)）
- 修复工具及 `!` 命令输出将 `ESC[<...`、`ESC[=...`、`ESC[>...` 等控制序列参数误显示为文本的问题；键盘模式 `ESC=`、`ESC>` 后的文本仍会保留（[#11377](https://github.com/earendil-works/pi/issues/11377)）
- 修复 `pi -e npm:<pkg>` 总停留在首次下载版本的问题；启动和 `/reload` 时会检查 registry 并更新未锁定版本。`pi -e git:<repo>@<branch>` 也会重新获取并重置到分支；固定 commit 不重新获取。离线或检查失败时沿用缓存（[#11375](https://github.com/earendil-works/pi/issues/11375)、[#11590](https://github.com/earendil-works/pi/pull/11590)）
- 修复 Windows 路径区分大小写导致 skills 重复加载、项目可信状态重复询问、会话无法恢复及 `pi remove` 无法匹配本地包的问题（[#10488](https://github.com/earendil-works/pi/issues/10488)）
- 修复主目录相邻路径出现错误 `~` 前缀，例如 `/home/me2/project` 显示为 `~2/project`
- 修复 `pi mcp login -l`/`logout -l` 不接受 `-l` 的问题；现在它们会要求目标 server 为项目级。未知选项会原样显示，拼错 server 名时会建议正确名称
- 修复仅安装在 `PNPM_HOME` 下的程序被误报为非全局 pnpm 安装；现在只有实际由该包管理器管理时才显示其名称（[#7756](https://github.com/earendil-works/pi/issues/7756)）
- 修复 WSL 深层路径下图像粘贴、复制和登录浏览器静默失败：Windows 辅助程序现在从 `/` 启动，避免 `\\wsl.localhost\...` 路径超过 260 字符（[#11592](https://github.com/earendil-works/pi/issues/11592)）
- 外部编辑器启动失败时现在会显示状态消息，例如 `External editor exited with code 1; prompt unchanged`（[#11592](https://github.com/earendil-works/pi/issues/11592)）
- 修复 `tool_search`/`searchTools()` 的工具排名：匹配更多查询词、工具名与完整工具名匹配会获得更高排名，长 server 指令不会压低其工具排名（[#11331](https://github.com/earendil-works/pi/issues/11331)）
- 修复 `tool_search`/`searchTools()` 无法搜索中文、日文、泰文等非 ASCII 文本的问题；现在支持任意文字系统、无空格文本分词，以及 `café`/`cafe\u0301` 等规范等价文本匹配（[#10816](https://github.com/earendil-works/pi/issues/10816)、[#11037](https://github.com/earendil-works/pi/pull/11037)，[@haoqixu](https://github.com/haoqixu)）
- 修复 Windows 上其他 Pi 进程占用 git 扩展文件时，`git clean -fdx failed with code 1` 令更新中断的问题。现在会发出警告、继续安装依赖，并在下次更新时重试清理（[#11597](https://github.com/earendil-works/pi/issues/11597)）
- 修复两个 Pi 进程通过不同路径（例如符号链接）同时刷新同一 `auth.json` 的竞态；认证锁现在按解析后的真实路径共享（[#11655](https://github.com/earendil-works/pi/issues/11655)）
- 修复每次重绘都重复高亮同一工具代码的问题；代码、主题或语法规则未变化时复用现有高亮，流式 assistant 消息也会保留已渲染 Markdown（[#10971](https://github.com/earendil-works/pi/issues/10971)）
- 修复缩放照片总以较大的 PNG 发送导致请求失败或超时的问题；现在优先尝试较小编码格式（[#11551](https://github.com/earendil-works/pi/issues/11551)）
- 修复 npm 过期元数据导致软件包停留旧版本时，`pi update --extensions` 仍报告成功的问题；现在会显示已安装和预期版本（[#11536](https://github.com/earendil-works/pi/issues/11536)）
- Skill 验证警告现在显示在 `[Skill warnings]`，不再被误标为 `[Skill conflicts]`（[#11521](https://github.com/earendil-works/pi/issues/11521)）
- 修复 codemode 工具描述每次都包含冗长联合类型的问题；对象联合显示字段和判别字段，其他多行类型提示用 `describeTool()` 查看完整声明（[#11501](https://github.com/earendil-works/pi/issues/11501)）
- 修复全屏模式退出后模型范围通知留在 Shell 中；现在显示在 Pi 全屏标题栏（[#11508](https://github.com/earendil-works/pi/issues/11508)）
- 工作目录已删除时启动 Pi 现在会提示切换到有效目录，不再因 `uv_cwd` 崩溃（[#11509](https://github.com/earendil-works/pi/issues/11509)）
- 修复会话写入失败后，内存中残留无磁盘对应项，导致恢复会话缺失历史和工具的问题（[#11460](https://github.com/earendil-works/pi/issues/11460)）
- 修复 `/tree` 分支摘要忽略会话 thinking level 并触发不支持 `none` effort 的问题（[#11444](https://github.com/earendil-works/pi/issues/11444)）
- 修复空的隐藏 thinking 标签仍在答案和工具调用前产生空行（[#11402](https://github.com/earendil-works/pi/issues/11402)）
- 修复包安装/移除时输出 npm audit 和资助提示（包括可能在包目录内再安装 Pi 的 `npm audit fix` 建议）的问题（[#11409](https://github.com/earendil-works/pi/issues/11409)）
- 修复对话框打开时替换扩展编辑器会隐藏且无法响应的问题；新编辑器会在对话框关闭后出现（[#11431](https://github.com/earendil-works/pi/issues/11431)）
- 修复文件使用单独 CR 换行时，`grep` 上下文与 ripgrep 行号错位（[#11398](https://github.com/earendil-works/pi/issues/11398)）
- 修复 provider ID 含斜杠时 `--model <provider>/<id>` 失败（[#11394](https://github.com/earendil-works/pi/issues/11394)）
- 修复在文件打开较慢的文件系统上创建会话分支缓慢；现通过单一文件句柄写入（[#11253](https://github.com/earendil-works/pi/issues/11253)）
- 修复 `pi.exec()` 在 stdout/stderr 分块边界破坏 UTF-8 字符（[#11312](https://github.com/earendil-works/pi/issues/11312)）
- 命令无法启动时 `pi.exec()` 现在会保留 spawn 错误，而非返回空 stderr（[#11257](https://github.com/earendil-works/pi/pull/11257)，[@muyiyr](https://github.com/muyiyr)）
- 配置包安装失败不再导致启动崩溃：启动时跳过并警告，后续启动或 `/reload` 重试；显式安装/更新仍以非零状态失败（[#11304](https://github.com/earendil-works/pi/pull/11304)，[@Lincoln504](https://github.com/Lincoln504)）
- 修复 todo 扩展示例在工具参数验证失败时导致 TUI 崩溃（[#8057](https://github.com/earendil-works/pi/pull/8057)，[@cyzlmh](https://github.com/cyzlmh)）
- 因安全公告，将 `undici` 更新到 8.12.3，Gondolin 扩展示例更新到 0.14.0
- 修复 OpenRouter 在 Chat Completions/Anthropic Messages 中使用目录估值而非账单数据的问题；BYOK 汇总包含 OpenRouter 收费和上游报告费用，分项仍按目录估算（[#9980](https://github.com/earendil-works/pi/issues/9980)）
- OpenCode Zen/Go 请求改用各自协议对应的 OpenAI、Anthropic、Google 和 System One 端点，而非共享端点（[#11434](https://github.com/earendil-works/pi/pull/11434)，[@vimtor](https://github.com/vimtor)）
- Zhipu/Z.ai 用量上限错误代码 `1308` 不再被当作可重试 HTTP 429（[#11537](https://github.com/earendil-works/pi/issues/11537)）
- LiteLLM 的 `ContextWindowExceededError` 现在会识别为上下文溢出（[#11492](https://github.com/earendil-works/pi/issues/11492)）
- Gemini 工具 schema 将不支持的 `const` 转为单值 `enum`，同时保留默认值、示例、枚举字面数据以及 `__proto__` 属性（[#11308](https://github.com/earendil-works/pi/issues/11308)）
- 修复 faux provider 将模拟缓存写入 token 同时计入输入和缓存写入
- Orca 终端现识别真彩色、超链接，以及通过 `ORCA_IMAGE_PROTOCOL=kitty` 声明的 Kitty 图像支持（[#9329](https://github.com/earendil-works/pi/pull/9329)，[@XRX193](https://github.com/XRX193)）
- 裸 Markdown URL 不再吞掉后续 CJK 标点和文本；显式链接及尖括号自动链接不受影响（[#10934](https://github.com/earendil-works/pi/pull/10934)，[@haoqixu](https://github.com/haoqixu)）
- 修复 Kitty F1–F12（包括修饰键）未识别，以及 F13+ 等功能键插入不可见字符（[#11419](https://github.com/earendil-works/pi/issues/11419)、[#11345](https://github.com/earendil-works/pi/issues/11345)）
- Kitty 图像首行滚出全屏视口后，在带内边距或颜色的框内仍会正确裁切显示
- 修复深层嵌套 Markdown 引用块造成指数级行数、渲染卡死或崩溃（[#11272](https://github.com/earendil-works/pi/issues/11272)）
- 修复 Claude 在 system 更新后收到空回复或纯推理回复时因 system 角色顺序错误失败（[#11091](https://github.com/earendil-works/pi/issues/11091)）
- 修复组织将 effort 限制在 `high` 以下时，Claude 中途更改 thinking level 失败（[#10063](https://github.com/earendil-works/pi/issues/10063)）
- Kimi K3.1 Pro 在 Kimi Coding、Moonshot、OpenCode Go 上现使用正确请求设置、保留 thinking、支持中途添加工具和 K3 定价
- 修复 OpenCode DeepSeek V4.1 Flash 在长缓存保留时发送不支持的 `prompt_cache_retention`
- 修复切换自曾调用工具的模型后 GPT-5.4/5.5 报 `Missing namespace for function_call`（[#11415](https://github.com/earendil-works/pi/issues/11415)）
- Bedrock Claude 的首选 strict 工具超限时现在会以非 strict 重试一次，并保留必须 strict 的工具（[#11416](https://github.com/earendil-works/pi/issues/11416)）
- OpenRouter 的 `~anthropic/claude-*-latest` 别名改用 Anthropic Messages API，避免工具调用后丢失先前 thinking（[#9534](https://github.com/earendil-works/pi/issues/9534)）
- 修复终端标题控制字符注入转义序列，以及 pi-messages 流接受无效 content block 索引
- 全屏双击选择路径和 token 时，`~`、`.`、`\`、`+` 不再错误分割；规则与 iTerm2 默认一致（[#10980](https://github.com/earendil-works/pi/issues/10980)）
- 超宽显示数学公式不再因换行而破碎，改为显示原始 LaTeX（[#11483](https://github.com/earendil-works/pi/issues/11483)）
- 修复样式化单词恰好到达换行边界时下一行多空格、删除线延伸到补白（[#10925](https://github.com/earendil-works/pi/issues/10925)）
- `/tree` 分支摘要现在会遵循上下文编辑，排除失败的 assistant 回复及已隐藏或替换的原始内容（[#11602](https://github.com/earendil-works/pi/issues/11602)）

### 移除

- 移除原生 OS `sandbox/` 扩展示例及依赖；改用 [Gondolin 示例](examples/extensions/gondolin/)或[容器化指南](docs/containerization.md)

## [1.4.0] - 2026-10-21

### 新功能

- **分类器图像输入**：`models.classify()` 现在可向 `typesafe`、`cloudflare-workers-ai` 和 OpenRouter 上的 TypeSafe Jev、Cloudflare Clef 模型传入 `images`。参见[分类器模型](docs/models.md#use-classifier-models)和 [Codemode](docs/codemode.md#models)。
- **模型配置参考**：根据 schema 生成，列出 `models.json` 中各 provider、模型、覆盖项和兼容字段。参见[模型配置](docs/models-configuration.md)。
- **摘要不再受固定输出上限限制**：压缩和分支摘要使用模型输出上限，避免长推理导致失败。参见[压缩](docs/compaction.md#compaction)。
- **Codemode 等待可用 worker**：并行脚本和进程内 subagent 会排队等待，不再因 worker 忙碌失败；可用 `PI_CODEMODE_MAX_WORKERS` 提高上限。参见[限制](docs/codemode.md#limits)。
- **Rex 终端支持**：OSC 8 超链接、真彩色及内嵌图像。

### 新增

- 新增由 `models.json` schema 自动生成的模型配置参考，列出 provider、模型、覆盖项和兼容字段（[#10790](https://github.com/earendil-works/pi/issues/10790)）
- `models.classify()` 在 `typesafe`、`cloudflare-workers-ai` 和 OpenRouter 上支持 TypeSafe Jev、Cloudflare Clef 的 `images` 参数；Workers AI 目录新增 Clef Omni 和 Jev 1.14
- `models.json` provider 级 `compat` 现在也适用于分类器模型，并支持 System One 的 `imageInput`、`sendImageOptInHeader`；扩展分类器模型也可配置 `compat`
- `minimax` 和 `minimax-cn` 新增 `MiniMax-M3.1-Flash`，支持 low 至 max thinking levels（[#11121](https://github.com/earendil-works/pi/issues/11121)）
- 新增 Rex 终端的 OSC 8 超链接、真彩色和内嵌图像支持（[#11131](https://github.com/earendil-works/pi/issues/11131)、[#11150](https://github.com/earendil-works/pi/pull/11150)，[@petrroll](https://github.com/petrroll)；[#11183](https://github.com/earendil-works/pi/pull/11183)，[@nihaals](https://github.com/nihaals)）

### 变更

- provider 归属请求头改由 pi-ai 客户端身份生成。扩展 `before_provider_headers` 不再看到 OpenRouter、NVIDIA NIM、OpenCode 归属头，但仍可返回 `null` 删除请求头。Cloudflare 请求和工具下载的 GitHub release 检查改发 Pi 详细 `User-Agent`（而非 `pi-coding-agent`）；启用归属时 OpenCode 总会发送 `x-opencode-client`
- `generateSummary()` 与 `generateSummaryWithUsage()` 忽略 `reserveTokens`，摘要请求使用模型输出上限
- GitHub Copilot 默认模型从已退役的 `gpt-5.4` 改为 `gpt-6.1-sol`
- NVIDIA 默认模型改为 `nvidia/nemotron-3.5-super-vl-120b-a12b`（[#10910](https://github.com/earendil-works/pi/pull/10910)，[@cv](https://github.com/cv)）
- `xiaomi` 和 Xiaomi Token Plan 默认模型改为 `mimo-v2.6-pro`，因为 `mimo-v2.5-pro` 已退出目录
- `xai` 的 Grok 4.3、4.5 新增 `xhigh` thinking level
- ChatGPT Business 工作区的用量限额错误不再重试，并提示联系工作区管理员提高上限

### 修复

- 压缩和分支摘要现在使用模型输出上限；`compaction.reserveTokens` 仅决定何时开始压缩，修复推理耗尽固定摘要上限导致 “generation hit the token cap”（[#9512](https://github.com/earendil-works/pi/issues/9512)、[#9075](https://github.com/earendil-works/pi/issues/9075)）
- `models.schema.json` 补齐 provider、model 字段说明，以便编辑器显示提示（[#10790](https://github.com/earendil-works/pi/issues/10790)）
- 修复带 UTF-8 BOM 的 `managed-install.json` 导致 `pi update` 报 “Managed install marker is missing or invalid”；Windows PowerShell 5.1 重写文件时可能添加 BOM
- HTML 导出中 CJK 标点旁的 Markdown 粗体、斜体不再显示字面星号（[#3353](https://github.com/earendil-works/pi/issues/3353)、[#10154](https://github.com/earendil-works/pi/issues/10154)）
- Pi 异常退出时会恢复鼠标跟踪、焦点报告、Kitty 键盘和备用屏幕模式，避免 Shell 被转义序列刷屏（[#11170](https://github.com/earendil-works/pi/issues/11170)）
- 修复交互模式同时打开多个扩展对话框或内联组件时后一个覆盖前一个、前一个 Promise 悬挂的问题；关闭当前对话框后会恢复之前的对话框（[#11166](https://github.com/earendil-works/pi/issues/11166)、[#9909](https://github.com/earendil-works/pi/issues/9909)）
- Linux 上在 Pi 内复制文本后按 Ctrl+Z 挂起，Shell 粘贴不再卡住；后台剪贴板服务进程不再与 Pi 一同挂起（[#11179](https://github.com/earendil-works/pi/issues/11179)）
- codemode worker 全忙时，脚本现在最多等待 60 秒获取空闲 worker；`PI_CODEMODE_MAX_WORKERS` 可提高默认的两个 worker 上限（[#11184](https://github.com/earendil-works/pi/issues/11184)）
- 扩展可通过加载器别名和虚拟模块导入 `@earendil-works/pi-ai/models`（如使用 `clampThinkingLevel`），修复扩展无法加载的问题（[#11156](https://github.com/earendil-works/pi/issues/11156)）
- 以 UTF-8 BOM 开头的 `mcp.json` 现在可以正确解析（[#11191](https://github.com/earendil-works/pi/issues/11191)）
- 修复 `/compact <instructions>` 在压缩跨越轮次边界时忽略指令的问题（[#11058](https://github.com/earendil-works/pi/issues/11058)）
- 恢复会话和 `/tree` 导航时，扩展工具不再因分支记录早于工具注册而保持停用；分支未显式增删的扩展工具默认启用，除非设置 `defaultActive: false`（[#11062](https://github.com/earendil-works/pi/issues/11062)、[#11075](https://github.com/earendil-works/pi/issues/11075)）
- 修复输出截断后工具调用缺失、但工具结果保留导致恢复会话后续请求全失败（[#11227](https://github.com/earendil-works/pi/issues/11227)、[#11233](https://github.com/earendil-works/pi/pull/11233)，[@petrroll](https://github.com/petrroll)）
- grep 现在使用 `rg --no-config`，避免 `RIPGREP_CONFIG_PATH` 中的 `--fixed-strings` 等设置悄悄更改搜索语义（[#11203](https://github.com/earendil-works/pi/issues/11203)、[#11230](https://github.com/earendil-works/pi/pull/11230)，[@petrroll](https://github.com/petrroll)）
- Windows Shell 检测现在支持可运行的 Microsoft Store Shell 别名（[#9504](https://github.com/earendil-works/pi/pull/9504)，[@petrroll](https://github.com/petrroll)）
- Windows Shell 检测现在会在 `PATH` 外查找 PowerShell 和旧版 WSL `bash.exe`；检查 `%ProgramFiles%\PowerShell\7`、`%SystemRoot%\System32\WindowsPowerShell\v1.0`、`%SystemRoot%`（[#9501](https://github.com/earendil-works/pi/pull/9501)，[@petrroll](https://github.com/petrroll)）
- GitHub Copilot 大请求（如包含许多图像）遇到 HTTP 413 时会压缩并重试（[#11016](https://github.com/earendil-works/pi/pull/11016)，[@petrroll](https://github.com/petrroll)）
- `openai-codex` 不再列出 ChatGPT 账户无法使用的 `gpt-5.5` 和 `gpt-5.3-codex-spark`（[#11173](https://github.com/earendil-works/pi/pull/11173)，[@lucasmeijer](https://github.com/lucasmeijer)）
- 仅含空白的工具输出（如 bash 的 `\r\n`）不再令 OpenAI Completions、Responses 和 Google 请求返回 400（[#8720](https://github.com/earendil-works/pi/issues/8720)）
- 扩大自动重试覆盖的网关故障、Codex 代理的断流错误和 Google Vertex 临时 OAuth 刷新错误；不再因 request ID 或字节数中的数字误重试（[#10920](https://github.com/earendil-works/pi/issues/10920)、[#11057](https://github.com/earendil-works/pi/issues/11057)、[#10996](https://github.com/earendil-works/pi/issues/10996)）
- OpenAI Responses 延迟加载工具时移除工具后，不再清空提示缓存（[#10940](https://github.com/earendil-works/pi/issues/10940)）
- Cloudflare Workers AI 分类器价格修正：Clef Flash 为每百万输入 token $0.038，Jev 为 $0.042，不再误标 Jev 免费
- 未闭合的 `$$` 显示数学区块不再吞掉后续 Markdown 表格（[#11159](https://github.com/earendil-works/pi/issues/11159)）
- Markdown 粗体和斜体现在可紧邻 CJK 标点显示（[#10730](https://github.com/earendil-works/pi/pull/10730)，[@theBucky](https://github.com/theBucky)）
- `@` 文件补全查询包含 `[`、`(` 等正则元字符时仍可返回结果（[#10972](https://github.com/earendil-works/pi/issues/10972)）

## [1.3.0] - 2026-10-15

### 新功能

- **选择 `/share` 上传目标**：通过 `sessionShareDestination` 选择 `auto`、`gist` 或 `radius`。参见[会话和上下文](docs/settings.md#sessions-and-context)和[导出或分享会话](docs/sessions.md#export-or-share-a-session)。
- **OpenAI GPT-6 中途更改 thinking level 时保留提示缓存**（API key 登录）。
- **通过 Chat Completions 使用 Kimi Code**：对话中途新增工具不再使提示缓存失效；`models.json` 的 base URL 覆盖项现在必须包含 `/v1`。参见[Providers](docs/providers.md)。
- **切换模型时清理 thinking**：不再把旧模型的 thinking 当文本展示给新模型。
- **恢复会话保留活动工具**：`--tools +name`/`-name` 在已有工具上应用。参见[工具](docs/settings.md#tools)。

### 新增

- OpenAI GPT-6 API key 会话中途更改 thinking level 现在保留提示缓存（[#10853](https://github.com/earendil-works/pi/issues/10853)）
- 新增 `sessionShareDestination`，用于选择 `/share` 上传到自动目标、GitHub gist 或 Radius（[#10870](https://github.com/earendil-works/pi/issues/10870)，[@vegarsti](https://github.com/vegarsti)）

### 变更

- `kimi-coding` provider 改用官方 Kimi Code 客户端使用的 OpenAI Chat Completions：`https://api.kimi.com/coding/v1`。K3、K3-256K 和 Kimi For Coding 中途新增工具不再清除提示缓存；`models.json` 的 base URL 覆盖项必须包含 `/v1`（[#10720](https://github.com/earendil-works/pi/issues/10720)）
- 切换模型时丢弃由其他模型生成的早期 assistant thinking block，而不将其作为普通文本发送，避免新模型看到旧模型推理或把自身推理写入可见答案（[#10995](https://github.com/earendil-works/pi/issues/10995)）

### 修复

- Pi 内部依赖固定为精确发行版版本，避免全新安装混用不兼容版本（[#10865](https://github.com/earendil-works/pi/issues/10865)）
- 恢复会话现在会恢复会话期间启用的工具，并叠加应用 `--tools +name`/`-name`；显式使用工具名 `--tools`、`--no-tools` 或 `--no-builtin-tools` 时除外（[#10785](https://github.com/earendil-works/pi/issues/10785)）
- 修复 Bun 上中止 codemode 脚本或到达截止时间时，仍等待不可中断内置函数返回（[#10748](https://github.com/earendil-works/pi/issues/10748)）
- 修复 codemode 重复超时/中止后遗留 worker；现在跨会话最多允许两个存活 worker，取消后未实际退出的 worker 仍计入上限（[#10748](https://github.com/earendil-works/pi/issues/10748)）
- `--model` 遇到多个 provider 提供匹配模型时不再按目录顺序任意选择；优先选择有凭据的 provider，否则报告歧义。`--models`/`enabledModels` 会为各 provider 分别添加，并提示歧义（[#10160](https://github.com/earendil-works/pi/issues/10160)）
- 修复 TUI、会话树、HTML 导出和示例中的 `read` 行范围标签处理数字字符串或 null 参数的问题（[#9887](https://github.com/earendil-works/pi/issues/9887)）
- 修复 provider 更换 API 后 Nix flake 构建失败：模型目录分组变化时刷新 catalog pin；发行版使用最新 catalog 构建后再打 tag（[#10985](https://github.com/earendil-works/pi/issues/10985)）
- Nix 包不再将自带 Node.js 放在 `PATH` 首位，避免 bash 工具 Shell 使用 Pi Node 而非用户安装的 `node`/`npm`；Pi Node 只作为后备（[#10519](https://github.com/earendil-works/pi/issues/10519)）
- 提示模板保留 `""`、`''` 等空引号参数，避免后续位置参数错位、默认值不生效（[#10867](https://github.com/earendil-works/pi/issues/10867)）
- 修复 Nix 包安装检查仍要求 Pi 已不再依赖的 chord 和 esbuild，导致构建失败
- 工具调用参数字符串含 `\usepackage` 等无效 `\u` 转义时，不再丢弃后续字段（[#10868](https://github.com/earendil-works/pi/issues/10868)）
- Anthropic/Bedrock Claude 错误工具结果含图像时不再返回 400；图像会在本轮工具结果之后发送，模型仍可读取（[#10794](https://github.com/earendil-works/pi/issues/10794)）
- OpenCode Go Gemini 404 修复：OpenCode Zen/Go 切换到 `opencode.ai/inference`，并为 OpenCode Go 添加 Google Generative AI 支持
- OpenCode Go MiniMax M2.7 改用 Anthropic Messages API，修复 “Model does not support this protocol”
- 网关返回 `Unable to forward upstream stream` 时触发自动重试（[#10920](https://github.com/earendil-works/pi/issues/10920)）
- `The service is temporarily unavailable` 现在会自动重试，修复压缩首次尝试失败（[#10965](https://github.com/earendil-works/pi/issues/10965)）
- LiteLLM 在同一流块同时发送 reasoning 和 content 时，OpenAI 兼容响应不再把 thinking 显示在答案后面（[#10926](https://github.com/earendil-works/pi/issues/10926)）
- 修复 Google Vertex Gemini 4 Argon 报 “Thinking budget is not supported”，以及 Gemini API 忽略 thinking level（[#10890](https://github.com/earendil-works/pi/issues/10890)）
- Xiaomi MiMo 在 `minimal` thinking level 下不再返回 400；仅提供 `off`、`high`（[#10818](https://github.com/earendil-works/pi/issues/10818)）
- `openai-codex/gpt-6.1-sol` 上下文窗口改为 Codex 提供的 500K，而非 272K（[#10840](https://github.com/earendil-works/pi/issues/10840)）
- 工具调用最终参数不是合法 JSON 时，不再用错误前解析出的部分字段静默执行；现在会验证失败，并向模型展示原始参数（[#10897](https://github.com/earendil-works/pi/issues/10897)）
- Claude Haiku 5.5、Opus 5 现在支持 `off` thinking level（[#10753](https://github.com/earendil-works/pi/issues/10753)）
- 扩展调用 `ctx.ui.custom({ overlay: true })` 的 `done()` 现在关闭自身覆盖层，而非最上层覆盖层，避免已完成覆盖层残留及其他扩展对话框悬挂（[#10648](https://github.com/earendil-works/pi/issues/10648)、[#10999](https://github.com/earendil-works/pi/pull/10999)，[@masonc15](https://github.com/masonc15)）
