---
title: "在终端中使用 Pi"
---

# 在终端中使用 Pi

在希望 Pi 操作的文件夹中运行 `pi`。Pi 会从该文件夹发现文件、指令和配置，并按工作目录归类已保存的会话。如果你还没有安装 Pi 或选择模型，请先阅读[快速开始](/quickstart/)。

Pi 可能会询问你是否信任当前工作目录，然后才加载其中的项目资源。详情请参阅[项目权限](/security/#understand-project-trust)。

<p align="center"><img src="/images/interactive-mode.png" alt="Pi 的交互界面，显示对话、编辑器和状态信息" width="750"></p>

对话记录会显示你的提示词、Pi 的回复、工具调用、执行结果和错误。你可以在编辑器中输入提示词和命令。页脚显示当前目录、会话、模型、上下文用量以及累计用量和费用。

<a id="enter-a-prompt"></a>
## 输入提示词

输入请求并按 `Enter` 发送。按 `Shift+Enter` 可换行；若要编写较长的提示词，可按 `Ctrl+G` 在配置的外部编辑器中编辑。

要在提示词中加入文件或图片：

- 输入 `@` 搜索并添加文件。
- 按 `Tab` 补全路径。
- 在兼容的终端中粘贴图片或将图片拖入终端。

<a id="follow-pis-work"></a>
## 查看 Pi 的执行过程

Pi 会在执行过程中显示每次工具调用和结果。按 `Ctrl+O` 展开或折叠工具输出；按 `Ctrl+T` 显示或隐藏思考内容。

启动信息会列出 Pi 加载的指令和资源。编辑器边框会显示当前思考等级。模型使用上下文并报告用量时，页脚也会随之更新。

Pi 不会在每次调用工具前都征求同意。请检查将要执行的命令和更改后的文件；处理不可信内容时使用沙箱。详情请参阅[安全](/security/)。

<a id="change-direction"></a>
## 调整任务方向

Pi 工作期间，你仍可以发送更多输入：

| 目标 | 操作 |
|---|---|
| 调整当前任务 | 输入消息并按 `Enter` |
| 在当前任务后追加工作 | 输入消息并按 `Alt+Enter` |
| 将排队消息退回编辑器 | 按 `Alt+Up` |
| 停止当前任务 | 按 `Escape` |

按 `Enter` 发送的消息会等待当前回复及其工具调用完成，然后引导下一步。按 `Alt+Enter` 发送的后续消息会等待当前运行结束后再处理。中止任务时，排队消息会返回编辑器。

Windows Terminal 会占用部分 Alt 快捷键。Windows 上的替代按键请参阅[终端配置](/terminal-setup/)。

<a id="change-the-model-or-settings"></a>
## 更改模型或设置

在编辑器中输入 `/` 可搜索可用命令。最常用的命令包括：

- `/model`：选择模型；按 `Ctrl+L` 可打开相同的选择器。
- `/thinking`：选择当前模型的思考等级；按 `Shift+Tab` 可循环切换支持的等级。
- `/login` 和 `/logout`：管理 Provider 认证。
- `/settings`：修改常用偏好。

提示模板、Skill 和扩展也可以向同一菜单添加命令。请参阅[选择模型](/models/)、[配置 Pi](/configuration/)或完整的[斜杠命令参考](/slash-commands/)。

<a id="continue-or-start-over"></a>
## 继续会话或重新开始

除非禁用会话持久化，Pi 会自动保存会话。

- `/new`：开始新会话。
- `/resume`：打开其他已保存会话。
- `/name`：为当前会话设置便于识别的名称。
- `/session`：查看会话文件、ID、消息数量、Token 用量和费用。

如果想探索其他方案又不丢失现有工作，可使用 `/tree`、`/fork` 或 `/clone`。使用 `/compact` 减少发送给模型的对话历史。详情请参阅[会话与上下文](/sessions/)。

离开 Pi 后，在同一文件夹中运行 `pi --continue` 可恢复最近的会话。

<a id="run-a-terminal-command"></a>
## 运行终端命令

在命令前添加 `!`，即可运行命令并将输出加入对话：

```text
!git status
```

如果不想将输出发送给模型，请使用 `!!`。

<a id="copy-export-or-share-results"></a>
## 复制、导出或分享结果

按 `Ctrl+X` 或运行 `/copy`，复制最后一条助手回复。使用 `/export` 将会话保存为 HTML 或 JSONL。

使用 `/share` 上传会话并获取查看链接。默认情况下，如果已配置 Radius 认证，Pi 会创建 Radius 制品，使其对你的 Radius 组织可见；否则 Pi 会通过 GitHub CLI 创建私密 gist。使用 [`sessionShareDestination`](/settings/#sessions-and-context) 设置可指定 `gist` 或 `radius`。分享前请先检查会话，因为其中可能包含提示词、工具输出、文件内容以及处理过程中暴露的凭据。

<a id="adjust-the-terminal"></a>
## 调整终端

默认的全屏模式会固定编辑器和状态区域，让对话记录在终端窗口内滚动。普通模式则使用终端自身的滚动历史。可通过 `/settings` 或 `--tui-mode` 选择模式。

终端对鼠标输入、快捷键和内联图片的支持各不相同。平台专属配置请参阅[终端配置](/terminal-setup/)，全部可配置快捷键请参阅[快捷键](/keybindings/)。运行 `/hotkeys` 查看当前会话启用的快捷键。

<a id="collect-diagnostic-information"></a>
## 收集诊断信息

排查终端渲染或对话状态问题时，可运行 `/debug`。Pi 会将渲染后的终端行和当前会话消息写入 Agent 目录中的 `pi-debug.log`。

分享前请检查该文件。它可能包含提示词、模型回复、工具输出、文件内容和终端数据。
