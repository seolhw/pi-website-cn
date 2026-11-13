---
title: "配置终端"
---

# 配置终端

大多数现代终端无需额外配置即可运行 Pi。如果修饰键、滚动、链接、图像、颜色或输入法（IME）候选窗口位置异常，请参阅本页。

Pi 使用扩展键盘协议，使终端能够区分 `Shift+Enter`、`Alt+Enter` 等组合键与普通 `Enter`。终端代理、多路复用器和 IDE 内置终端可能会改变或丢弃这些信息。

## 故障排查

| 问题现象 | 排查入口 |
|---|---|
| `Shift+Enter` 提交了提示词，而不是换行 | 查看下方对应终端章节；tmux 用户请参阅[在 tmux 中运行 Pi](/tmux/) |
| `Alt+Enter` 无法将消息加入后续队列 | [WezTerm](#wezterm)、[Alacritty](#alacritty)或 [Windows Terminal](#windows-terminal) |
| 全屏模式下滚动异常缓慢 | [iTerm2](#iterm2) |
| 链接可用，但悬停时不显示预览 | [Ghostty](#ghostty) |
| 未检测到内嵌图像或颜色功能 | [覆盖检测到的终端能力](#override-detected-capabilities) |
| 输入法候选窗口位置不正确 | [WezTerm](#wezterm)或 [IntelliJ IDEA](#intellij-idea-integrated-terminal) |
| 修饰键只在 tmux 中失效 | [在 tmux 中运行 Pi](/tmux/) |

使用 `/hotkeys` 查看 Pi 当前生效的快捷键。修改快捷键请参阅[快捷键参考](/keybindings/)。

## Kitty

Kitty 无需额外配置即可支持所需的键盘协议。

## iTerm2

普通终端模式无需额外配置即可使用。

### 修复全屏模式滚动缓慢

全屏模式下，视口由 Pi 控制，因此 iTerm2 会发送鼠标滚轮事件，而不是滚动终端原生历史记录。快速滑动触控板时，可能每次只能移动一行左右。

要更改此行为：

1. 打开 **iTerm2 > Settings > Advanced**。
2. 搜索 **Trackpad scrolls fast?**。
3. 将其设为 **No**。

此设置会影响整个 iTerm2，也可能改变终端原生的触控板滚动行为。相关问题见 [iTerm2 issue 9619](https://gitlab.com/gnachman/iterm2/-/work_items/9619)。

## Apple Terminal

如果系统支持，Pi 会启用增强按键报告。如果 Terminal.app 对 `Shift+Enter` 仍只发送普通 Return 或 `ESC` + Return，Pi 会使用 macOS 本地修饰键状态作为回退，并将其识别为 `Shift+Enter`。未按住 Shift 时的 `ESC` + Return 仍会被识别为 `Alt+Enter`。

此回退机制仅在 Pi 和 Terminal.app 运行于同一台 Mac 时有效。如果 Pi 通过 SSH 运行在另一台机器上，就无法读取本地修饰键状态。

## Ghostty

如果 `Alt+Backspace` 无法使用，请将以下映射添加到 Ghostty 配置中：

```text
keybind = alt+backspace=text:\x1b\x7f
```

macOS 上的配置文件为 `~/Library/Application Support/com.mitchellh.ghostty/config`，Linux 上为 `~/.config/ghostty/config`。

旧版 Claude Code 配置中可能包含以下内容：

```text
keybind = shift+enter=text:\n
```

此映射会发送原始换行符，Pi 无法将其与 `Ctrl+J` 区分。如果添加该映射只是为了兼容旧版 Claude Code，请将其删除。Pi 已将 `Ctrl+J` 绑定为换行快捷键，因此该映射表面上可能有效，却会导致 Pi 和 tmux 无法收到真正的 `Shift+Enter` 事件。

### 在全屏模式下打开链接

全屏模式下链接仍可点击，但 Pi 捕获鼠标输入时，Ghostty 不会显示常规的悬停下划线或 URL 预览。macOS 上按住 `Shift+Command`，Linux 上按住 `Shift+Ctrl`，即可使用 Ghostty 原生的链接处理方式。

## WezTerm

WezTerm 通常通过 xterm 扩展键报告 `Shift+Enter`。如需显式启用 Kitty 键盘协议，请创建 `~/.wezterm.lua`：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.enable_kitty_keyboard = true
return config
```

### 在 macOS 上转发 Alt+Enter

WezTerm 在 macOS 上默认将 `Option+Enter` 绑定为全屏切换。若要将其用于 Pi 的后续消息队列，请将以下条目添加到 `config.keys` 表：

```lua
{
  key = 'Enter',
  mods = 'ALT',
  action = wezterm.action.SendString('\x1b[13;3u'),
}
```

完整的最小配置如下：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.keys = {
  {
    key = 'Enter',
    mods = 'ALT',
    action = wezterm.action.SendString('\x1b[13;3u'),
  },
}
return config
```

### 在 WSL 中调整输入法候选窗口位置

如果 WSL 中的中日韩输入法候选窗口无法跟随 Pi 的文本光标，请显示硬件光标：

```bash
export PI_HARDWARE_CURSOR=1
pi
```

也可以在 Pi 设置中将 `showHardwareCursor` 设为 `true`。

## Alacritty

Alacritty 通常会正确报告 `Shift+Enter`。在 macOS 上，`Option+Enter` 可能会作为普通 `Enter` 发送。将以下内容添加到 `~/.config/alacritty/alacritty.toml`，即可将其转发给 Pi：

```toml
[[keyboard.bindings]]
key = "Enter"
mods = "Alt"
chars = "\u001b[13;3u"
```

修改文件后请重启 Alacritty。

## VS Code 集成终端

VS Code 1.109.5 及更高版本默认会在集成终端中启用 Kitty 键盘协议。

较旧版本请在 `keybindings.json` 中添加 `Shift+Enter` 终端绑定：

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

用户级 `keybindings.json` 文件通常位于：

- macOS: `~/Library/Application Support/Code/User/keybindings.json`
- Linux: `~/.config/Code/User/keybindings.json`
- Windows: `%APPDATA%\\Code\\User\\keybindings.json`

## Zed 集成终端

将以下绑定添加到 Zed 的 `keymap.json`：

```json
{
  "context": "Terminal",
  "bindings": {
    "shift-enter": ["terminal::SendText", "\u001b[13;2u"],
    "ctrl--": ["terminal::SendText", "\u001b[45;5u"],
    "ctrl-alt-]": ["terminal::SendText", "\u001b[93;7u"]
  }
}
```

## Windows Terminal

Windows Terminal 使用 Pi 在 Windows 和 WSL 下的默认快捷键。完整列表请参阅[快捷键参考](/keybindings/)。

### 转发 Shift+Enter

Pi 原生运行于 Windows 时，会检查本地 Shift 键状态；按住 Shift 时，普通 Return 或 `ESC` + Return 会被识别为 `Shift+Enter`。此回退机制在 WSL 或 SSH 中无效。如果 `Shift+Enter` 仍会提交提示词，请显式转发该按键。

按 `Ctrl+Shift+,` 打开 Windows Terminal 的 `settings.json`，或选择 **Settings > Open JSON file**。将以下对象添加到 `actions` 数组中：

```json
{
  "command": { "action": "sendInput", "input": "\u001b[13;2u" },
  "keys": "shift+enter"
}
```

完全退出并重新打开 Windows Terminal，然后确认 `Shift+Enter` 可以在 Pi 中插入换行。

### 使用 Alt+Enter 发送后续消息

Windows Terminal 默认将 `Alt+Enter` 绑定为全屏切换。因此，Pi 在 Windows 和 WSL 上使用 `Ctrl+Q` 发送后续消息。

若要改用 `Alt+Enter`，请配置 Windows Terminal 转发该按键，并在 Pi 的 `keybindings.json` 中将 `app.message.followUp` 绑定到 `alt+enter`。详见[快捷键参考](/keybindings/#assign-keybindings)。

## xfce4-terminal 和 Terminator

这些终端无法可靠地区分带修饰键的 Enter 与普通 `Enter`。因此，`Ctrl+Enter` 或 `Shift+Enter` 等自定义绑定可能无法使用。

如果需要这些快捷键，请使用支持现代扩展键协议的终端，例如 Kitty、Ghostty、WezTerm、iTerm2、Windows Terminal 或兼容版本的 Alacritty。

<a id="intellij-idea-integrated-terminal"></a>
## IntelliJ IDEA 集成终端

IntelliJ IDEA 内置终端无法可靠地区分 `Shift+Enter` 和普通 `Enter`。请使用 `Ctrl+J` 换行，或在支持现代扩展键协议的终端中运行 Pi。

如果输入法候选窗口无法跟随文本光标，请显示硬件光标：

```bash
export PI_HARDWARE_CURSOR=1
pi
```

<a id="override-detected-capabilities"></a>
## 覆盖检测到的终端能力

Pi 会自动检测 OSC 8 超链接、内嵌图像协议和真彩色支持。终端代理或多路复用器可能导致检测结果不准确。

| 能力 | 环境变量 | 设置项 |
|---|---|---|
| 超链接 | `PI_HYPERLINKS=1\|0\|auto` | `terminal.hyperlinks: true\|false\|"auto"` |
| 内嵌图像 | `PI_IMAGE_PROTOCOL=kitty\|iterm2\|none\|auto` | `terminal.images: "kitty"\|"iterm2"\|false\|"auto"` |
| 真彩色 | `PI_TRUE_COLOR=1\|0\|auto` | `terminal.trueColor: true\|false\|"auto"` |

设置项的优先级高于环境变量。未设置或设为 `auto` 时，会保留自动检测行为。

只有在完整终端链路均支持某项能力时，才应强制启用它。不受支持的转义序列可能导致渲染异常。各项取值的规范定义请参阅[环境变量](/environment-variables/#pi-process-configuration)和[设置](/settings/)。

<a id="program-status"></a>

## 程序状态

Pi 使用[程序状态协议（OSC 7501）](https://www.superlogical.com/rex/docs/build/program-status)报告自身状态，终端和 agent 仪表板可据此显示 Pi 正在工作、等待用户、已完成或发生故障：

| 状态 | 含义 |
|---|---|
| `working` | Agent 正在运行或进行上下文压缩。消息内容为会话名称。 |
| `blocked` | 扩展对话框或登录流程正在等待用户操作。消息内容为对话框标题。 |
| `done` | 一次运行已结束。消息内容为会话名称。 |
| `error` | 运行因错误结束且不会重试。消息内容为错误的第一行。 |
| `idle` | Pi 已启动，或用户取消了运行。 |

状态报告不会包含提示词或模型输出。Pi 只有在终端确认支持该协议后才会发送报告；tmux 和 screen 不会转发这些报告。设置 `PI_PROGRAM_STATUS=1` 可跳过查询直接发送，设置 `PI_PROGRAM_STATUS=0` 可关闭报告。
