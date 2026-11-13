---
title: "在 tmux 中运行 Pi"
---

# 在 tmux 中运行 Pi

Pi 可以在 tmux 中运行，但 tmux 可能会把 `Shift+Enter`、`Ctrl+Enter` 和普通 `Enter` 报告为同一个按键。启用扩展按键后，Pi 才能区分它们。

<a id="check-your-tmux-version"></a>
## 检查 tmux 版本

```bash
tmux -V
```

tmux 3.5 或更新版本请使用下方推荐的 CSI-u 配置；tmux 3.2 至 3.4 请使用旧版本配置。

<a id="enable-extended-keys-in-tmux-3-5-or-newer"></a>
## 在 tmux 3.5 或更新版本中启用扩展按键

将以下内容添加到 `~/.tmux.conf`：

```text
set -g extended-keys on
set -g extended-keys-format csi-u
```

当终端没有直接提供 Kitty 键盘协议时，Pi 会请求启用扩展按键报告。CSI-u 是通过 tmux 转发带修饰键按键时最可靠的格式。

<a id="restart-tmux"></a>
## 重启 tmux

该配置会作用于 tmux 服务器。要确保配置已生效，请关闭 tmux 会话并启动新的服务器。

如果选择从命令行停止服务器，请先保存工作。以下命令会终止该服务器管理的所有会话：

```bash
tmux kill-server
tmux
```

<a id="verify-modified-keys"></a>
## 验证带修饰键的按键

在新的 tmux 会话中启动 Pi，并确认：

1. `Shift+Enter` 会在编辑器中插入换行。
2. `Enter` 会提交提示词。
3. 在 macOS 和 Linux 上，`Alt+Enter` 会排队后续任务。Windows 和 WSL 默认使用 `Ctrl+Q`。

如果这些按键仍被当作普通 `Enter`，请确认 tmux 外部的终端能够报告带修饰键的按键。另请参阅[配置终端](/terminal-setup/)。

<a id="use-tmux-3-2-through-3-4"></a>
## 在 tmux 3.2 至 3.4 中使用

这些版本支持扩展按键，但不支持 `extended-keys-format csi-u`。只需添加：

```text
set -g extended-keys on
```

Pi 支持这些版本使用的 xterm `modifyOtherKeys` 格式。重启 tmux 后重复上述验证步骤。

对于更旧的版本，请升级 tmux，或在 tmux 外运行 Pi，不要依赖带修饰键的 Enter 快捷键。

<a id="known-issues"></a>
## 已知问题

| 问题 | 影响版本 | 解决办法 |
|---|---|---|
| 启动时编辑器中出现类似 `c0c/0c0c/0c0c` 的文本（[tmux#4749](https://github.com/tmux/tmux/issues/4749)） | tmux 3.6 | 升级 tmux。更改 Pi 主题无效。 |
