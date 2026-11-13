---
title: "CLI 集成"
---

# CLI 集成

默认情况下，运行 `pi` 会打开交互式终端界面。当输入或输出通过管道传递或重定向时，Pi 会改用 Print 模式。你也可以为脚本和应用显式选择 Print、JSON 或 RPC 模式。

这四种模式使用相同的 Agent、会话、资源和工具。模式决定输入如何传入 Pi、输出如何提供，以及进程是否会继续等待后续命令。

SDK 不属于 CLI 模式。它会在 Node.js 或 Bun 进程中直接嵌入 Agent。如果需要直接使用 TypeScript API，请参阅 [SDK](/sdk/)。

<a id="choose-a-mode"></a>
## 选择模式

| 模式 | 接口 | 生命周期 | 适用场景 |
|---|---|---|---|
| Interactive | 终端 UI | 直到用户退出 | 用户直接与 Pi 协作 |
| Print | 标准输出中的最终文本 | 单次调用 | 脚本只需要最终助手回复 |
| JSON | 标准输出中的 JSONL 事件 | 单次调用 | 进程需要获取本次运行的结构化进度 |
| RPC | JSONL 命令、响应和事件 | 长期运行 | 进程需要双向控制 Pi |

CLI 选项仍可独立于模式选择工作目录、模型、工具、资源和会话持久化行为。完整的启动选项请参阅[命令行](/cli/)。

<a id="print-to-stdout"></a>
## 将结果输出到标准输出

Print 模式执行传入的提示词，将助手的最终文本写入标准输出，然后退出：

```bash
pi --print "Summarize the changes in this repository"
```

当你只需要最终文本时，可使用 Print 模式，包括命令替换、管道和一次性任务。中间事件不会提供给调用方。

Print 模式将错误写入标准错误。如果助手最终回复以 `error` 或 `aborted` 为停止原因，进程会以非零状态码退出。如果回复因达到模型输出 token 上限而结束（停止原因是 `length`），Pi 仍会将部分文本写入标准输出，同时向标准错误写入警告，并以非零状态码退出。

如果未显式选择模式，非 TTY 的标准输入或标准输出也会让 Pi 选择 Print 模式，因此管道输入输出无需额外添加 `--print`。

<a id="stream-json-events"></a>
## 流式输出 JSON 事件

JSON 模式先输出会话头，再以换行分隔的 JSON 形式输出 Agent 和会话事件：

```bash
pi --mode json "Review this repository" > events.jsonl
```

这是结构化的事件流，并非单个 JSON 结果，也不限制模型回复文本的格式。

所有提示词都必须在进程启动时提供。Pi 会为本次运行持续输出事件，之后退出；运行期间不接受后续命令。

失败或中止的助手回复会出现在事件流中，但本身不会导致进程以非零状态码退出。如果成功与否很重要，请检查事件内容。调用过程中抛出错误时，Pi 仍会以非零状态码退出。

流式 `message_update` 记录包含的是增量，而不是不断增长的完整消息快照。应根据增量事件组装实时输出，并在收到 `message_end` 后用其中的权威完整消息替换它。

`agent_end` 之后可能还会发生自动恢复或处理排队工作。`agent_settled` 表示本次运行的自动工作已经结束。

标准输出专用于 JSONL。诊断信息和应用日志写入标准错误。关于数据帧、事件结构和消息重建规则，请参阅 [JSON 事件流](/json/)。

<a id="control-pi-with-rpc"></a>
## 通过 RPC 控制 Pi

RPC 模式会让 Pi 持续运行，其他进程可以发送命令并接收响应和事件：

```bash
pi --mode rpc --no-session
```

命令以 JSON 对象的形式写入标准输入；响应和事件也以 JSON 对象的形式写入标准输出。每条记录占一行。

需要匹配请求与响应的命令应包含 `id`；对应的响应会返回相同 ID。事件通常不含命令 ID，因为它们描述的是会话活动，而不是某个单独请求。

收到成功的 `prompt` 响应，表示提示词已被接受、排队或处理，并不代表运行已经完成。如果需要确认完成，请持续接收事件，直到出现 `agent_settled`。

RPC 命令可以更改模型、检查状态、管理会话、运行 Shell 命令以及响应扩展 UI 请求。

扩展对话框采用请求—响应子协议；其他扩展 UI 更新则是客户端可以显示或忽略的通知。交互模式之外的扩展无法使用某些专属于 TUI 的功能，或只能以受限方式使用。

对于 Node.js 或 TypeScript 集成，建议使用 `@earendil-works/pi-coding-agent` 中的 `RpcClient`。它会启动 Pi RPC 子进程、关联请求与响应、提供带类型的命令方法，并将会话事件发送给监听器。

[RPC 客户端示例](../examples/rpc-client.ts)会发送一个提示词、流式处理文本和工具活动、等待 `agent_settled`，最后关闭子进程。该示例也包含在仓库的 TypeScript 类型检查中。

`RpcClient.promptAndWait()` 会先安装事件监听器再发送提示词，避免快速完成时发生竞态。若要执行独立操作，应在调用 `prompt()` 前先订阅事件；只有在运行中的任务确实需要等待时才调用 `waitForIdle()`。

客户端需要一个可运行的 Pi CLI 路径。仓库示例指向 `dist/cli.js`，因此从源码检出目录运行示例前，必须先构建软件包。

如果不使用 `RpcClient`，可先阅读 [RPC 协议](/rpc/)，再将 [RPC 命令](/rpc-commands/)和 [JSON 事件流](/json/)作为通信协议参考。

<a id="fork-and-rebrand-pi"></a>
## 分叉并重新命名 Pi

源码分支可以通过 `package.json` 更改 CLI 名称和配置目录：

```json
{
  "piConfig": {
    "name": "my-agent",
    "configDir": ".my-agent"
  }
}
```

修改顶层的 `bin` 字段即可更改可执行文件名称。这些设置会影响 CLI 横幅、配置路径以及推导出的环境变量名称。

<a id="examples-and-references"></a>
## 示例与参考

- [RPC 客户端](../examples/rpc-client.ts)：带类型的 Node.js 集成
- [RPC 扩展 UI](../examples/rpc-extension-ui.ts)：支持扩展对话框的自定义终端客户端
- [命令行](/cli/)：启动选项和模式选择
- [JSON 事件流](/json/)：JSON 事件参考
- [RPC 协议](/rpc/)：RPC 生命周期、数据帧、错误和关闭流程
- [RPC 命令](/rpc-commands/)：命令与响应参考
- [RPC 扩展 UI](/rpc-extension-ui/)：扩展交互子协议
- [SDK 示例](../examples/sdk/)：进程内 TypeScript 集成
