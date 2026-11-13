---
title: "RPC 协议"
---

# RPC 模式

RPC 模式会将 Pi 作为长期运行的子进程，通过标准输入和标准输出上的 JSON 记录进行控制。它适用于跨语言集成、进程隔离、IDE 和自定义用户界面。

如果要在 Node.js 或 Bun 进程内集成，建议使用 [SDK](/sdk/)。如果要通过子进程进行 TypeScript 集成，建议使用导出的 `RpcClient`；它负责启动 Pi、关联响应、提供类型化命令方法，并将事件分发给监听器。

| 接口 | 进程边界 | 控制方式 | 适用场景 |
|---|---|---|---|
| [SDK](/sdk/) | 同一进程内 | 直接调用 TypeScript 方法并接收事件 | 需要完整 API 访问能力的 Node.js 或 Bun 宿主 |
| RPC | 子进程 | JSONL 命令、响应和事件 | 其他语言、隔离进程、IDE 或自定义客户端 |

## 启动 RPC 模式

```bash
pi --mode rpc --no-session
```

常规 CLI 选项仍可用于选择工作目录、模型、工具、资源和会话行为。常用选项包括 `--provider`、`--model`、`--name`、`--no-session` 和 `--session-dir`。完整且与版本对应的接口请参阅[命令行](/cli/)；当前安装版本的准确说明以 `pi --help` 为准。

RPC 模式不接受 `@file` 提示词参数。请改用 [`prompt`](/rpc-commands/#prompt) 命令发送提示词。

## 协议记录

该协议包含四类记录：

| 方向 | 记录 | 用途 |
|---|---|---|
| 标准输入 | 命令 | 要求 Pi 发送提示词、检查状态、修改配置或管理会话 |
| 标准输出 | `response` | 报告命令是否成功，并返回命令数据 |
| 标准输出 | 会话事件 | 流式传递运行、消息、工具、队列、压缩和重试活动 |
| 双向 | 扩展界面记录 | 在 Pi 与客户端之间转发受支持的扩展交互 |

记录的规范定义请参阅 [RPC 命令](/rpc-commands/)、[JSON 事件流](/json/)和 [RPC 扩展界面](/rpc-extension-ui/)。

### 关联命令与响应

每条命令都可以带有可选的字符串 `id`。对应的响应会原样返回该 ID：

```json
{"id":"req-1","type":"get_state"}
{"id":"req-1","type":"response","command":"get_state","success":true,"data":{"...":"..."}}
```

如果可能同时存在多条未完成的命令，请为它们使用不同的 ID。命令处理是异步的，因此客户端应根据 ID 关联响应，而不能依赖响应顺序。

会话事件通常不带命令 ID，因为它们描述的是会话活动。例外是 `bash_execution_update`：如果触发它的 [`bash`](/rpc-commands/#bash) 命令带有 ID，其输出事件也会重复该 ID。

`extension_ui_response` 使用对应 `extension_ui_request` 提供的 ID，不会产生常规命令响应。

## 消息分帧

RPC 使用严格的 JSONL 分帧格式。每条记录写入一个完整 JSON 对象，并以 LF（`\n`）结束。应将标准输出作为字节流或 UTF-8 流读取，只以 LF 分隔记录。为兼容 CRLF 输入，可去掉 LF 前可选的回车符。

不要使用会将 Unicode 行分隔符或段落分隔符视为记录边界的通用逐行读取器。尤其要注意，Node.js `readline` 也会在 `U+2028` 和 `U+2029` 处分割，而这两个字符可以合法出现在 JSON 字符串中。

应持续读取标准输出。Pi 会遵循标准输出的背压机制，但客户端若停止读取，可能导致进程停滞。写入命令时也应遵循标准输入的背压机制。标准输出专用于协议记录；诊断信息和应用日志应写入标准错误。

## 运行生命周期

`prompt` 成功响应表示提示词已被接受、排队或处理，并不意味着模型任务已经完成：

```json
{"id":"req-2","type":"prompt","message":"Review this repository"}
{"id":"req-2","type":"response","command":"prompt","success":true,"data":{"disposition":"started"}}
```

`data.disposition` 用于说明提示词的处理结果。如果值为 `"handled"`，表示该提示词没有启动运行，因此不要等待 `agent_settled`。所有可能的值请参阅 [RPC 命令](/rpc-commands/#prompt)。

收到响应后仍应继续读取[事件](/json/)。`agent_end` 表示一次底层 agent 运行结束，但后续仍可能发生重试、溢出恢复、上下文压缩、引导消息或后续任务。如果客户端需要确认 Pi 不会自动继续，应等待 `agent_settled`。

为避免遗漏很快完成的任务，应先订阅事件，再发送提示词。`RpcClient.promptAndWait()` 会在内部完成此操作。如果分别调用 `RpcClient` 的方法，应在调用 `prompt()` 前安装事件监听器，并且只在运行期间调用 `waitForIdle()`。

## 错误处理

命令失败时会返回一条 `success: false` 的响应：

```json
{"id":"req-3","type":"response","command":"set_model","success":false,"error":"Model not found: invalid/model"}
```

JSON 格式错误时会返回解析错误响应，此响应不带请求 ID：

```json
{"type":"response","command":"parse","success":false,"error":"Failed to parse command: Unexpected token..."}
```

成功响应只表示命令处理成功。提示词被接受后发生的 Provider 故障和中止，会出现在消息及事件流中。

客户端还必须处理子进程启动失败、意外退出、标准错误诊断信息、取消操作和自身的截止时间。不要将标准错误解析为协议数据。

## 关闭

关闭子进程的标准输入可请求有序关闭。Pi 会释放活动运行时，并等待待处理任务完成后再退出，因此强制终止前应留出退出时间。客户端仍需处理进程信号和意外退出。

SIGTERM 和 SIGHUP 也会启动有序关闭。无论关闭是由标准输入 EOF 还是信号触发，开始后，标准输入 EOF 或单个信号都不会中断关闭过程；收到第二个信号时则会立即退出。同时关闭标准输入并发送 SIGTERM 是安全的。

扩展也可以通过 `ctx.shutdown()` 请求关闭。如果会话空闲且没有正在处理的命令，Pi 会立即关闭；否则会等当前命令完成后关闭（对于 `prompt`，则等待提示词处理结束），或等待活动运行发出 `agent_settled`。如果扩展发起的上下文压缩正在进行，关闭请求会等到下一条命令或运行完成后再处理。

## 最小客户端示例

下面的 Python 示例使用二进制管道读取器，只按 LF 分割记录，不会将 Unicode 分隔符误当作协议边界：

```python
import json
import subprocess

process = subprocess.Popen(
    ["pi", "--mode", "rpc", "--no-session"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
)

assert process.stdin is not None
assert process.stdout is not None

command = {"id": "prompt-1", "type": "prompt", "message": "Hello"}
process.stdin.write(json.dumps(command).encode("utf-8") + b"\n")
process.stdin.flush()

while line := process.stdout.readline():
    record = json.loads(line)
    if record.get("type") == "message_update":
        update = record["assistantMessageEvent"]
        if update["type"] == "text_delta":
            print(update["delta"], end="", flush=True)
    elif record.get("type") == "agent_settled":
        print()
        break

process.stdin.close()
process.wait()
```

维护中的 TypeScript 客户端请使用经过验证的 [RPC 客户端示例](../examples/rpc-client.ts)。该示例需要已构建的 Pi CLI，因为仓库中的示例会调用 `dist/cli.js`。

## 参考资料

- [RPC 命令](/rpc-commands/)：所有标准输入命令及其响应
- [JSON 事件流](/json/)：共用的标准输出会话事件及流式重建
- [RPC 扩展界面](/rpc-extension-ui/)：对话框、通知、响应和限制
- [消息类型](/message-types/)：响应和事件使用的消息及内容块
- [会话文件格式](/session-format/)：会话命令返回的条目
- [`rpc-types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-types.ts): exported TypeScript protocol definitions
- [`RpcClient`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-client.ts): subprocess client implementation

## 迁移后的参考锚点

本页原有的详细参考内容现已移至独立页面。以下锚点用于保留已有链接。

<a id="prompt"></a>
<a id="steer"></a>
<a id="follow_up"></a>
<a id="abort"></a>
<a id="clear_queue"></a>
<a id="new_session"></a>
<a id="get_state"></a>
<a id="get_messages"></a>
<a id="set_model"></a>
<a id="cycle_model"></a>
<a id="get_available_models"></a>
<a id="set_thinking_level"></a>
<a id="cycle_thinking_level"></a>
<a id="get_available_thinking_levels"></a>
<a id="set_steering_mode"></a>
<a id="set_follow_up_mode"></a>
<a id="compact"></a>
<a id="set_auto_compaction"></a>
<a id="set_auto_retry"></a>
<a id="abort_retry"></a>
<a id="bash"></a>
<a id="abort_bash"></a>
<a id="get_session_stats"></a>
<a id="export_html"></a>
<a id="switch_session"></a>
<a id="fork"></a>
<a id="clone"></a>
<a id="get_fork_messages"></a>
<a id="get_entries"></a>
<a id="get_tree"></a>
<a id="get_last_assistant_text"></a>
<a id="set_session_name"></a>
<a id="get_commands"></a>

Command details moved to [RPC Commands](/rpc-commands/).

<a id="message_update-streaming"></a>
<a id="bash_execution_update"></a>
<a id="compaction_start--compaction_end"></a>
<a id="summarization_retry_scheduled--summarization_retry_attempt_start--summarization_retry_finished"></a>

Event details moved to [JSON Event Stream](/json/).

<a id="extension-ui-protocol"></a>

Extension interaction details moved to [RPC Extension UI](/rpc-extension-ui/).
