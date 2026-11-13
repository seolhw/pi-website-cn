---
title: "配置 Shell 命令"
---

# 配置 Shell 命令

Pi 会为每条 Bash 命令启动一个独立的非交互式 Shell 进程。非交互式 Bash 默认不会展开别名，通常也不会加载与交互式终端相同的启动文件。

使用 `shellPath` 指定 Bash 可执行文件，使用 `shellCommandPrefix` 在每条命令执行前运行初始化设置。

<a id="understand-which-shell-pi-uses"></a>
## 了解 Pi 使用的 Shell

| 命令来源 | 使用的 Shell |
|---|---|
| 模型调用内置 `bash` 工具 | Pi 解析出的 Bash 可执行文件 |
| 你输入 `!command` 或 `!!command` | 同一个已解析的 Bash 可执行文件 |
| 模型调用可选的 `powershell` 工具 | PowerShell 7（`pwsh.exe`）或 Windows PowerShell |
| 扩展提供或替换了 Shell 工具 | 由该扩展实现的操作 |

Pi 通常通过 `bash -c` 调用 Bash。在 Unix 系统上，它依次尝试 `/bin/bash`、`PATH` 中的 `bash`，如果 Bash 不可用则回退到 `sh`。原生 Windows 会先检查配置的路径，再尝试 Git Bash，最后查找 `PATH` 中的 `bash.exe`。

<a id="choose-a-bash-executable"></a>
## 选择 Bash 可执行文件

如果希望 Pi 使用指定的可执行文件，可在 `~/.pi/agent/settings.json` 中设置 `shellPath`：

```json
{
  "shellPath": "~/.local/bin/bash"
}
```

在 Windows 上可使用正斜杠，或对反斜杠进行转义：

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

修改设置后运行 `/reload`。原生 Windows 的默认行为请参阅[在 Windows 上运行 Pi](/windows/)。

<a id="run-setup-before-every-bash-command"></a>
## 在每条 Bash 命令前运行初始化设置

将初始化命令写入 `shellCommandPrefix`，它会作用于内置 `bash` 工具以及你输入的 `!` 和 `!!` 命令：

```json
{
  "shellCommandPrefix": "export CI=1"
}
```

Pi 会用换行符连接前缀和请求执行的命令。每条命令都会重新运行前缀，因此其中的操作应当快速完成，且不能要求交互输入。

<a id="enable-bash-aliases"></a>
## 启用 Bash 别名

请将 Pi 需要的别名放入兼容 Bash 的文件中，而不要尝试解析整份交互式 Shell 配置。

创建 `~/.bash_aliases`：

```bash
alias ll='ls -la'
alias gs='git status --short'
```

然后配置 Pi 启用别名展开并加载该文件：

```json
{
  "shellCommandPrefix": "shopt -s expand_aliases\nsource ~/.bash_aliases"
}
```

运行 `/reload`，然后通过 Pi 验证别名：

```text
!ll
```

执行结果应与 `ls -la` 相同。

别名必须使用 Bash 兼容语法。不要将任意 `.zshrc` 加载到 Bash 中，因为其中的 zsh 选项、函数和插件可能无法解析或行为异常。

<a id="troubleshooting"></a>
## 故障排查

<a id="prefix-works-for-bang-but-not-extension-tool"></a>
### 前缀对 `!` 命令生效，但对扩展工具无效

`shellCommandPrefix` 只配置 Pi 内置 Bash 的执行方式。替换 `bash` 工具或提供自有 Shell 操作的扩展会自行管理初始化流程。请查阅该扩展的文档。

<a id="shopt-is-not-found"></a>
### 找不到 `shopt`

Pi 已回退到 `sh`，或者 `shellPath` 指向的不是 Bash。请安装 Bash，或将 `shellPath` 设置为 Bash 可执行文件，然后再使用 `shopt` 等 Bash 专用设置。

<a id="setup-command-waits-for-input"></a>
### 初始化命令等待输入

从 `shellCommandPrefix` 中移除交互式命令。该前缀会在每条 Bash 命令执行前的非交互式进程中运行。

完整设置定义请参阅 [Shell 设置](/settings/#shell)。
