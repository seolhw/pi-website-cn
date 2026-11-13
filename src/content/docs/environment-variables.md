---
title: "环境变量"
---

# 环境变量

Pi 以三种方式使用环境变量：

- `PI_OFFLINE` 等变量用于配置 Pi 进程。
- Pi 会设置进程标记，让子进程识别 Pi 是启动它们的 Agent。
- LLM 可调用的 Shell 工具运行命令时，会提供描述当前会话的 `PI_*` 变量。

Provider API Key 环境变量另见 [Providers](/providers/#use-an-api-key-from-the-environment)。

<a id="process-marker"></a>
## 进程标记

CLI 和 RPC 入口会设置两个进程标记：

- `AI_AGENT=pi` 是通用标记，可让工具识别 Pi 是启动当前进程的 Agent。
- `PI_CODING_AGENT=true` 是 Pi 专用标记，可让子进程检测自己是否运行在 Pi 内部。

子进程会继承这两个标记。它们不针对某个会话；通过 SDK 嵌入 Pi 时也不会自动设置。

<a id="shell-tool-session-environment"></a>
## Shell 工具中的会话环境变量

`bash` 和 `powershell` 工具运行的命令会收到当前 Pi 会话状态：

| 变量 | 说明 |
|---|---|
| `PI_SESSION_ID` | 当前会话 ID |
| `PI_SESSION_FILE` | 当前会话 JSONL 文件的绝对路径；临时会话中未设置 |
| `PI_PROVIDER` | 当前选定的模型 Provider |
| `PI_MODEL` | 当前选定的模型 ID |
| `PI_REASONING_LEVEL` | 当前生效的推理等级：`off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max` |

每条命令启动时都会重新解析这些值。因此切换模型或更改推理等级后，无需重启 Pi，下次运行 Shell 命令时就会反映新设置。`PI_PROVIDER` 和 `PI_MODEL` 表示 Pi 选定的模型，而不是路由器内部可能选择的其他上游模型。

如果需要确认当前使用的模型或 Provider，请检查这些变量，不要根据系统提示词猜测：

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
printf 'reasoning=%s session=%s\n' "$PI_REASONING_LEVEL" "$PI_SESSION_ID"
```

会话持久化时，也可以直接检查会话文件：

```bash
if [ -n "$PI_SESSION_FILE" ]; then
  tail -n 1 "$PI_SESSION_FILE"
fi
```

这些变量会注入 LLM 可调用的 `bash` 和 `powershell` 工具，但不会注入用户输入的 `!` 或 `!!` 命令。

<a id="custom-shell-tools"></a>
### 自定义 Shell 工具

通过 `createBashTool()` 或 `createPowerShellTool()` 创建的工具，在向 Pi 注册时默认会提供会话环境变量。变量会在 `spawnHook` 执行前注入，因此 Hook 可以从 `ctx.env` 中读取：

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: "1" },
  }),
});
```

可以独立于 `spawnHook` 禁用会话元数据：

```typescript
const powershellTool = createPowerShellTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

禁用后，Pi 会移除继承到的这些变量，避免嵌套启动的 Pi 进程暴露过期的父会话元数据。

<a id="pi-process-configuration"></a>
## Pi 进程配置

以下变量由 Pi 自身读取：

| 变量 | 说明 |
|---|---|
| `PI_CODING_AGENT_DIR` | 覆盖配置目录，默认值为 `~/.pi/agent` |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储目录；`--session-dir` 优先级更高 |
| `PI_PACKAGE_DIR` | 覆盖包目录，适用于 Nix/Guix Store 路径等场景 |
| `PI_OFFLINE` | 禁止自动网络活动，包括刷新模型目录 |
| `PI_SKIP_VERSION_CHECK` | 禁用对 `pi.dev` 的最新版本检查请求 |
| `PI_SELF_UPDATE_COMMAND` | Pi 自身更新时执行的命令；按空白字符拆分，并支持 `{packageName}`、`{version}` 和 `{installSpec}` 占位符。优先级高于 `selfUpdateCommand` 设置。详见[自定义更新命令](/cli/#custom-update-command)。 |
| `PI_TELEMETRY` | 覆盖安装/更新遥测和 Provider 归属请求头，可设为 `1`/`true`/`yes` 或 `0`/`false`/`no` |
| `PI_CODEMODE_MAX_WORKERS` | 进程中所有会话同时存活的 codemode worker 上限，默认为 `2`。每个 Worker 的脚本最多可使用 256 MB。一个进程运行多个会话（如进程内 sub-agent）时可提高此值；超出上限的脚本会等待空闲 Worker。详见 [Codemode](/codemode/)。 |
| `PI_CACHE_RETENTION` | 在支持的 Provider 中设为 `long`，以延长提示缓存时间 |
| `PI_SHARE_VIEWER_URL` | 覆盖 `/share` 使用的基础 URL |
| `PI_RADIUS_GATEWAY` | 覆盖 `/bug` 上传使用的 Radius 网关源地址 |
| `PI_CLEAR_ON_SHRINK` | 设为 `1`，在渲染内容缩短时清除空行；`terminal.clearOnShrink` 设置优先级更高。详见[设置](/settings/)。 |
| `PI_HARDWARE_CURSOR` | 设为 `1` 显示硬件光标；详见[终端配置](/terminal-setup/)。 |
| `PI_CLIPBOARD_OSC52` | 设为 `1` 时，在本地剪贴板写入后也通过 OSC 52 将复制文本发送到终端，与 Pi 通过 SSH 运行时的行为一致。适用于远程客户端连接 Pi 但没有 SSH 环境变量的情况，例如从另一台机器连接多路复用器，或使用远程 IDE 守护进程。 |
| `PI_HYPERLINKS` | 通过 `1`、`0` 或 `auto` 覆盖 OSC 8 超链接检测 |
| `PI_PROGRAM_STATUS` | 覆盖 OSC 7501 程序状态检测：`1` 始终上报，`0` 从不上报；其他情况下，只有终端确认支持后 Pi 才会上报。详见[终端配置](/terminal-setup/#program-status)。 |
| `PI_IMAGE_PROTOCOL` | 通过 `kitty`、`iterm2`、`none` 或 `auto` 覆盖内联图片检测 |
| `PI_TRUE_COLOR` | 通过 `1`、`0` 或 `auto` 覆盖真彩色检测 |
| `PI_TUI_ESC_TIMEOUT` | 等待单独按下的 ESC 再将其视为 Escape 的时长，单位为毫秒；SSH 下默认为 `100`，其他情况默认为 `10`。若 Alt 键输入被误识别为 Escape，可增大此值。 |
| `VISUAL`、`EDITOR` | 未设置 `externalEditor` 时使用的外部编辑器回退选项 |
| `HTTP_PROXY`、`HTTPS_PROXY` | 代理外发的 HTTP 请求 |

`ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 等 Provider 凭据变量及特定 Provider 配置，请参阅 [Providers](/providers/#use-an-api-key-from-the-environment)。
