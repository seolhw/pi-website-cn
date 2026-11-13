---
title: "在 Windows 上运行 Pi"
---

# 在 Windows 上运行 Pi

Pi 可以作为原生 Windows 进程运行，也可以在 Windows Subsystem for Linux（WSL）中运行。原生 Windows 默认使用 Git Bash 执行 Bash 命令，也可以选择向模型提供 PowerShell。Pi 在 WSL 中运行时，则使用对应 Linux 环境及其 Bash 安装。

请先按照[快速开始](/quickstart/)安装 Pi 并完成认证。本页说明如何选择和配置命令环境。

<a id="choose-native-windows-or-wsl"></a>
## 选择原生 Windows 或 WSL

| 环境 | 命令环境 | 适用场景 |
|---|---|---|
| 使用 Git Bash 的原生 Windows | 内置 `bash` 工具和 `!` 命令使用 Git Bash | 文件和开发工具主要位于 Windows 中 |
| 提供 `powershell` 工具的原生 Windows | 模型工具调用使用 PowerShell；`!` 命令仍使用 Bash | 任务依赖 PowerShell 模块或 Windows 原生命令 |
| WSL | 所选 WSL 发行版中的 Linux Bash 和工具 | 文件和工具链已经位于 Linux 或 WSL 中 |

<a id="use-git-bash-on-native-windows"></a>
## 在原生 Windows 上使用 Git Bash

对于大多数原生 Windows 用户，安装 [Git for Windows](https://git-scm.com/download/win) 即可。

Pi 按以下顺序查找 Bash：

1. `~/.pi/agent/settings.json` 中的 `shellPath`
2. `%ProgramFiles%\Git\bin\bash.exe` 中的 Git Bash
3. `%ProgramFiles(x86)%\Git\bin\bash.exe` 中的 Git Bash
4. `PATH` 中的 `bash.exe`，包括 Cygwin、MSYS2 或旧版 WSL Bash

启动 Pi 并输入以下命令，以验证 Shell 是否可用：

```text
!printf 'Bash is working\n'
```

如果 Pi 找不到 Bash，会报告已检查的位置。请安装 Git for Windows、将其他 Bash 可执行文件加入 `PATH`，或配置 `shellPath`。

<a id="let-the-model-use-powershell"></a>
## 让模型使用 PowerShell

可选的 `powershell` 工具会优先通过 `pwsh.exe` 运行命令；如果不可用，则回退到 Windows PowerShell。启动 PowerShell 时使用参数 `-NoProfile -NonInteractive -ExecutionPolicy Bypass`。但管理员强制设置的执行策略仍可能优先生效。

Pi 按以下顺序查找 PowerShell：

1. `PATH` 中的 `pwsh.exe`
2. `%ProgramFiles%\PowerShell\7\pwsh.exe`
3. `PATH` 中的 `powershell.exe`
4. `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`

如果要用 `powershell` 替换模型可用的 `bash` 工具，请将以下内容添加到 `~/.pi/agent/settings.json`：

```json
{
  "defaultTools": ["read", "powershell", "edit", "write"]
}
```

也可以设置 `["-bash", "+powershell"]`，在保留其他默认工具的同时完成相同替换。

重启 Pi，然后让它执行一条无害的 PowerShell 命令。编辑器中的 `!` 和 `!!` 命令仍使用 Bash。只有当 Pi 作为原生 Windows 进程运行时，`powershell` 工具才可用。

其他工具组合请参阅[设置](/settings/#tools)。

<a id="wsl"></a>
## WSL

Windows 上的 WSL 路径转换和额外的 Git 分支轮询只识别 `/mnt/<drive>` 路径，不识别自定义挂载根目录。

从 Windows 通过旧版 WSL `bash.exe` 启动器运行 Pi 时，Pi 会通过标准输入发送命令，以避免命令行引号处理问题。

<a id="use-a-custom-bash-executable"></a>
## 使用自定义 Bash 可执行文件

如果 Bash 安装在 Pi 无法自动发现的位置，请设置 `shellPath`：

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

JSON 中的反斜杠用于转义序列。因此，Windows 路径中的每个反斜杠都要写两次，如上例所示。

命令前缀、别名和完整的 Shell 解析行为请参阅[配置 Shell 命令](/shell-aliases/)。

<a id="choose-a-terminal"></a>
## 选择终端

Windows 终端通过控制台宿主（conhost）运行 Pi。有些终端自带较新的版本；其他终端使用 Windows 内置的旧版本，其中包含会影响 Pi 的错误。

我们推荐使用 [Windows Terminal](https://aka.ms/terminal)。它始终附带较新的 conhost，也是 Pi 测试最充分的终端。

最近更新：2026 年 10 月。

| 终端 | Conhost | 状态 |
|---|---|---|
| [Windows Terminal](https://aka.ms/terminal) | 自带，当前版本 | 推荐 |
| [VS Code](https://code.visualstudio.com)、[Tabby](https://tabby.sh)、WezTerm nightly | 自带，当前版本 | 可用 |
| [Alacritty](https://alacritty.org) | 内置版本；若 `conpty.dll` 和 `OpenConsole.exe` 与 `alacritty.exe` 放在同一目录则使用这两个文件 | 只有放入上述文件后可用 |
| WezTerm 20240203 及更早版本 | 自带旧版本 | [已知问题](#known-issues) |
| 经典控制台（`cmd.exe` 或未通过 Windows Terminal 启动的 PowerShell）、mintty（Git Bash）、ConEmu、Cmder、[Hyper](https://hyper.is)、Windows OpenSSH | 内置版本 | [已知问题](#known-issues) |

<a id="configure-windows-terminal"></a>
## 配置 Windows Terminal

Windows Terminal 会占用或改写部分带修饰键的按键。如何配置 `Shift+Enter` 和 `Alt+Enter`，请参阅[Windows Terminal 配置](/terminal-setup/#windows-terminal)；Pi 在 Windows 和 WSL 中的快捷键默认值请参阅[快捷键](/keybindings/)。

<a id="known-issues"></a>
## 已知问题

以下问题来自 conhost。微软已在其源代码中修复这些问题，但尚未说明何时会将修复加入 Windows 内置的 conhost。

| 问题 | 影响环境 | 解决办法 |
|---|---|---|
| 从全屏切换到普通模式，或在全屏模式下按 `Ctrl+G`，会导致会话崩溃（[#9186](https://github.com/earendil-works/pi/issues/9186)、[microsoft/terminal#17515](https://github.com/microsoft/terminal/issues/17515)） | 内置 conhost | 使用带有当前版本 conhost 的终端，或通过 `--tui-mode regular` 启动 Pi |
| 提示词中出现类似 `;0;rgb:0000/0000/0000` 的文本，按 BEL 会打开外部编辑器（[#10256](https://github.com/earendil-works/pi/issues/10256)） | 由其他终端启动的内置 conhost：mintty、Windows OpenSSH | 使用带有当前版本 conhost 的终端 |
| 提示词中出现 `79` 或 `55` 等文本片段（[#10717](https://github.com/earendil-works/pi/issues/10717)） | WezTerm 20240203 | 使用 WezTerm nightly |
| 普通模式下，每次按键都会将输入行重新绘制到新的一行（[#6300](https://github.com/earendil-works/pi/issues/6300)） | 内置 conhost、经典控制台 | 使用默认的全屏模式，或改用带有当前版本 conhost 的终端 |
