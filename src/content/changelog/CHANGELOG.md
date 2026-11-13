# 更新日志

## [Unreleased]

### 修复

- 修复扩展仅在 `session_start` 中停用自身工具（pi-web-access 和 pi-subagents 在 `toolActivation: "auto"` 模式下会这样做）时，`tool_search` 加载的 MCP 工具在恢复会话或执行 `/reload` 后被丢弃的问题（[#11996](https://github.com/earendil-works/pi/issues/11996)
- 修复独立可执行文件无法解析扩展 npm 依赖项入口的问题：当依赖的 `package.json` 通过 `main` 或 `exports` 声明入口（如 `shiki`、`yaml`、`graceful-fs`）时，包括从其他依赖内部导入的情况（[#12012](https://github.com/earendil-works/pi/issues/12012)）
- 修复 `find` 工具无法匹配以 `./` 开头的模式的问题，例如 `./src/*.ts`（[#12020](https://github.com/earendil-works/pi/issues/12020)）
- 修复打开文件期间取消 `read` 工具调用时，Pi 因未捕获的 `AbortError` 退出的问题（[#11956](https://github.com/earendil-works/pi/issues/11956)）
- 修复会话选择器跳过非会话 `.jsonl` 文件后取消加载时，Pi 因未捕获的 `AbortError` 退出，以及这些文件仍保持打开状态的问题（[#11956](https://github.com/earendil-works/pi/issues/11956)）
- 修复 GitHub CLI 启动失败时 `/share` 导致 Pi 崩溃的问题
- 修复 Windows 托管安装中，系统旧版 Node.js 在 PATH 中排在安装器自带 Node.js 前面时，`pi update` 因 “Could not verify managed Pi” 失败的问题（[#12048](https://github.com/earendil-works/pi/issues/12048)）
- 修复 `/export` 生成的 HTML 在自定义工具输出链接旁显示原始终端超链接转义序列的问题；现在链接可点击（[#12003](https://github.com/earendil-works/pi/issues/12003)）

## [1.5.2] - 2026-11-10

### 新功能

- **为原目录已不存在的会话创建分支**：如果会话原先所在的目录已移动或删除，现在可以将会话分支到当前目录，而不只是继续会话；之后恢复时也不会再询问。参见[继续或切换会话](docs/sessions.md#continue-or-switch-sessions)。

### 变更

- 当会话工作目录不存在时（例如项目目录已重命名），交互模式现在提供 `Continue`、`Fork` 或 `Cancel`，而不再只能继续。`Continue` 和之前一样在当前目录运行会话，但不保存选择；`Fork` 会像 `--fork` 一样将会话复制到当前目录并分配新 ID，从而避免下次恢复时再次询问。此行为适用于启动参数（`--session`、`--resume`）、`/resume`、`/import`，以及扩展中的 `ctx.switchSession()`（[#11975](https://github.com/earendil-works/pi/pull/11975)，[@petrroll](https://github.com/petrroll) 提交；修复 [#11060](https://github.com/earendil-works/pi/issues/11060)）

### 修复

- 修复导入工作目录已不存在的会话时，在会话目录留下副本；继续该会话时又产生相同 ID 的第二份副本（`s.jsonl` 和 `s-1.jsonl`）的问题。现在导入失败时会删除副本（[#11975](https://github.com/earendil-works/pi/pull/11975)，[@petrroll](https://github.com/petrroll) 提交；修复 [#11060](https://github.com/earendil-works/pi/issues/11060)）
- 修复 Anthropic OAuth 请求报告的 Claude Code 版本过旧的问题

## [1.5.1] - 2026-11-09

### 新功能

- **Shell 登录与登出**：无需启动会话即可运行 `pi auth login <provider>` 和 `pi auth logout <provider>`，支持 API key 和无浏览器登录。参见[凭据命令](docs/cli.md#credential-commands)。
- **空闲时预热提示缓存**：符合条件的缓存现在最长可在两次运行之间保持 30 分钟；仅当预期收益足以抵消刷新成本时才会预热。参见 [`cacheWarming`](docs/settings.md#model-and-thinking)。
- **Anthropic 消息线程**：请求只发送新增消息，服务端继续已有对话；若之前的上下文发生变化，则回退为发送完整请求。参见 [Anthropic 兼容性](docs/models-configuration.md#anthropic-messages)。
- **更丰富的 Mermaid 图表**：支持饼图、作者定义的样式、部分终端可点击的标签，以及展开的分支摘要和压缩摘要中的图表。参见[显示设置](docs/settings.md#terminal-and-display)和 [Markdown 转换器](docs/extensions.md#piregistermarkdowntransformertransformer-options)。
- **GitHub Copilot 分类器**：通过 codemode 的 `models.classify()` 调用 Microsoft-Decision-1，获得类型化决策和概率。参见[使用分类器模型](docs/models.md#use-classifier-models)。
- **软件包更新摘要**：`pi update --extensions` 会报告每个软件包的 npm 版本或 git 提交变化，并区分未变更、跳过和警告状态。参见[更新 Pi 或软件包](docs/cli.md#update-pi-or-packages)。

### 破坏性变更

- 自定义 `GrepOperations.readFile` 回调不再用于读取上下文行。该字段仍被接受，但已变为可选并弃用，以便现有集成继续编译。grep 工具现在从 ripgrep 获取上下文行，不再自行读取匹配文件。若要搜索远端系统，请覆盖 grep 的 `execute()`；参见[远程执行](docs/extensions.md#remote-execution)（[#9276](https://github.com/earendil-works/pi/issues/9276)）
- 在会话中曾使用过工具、但当前已禁用全部工具时，OpenAI 兼容模型不再发送空数组 `"tools": []`，而是省略该字段。此举修复了 vLLM 0.20+（包括其前置 LiteLLM）返回的 400 错误（`tools must not be an empty array`）。如果代理要求在历史消息包含工具调用后必须提供 `tools`（例如连接到 Anthropic 的旧版 LiteLLM），请在 `models.json` 中为该模型设置 `compat.requiresToolsWithToolHistory: true`（[#11843](https://github.com/earendil-works/pi/issues/11843)）

### 新增

- `pi update` 现在会列出每个已更新软件包的 npm 版本或 git 提交变化，例如 `npm:foo 1.2.0 -> 1.3.0`；若无更新则显示 `Packages are already up to date`。如果没有更新但出现了警告（例如 npm 解析过期 registry 元数据后仍安装旧版本），则显示 `No packages were updated, see the warnings above`；离线模式下显示 `Skipped package updates (offline mode)`。`PackageManager.update()` 还会通过新的 `result` 进度事件报告每个变更的软件包，事件的 `message` 保存对应行内容（[#11707](https://github.com/earendil-works/pi/pull/11707)、[#11711](https://github.com/earendil-works/pi/pull/11711)）
- Anthropic 会话现在使用消息线程：每次请求只发送新增消息，由服务端接续之前的回复；当对话发生变化（例如压缩或工具列表变化）时，则回退为发送完整请求。`anthropic` provider 在 `api.anthropic.com` 上默认启用。对于会转发 `thread` 字段的网关，可在 `models.json` 中设置 `compat.supportsMessageThreads` 启用或关闭此功能。缓存预热不会修改会话线程（[#11545](https://github.com/earendil-works/pi/pull/11545)）
- `pi.registerMarkdownTransformer()` 新增可选参数 `{ messageTypes }`，用于选择转换器处理哪些 Markdown 内容。除 user、assistant 和 thinking Markdown 外，转换器现在还可处理 `custom`（自定义消息和 skill 区块）、`summary`（分支和压缩摘要）以及 `changelog`（启动时更新内容、`/changelog`、扩展更新通知和更新可用提示）。不传选项时，行为与之前相同。内置 Mermaid 渲染器现在也会绘制展开的分支和压缩摘要中的图表
- 新增 `pi auth login <provider>`，可在 Shell 中登录 provider，而无需启动会话，例如 `pi auth login radius`。命令会在浏览器中登录后退出；`--api-key` 可改为保存 API key，`--no-browser` 则使用设备码或复制代码登录。登录 Radius 时还会配置 Radius MCP server。`pi auth logout <provider>` 会移除保存的凭据，效果类似 `/logout`
- `ctx.ui.custom()` 覆盖层现在遵循 `blocked` 选项：覆盖层显示后会报告程序处于阻塞状态（OSC 7501），直到调用 `done()`；即使覆盖层通过 `setHidden()` 隐藏，也会保持此状态。关闭一个覆盖层时，只要还有其他待处理问题，仍会继续保持阻塞（[#11816](https://github.com/earendil-works/pi/issues/11816)）
- 新增 `qwen-token-plan-individual-cn` provider，用于 Qwen Token Plan Individual 中国区接口，使用 `QWEN_TOKEN_PLAN_CN_API_KEY`（[#7989](https://github.com/earendil-works/pi/pull/7989)，[@bigoldcat123](https://github.com/bigoldcat123)）
- 新增通过 GitHub Copilot 使用 Microsoft-Decision-1 分类器的支持，包括 codemode 的 `models.classify()`（[#11679](https://github.com/earendil-works/pi/pull/11679)，[@Marvae](https://github.com/Marvae)）
- 新增 `compat.promptCacheKeyMode`，可设为 `"auto"`、`"enabled"` 或 `"disabled"`，以便为兼容代理启用提示缓存 key，或在不接受该参数的端点上省略它。使用 Pi 时可在 `models.json` 中设置（[#9442](https://github.com/earendil-works/pi/pull/9442)，[@dannote](https://github.com/dannote)）
- 新增 `compat.requiresNonNullAssistantContent`，供要求 assistant 消息中仅含工具调用时使用空字符串而非 `null` 的 OpenAI 兼容端点使用。使用 Pi 时可在 `models.json` 中设置（[#8118](https://github.com/earendil-works/pi/pull/8118)，[@gaoyk19](https://github.com/gaoyk19)）
- 在读取和写入视图中为 Dart、Nix、Groovy 和 Gradle 文件新增语法高亮（[#11643](https://github.com/earendil-works/pi/issues/11643)）
- 将 GLM 5.3 加入 Qwen Token Plan Individual 模型允许列表（[#11658](https://github.com/earendil-works/pi/issues/11658)）
- 将 Claude Fable 5.2（`claude-fable-5-2`）加入 `anthropic` provider（输入/输出每百万 token 价格为 $8/$40，上下文长度 1M，最大输出 128K）。与 Fable 5.1 一样，它按消息设置 effort，并支持对话中途插入 system 消息；若安全分类器在生成任何内容前拒绝请求，则由服务端回退到 Claude Opus 5 处理，并按 Opus 5 价格计费。其他 provider 上的 Claude Fable 5.2 和 Mythos 5.2（例如 OpenRouter 的 `anthropic/claude-fable-5.2`）也获得相同的逐消息 effort 支持

### 变更

- `anthropic` provider 的默认模型从 Claude Opus 4.8 改为 Claude Opus 5.5（`claude-opus-5-5`）
- 默认模型升级为价格相同或更低的新模型：`amazon-bedrock` 使用 Claude Opus 5.5，`azure` 使用 GPT-6.1 Sol，`google` 和 `google-vertex` 使用 Gemini 4 Argon，`vercel-ai-gateway` 与 `baseten` 使用 GLM 5.3，`minimax` 和 `minimax-cn` 使用 MiniMax-M3，`qwen-token-plan` 和 `qwen-token-plan-cn` 使用 Qwen3.8 Max，`opencode-go` 使用 Kimi K3.1 Pro；`moonshotai`、`moonshotai-cn`、`huggingface`、`opencode`、`openrouter`、`cloudflare-workers-ai` 和 `cloudflare-ai-gateway` 则默认使用 Kimi K2.7 Code，取代 Kimi K2.6
- `cacheWarming` 的默认值现在为 `"idle"`，不再是 `"streaming"`：符合条件的提示缓存也会在 agent 两次运行间最多预热 30 分钟，但仅当预期收益足以抵消刷新成本时才会执行。若要恢复之前的行为，请在全局设置中指定 `"cacheWarming": "streaming"`
- 连续的缓存预热现在合并显示为一条 `Cache warmed: $<total>`，显示累计费用，而不是每次预热各显示一行
- `/login` 和模型选择器中，OpenAI Codex provider 恢复显示为 “OpenAI Codex”，不再标注 “OpenAI Codex (legacy)”
- `/login`、`/logout` 的 provider 列表和 `/login <provider>` 补全中，优先显示 Radius 和 OpenRouter，其后按字母顺序列出其他 provider。列表中以 `✦` 标记合作伙伴；选中 Radius 行时会呈现 Radius logo 配色的流光效果，选中 OpenRouter 行时会显示其品牌色光晕（深色主题为青柠色，浅色主题为紫罗兰色）
- 升级终端 Mermaid 渲染，支持更多图表类型，包括饼图、作者定义的样式，以及支持超链接的终端中的可点击标签（[#8158](https://github.com/earendil-works/pi/pull/8158)，[@xl0](https://github.com/xl0)）

### 修复

- 修复 grep 工具的 `glob` 匹配始终相对于 Pi 启动目录，而非 `path` 参数的问题：例如 `path: "repo"` 时，即使 `repo/migrations/main/a.js` 存在，`glob: "migrations/main/*.js"` 也会返回 `No matches found`。现在 glob 相对于 `path` 匹配，与 grep 输出结果所用的路径形式一致；即使 `path` 是符号链接也适用。前导 `./`（如 `./src/*.ts`）会被忽略，不再导致匹配为空（[#11807](https://github.com/earendil-works/pi/issues/11807)、[#10998](https://github.com/earendil-works/pi/issues/10998)）
- 修复提示模板参数解析会丢失撇号并合并单词的问题：单词内部的撇号（如 `doesn't`）不再开启引号；没有闭合引号的引号字符会作为普通文本保留；`"..."` 中的 `\"`（以及 `'...'` 中的 `\\'`）会作为字面引号处理（[#11861](https://github.com/earendil-works/pi/issues/11861)）
- 修复 bash 工具在命令已经退出、但其启动的后台进程仍持续写入输出直到超时时，只报告 `Command timed out` 的问题。错误现在还会报告 Shell 退出码和退出时间（[#11613](https://github.com/earendil-works/pi/issues/11613)）
- steering 和 follow-up 消息中的图像（包括流式生成时的 `prompt()`）现在会像空闲提示中的图像一样缩放，而不再以原始尺寸发送和保存（[#11738](https://github.com/earendil-works/pi/issues/11738)）
- 当 npm 的过期 registry 元数据导致软件包仍停留在旧版本时，`pi update --extensions` 之前会误报成功且不发出警告。现在会报告已安装版本和预期版本（[#11536](https://github.com/earendil-works/pi/issues/11536)）
- Skill 验证警告即使没有名称冲突也会标记为 `[Skill conflicts]`；现在改为显示在 `[Skill warnings]` 下（[#11521](https://github.com/earendil-works/pi/issues/11521)）
- 修复 codemode 工具描述会在每个请求中包含完整的联合类型和多行输出类型的问题。对象联合现在会摘要其字段和判别字段；其他多行类型会提示使用 `describeTool()` 查看完整声明（[#11501](https://github.com/earendil-works/pi/issues/11501)）
- 修复退出全屏模式后，模型范围启动提示仍留在 Shell 中的问题；现在提示会显示在 Pi 的全屏标题栏中（[#11508](https://github.com/earendil-works/pi/issues/11508)）
- 修复从已删除的工作目录启动时出现未捕获 `uv_cwd` 堆栈错误并崩溃的问题；现在会提示用户切换到一个现存目录（[#11509](https://github.com/earendil-works/pi/issues/11509)）
- 修复会话写入失败后，内存中仍保留磁盘上不存在的条目，导致后续条目指向不存在的父项，并使恢复的会话丢失早前历史和工具的问题（[#11460](https://github.com/earendil-works/pi/issues/11460)）
- 修复 `/tree` 分支摘要忽略会话 thinking level 的问题；这可能导致推理模型因不支持 `none` effort 而拒绝摘要请求（[#11444](https://github.com/earendil-works/pi/issues/11444)）
- 修复隐藏思考内容的标签为空时，答案和工具调用前仍会显示空白行的问题（[#11402](https://github.com/earendil-works/pi/issues/11402)）
- 修复安装或移除软件包时输出 npm audit 和资助提示的问题，其中包括可能在软件包目录中再安装一份 Pi 的 `npm audit fix` 指示（[#11409](https://github.com/earendil-works/pi/issues/11409)）
- 修复对话框打开期间替换扩展编辑器会隐藏对话框并导致无法响应的问题；现在会在对话框关闭后显示新编辑器（[#11431](https://github.com/earendil-works/pi/issues/11431)）
- 修复文件包含单独回车符时，`grep` 上下文行与 ripgrep 匹配行号错位的问题（[#11398](https://github.com/earendil-works/pi/issues/11398)）
- 修复 provider ID 中包含斜线（如从 URL 派生的 llama.cpp provider ID）时，`--model <provider>/<id>` 无法使用的问题（[#11394](https://github.com/earendil-works/pi/issues/11394)）
- 修复在打开文件开销较大的文件系统上创建会话分支速度缓慢的问题；现在会通过单个文件句柄写入分支（[#11253](https://github.com/earendil-works/pi/issues/11253)）
- 修复 `pi.exec()` 在 stdout 或 stderr 数据块边界处损坏 UTF-8 字符的问题（[#11312](https://github.com/earendil-works/pi/issues/11312)）
- 修复命令无法启动（例如可执行文件不存在）时，`pi.exec()` 返回空 stderr 的问题；现在会保留启动错误信息（[#11257](https://github.com/earendil-works/pi/pull/11257)，[@muyiyr](https://github.com/muyiyr)）
- 修复配置的软件包安装失败会导致 Pi 启动崩溃的问题。现在会跳过该软件包并报告扩展警告，在下次启动或 `/reload` 时重试；显式安装和更新命令仍会以非零退出码失败（[#11304](https://github.com/earendil-works/pi/pull/11304)，[@Lincoln504](https://github.com/Lincoln504)）
- 修复 todo 扩展示例在工具调用参数验证失败时导致 TUI 崩溃的问题（[#8057](https://github.com/earendil-works/pi/pull/8057)，[@cyzlmh](https://github.com/cyzlmh)）
- 因安全公告将 `undici` 更新至 8.12.3，并将 Gondolin 扩展示例更新至 0.14.0
- 修复 OpenRouter 在 Chat Completions 和 Anthropic Messages 中使用目录估算费用而非实际账单费用计算总费用的问题。BYOK 总费用现在包含 OpenRouter 费用和上游报告的费用；各组成部分的费用仍使用目录估算（[#9980](https://github.com/earendil-works/pi/issues/9980)）
- 修复 OpenCode Zen 和 OpenCode Go 请求错误地使用共享端点，而没有使用各自协议专用的 OpenAI、Anthropic、Google 和 System One 端点的问题（[#11434](https://github.com/earendil-works/pi/pull/11434)，[@vimtor](https://github.com/vimtor)）
- 修复 Zhipu/Z.ai 用量上限错误（代码 `1308`）被当作临时 HTTP 429 错误处理并自动重试的问题；在用量上限重置前，此类重试不会成功（[#11537](https://github.com/earendil-works/pi/issues/11537)）
- 修复无法识别 LiteLLM 的 `ContextWindowExceededError` 为上下文溢出的问题（[#11492](https://github.com/earendil-works/pi/issues/11492)）
- 修复 Gemini 工具 schema 发送不支持的 `const` 关键字的问题。现在会转换为只含单一值的 `enum` schema，同时不改写默认值、示例或枚举值中的字面数据，也不会丢失名为 `__proto__` 的属性（[#11308](https://github.com/earendil-works/pi/issues/11308)）
- 修复 faux provider 将模拟的缓存写入 token 同时计入输入 token 和缓存写入量的问题
- 修复 Orca 终端无法显示内嵌图像、退回文本显示的问题。现在会识别 Orca 对真彩色和超链接的支持；当其声明 `ORCA_IMAGE_PROTOCOL=kitty` 时，也会启用 Kitty 图像（[#9329](https://github.com/earendil-works/pi/pull/9329)，[@XRX193](https://github.com/XRX193)）
- 修复裸 Markdown URL 会吞掉后续 CJK 标点和文本的问题；显式 Markdown 链接和尖括号自动链接不受影响（[#10934](https://github.com/earendil-works/pi/pull/10934)，[@haoqixu](https://github.com/haoqixu)）
- 修复 Kitty 协议下 F1–F12 快捷键（包括带修饰键的功能键）无法识别，以及 F13 及以上按键和其他功能键在编辑器中插入不可见私用区字符的问题（[#11419](https://github.com/earendil-works/pi/issues/11419)、[#11345](https://github.com/earendil-works/pi/issues/11345)）
- 修复 Kitty 图像位于带内边距或背景色的方框中，且首行滚出全屏视口后消失的问题；现在会正确裁切部分可见图像，包括图像旁边还有其他文本时
- 修复深层嵌套 Markdown 引用块生成指数级增长的行数，并在边框耗尽可用宽度后导致渲染挂起或崩溃的问题（[#11272](https://github.com/earendil-works/pi/issues/11272)）
- 修复 system 更新后紧接着收到空 assistant 回复或仅包含推理内容的回复时，Claude 会话因 `role 'system' must precede an 'assistant' message` 而失败的问题（[#11091](https://github.com/earendil-works/pi/issues/11091)）
- 修复组织将 effort 上限设为低于 `high` 时，Claude 对话中途更改 thinking level 会因 `Invalid effort level` 失败的问题（[#10063](https://github.com/earendil-works/pi/issues/10063)）
- 修复 Kimi Code、Moonshot 和 OpenCode Go 上的 Kimi K3.1 Pro 模型使用 Kimi K2 请求设置的问题。现在会发送正确的推理 effort、保留先前的思考内容、接受对话中途新增的工具，并使用 K3 系列定价
- 修复 OpenCode DeepSeek V4.1 Flash 在长缓存保留设置下发送不支持的 `prompt_cache_retention` 参数导致请求失败的问题
- 修复从调用过工具的模型切换后，GPT-5.4 和 GPT-5.5 因 `Missing namespace for function_call` 失败的问题（[#11415](https://github.com/earendil-works/pi/issues/11415)）
- 修复 Bedrock Claude 的首选严格工具超出 provider 严格工具限制时请求失败的问题；现在会重试一次，将首选工具设为非严格，同时保留必须严格的工具（[#11416](https://github.com/earendil-works/pi/issues/11416)）
- 修复 OpenRouter 的 `~anthropic/claude-*-latest` 别名在工具调用后丢失先前思考内容的问题；现在改用 Anthropic Messages API（[#9534](https://github.com/earendil-works/pi/issues/9534)）
- 修复终端标题中的控制字符可注入终端转义序列，以及 pi-messages 流接受无效内容块索引的问题
- 修复全屏双击选择会在 `~`、`.`、`\` 和 `+` 处分割路径和 token 的问题；现在单词字符规则与 iTerm2 默认值一致（[#10980](https://github.com/earendil-works/pi/issues/10980)）
- 修复宽于内容区域的显示数学公式被自动换行拆开的情况；现在会回退为原始 LaTeX（[#11483](https://github.com/earendil-works/pi/issues/11483)）
- 修复样式化单词恰好在换行宽度处结束时，下一行会多出前导空格，以及删除线样式泄漏到换行补白中的问题（[#10925](https://github.com/earendil-works/pi/issues/10925)）
- 修复 `/tree` 分支摘要包含失败的 assistant 回复，以及被上下文编辑隐藏或替换的原始内容的问题。现在摘要会像实时请求和压缩一样遵循上下文编辑（[#11602](https://github.com/earendil-works/pi/issues/11602)）

### 移除

- 移除原生操作系统 `sandbox/` 扩展示例及其依赖。请改用 [Gondolin 示例](examples/extensions/gondolin/)或[容器化指南](docs/containerization.md)。
