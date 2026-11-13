---
title: "快速开始"
---

# 快速开始

Pi 在终端中运行，可操作计算机上的文件。使用 Pi 需要通过受支持的 Provider 访问模型，可以使用订阅、API Key 或本地模型。

原生 Windows 安装请参阅 [Windows 安装指南](/windows/)；Android 请参阅 [Termux 安装指南](/termux/)。

## 1. 安装 Pi

在 macOS、Linux 或 Windows 上使用安装脚本安装 Pi：

```bash tab="macOS / Linux"
curl -fsSL https://pi.dev/install.sh | sh
```

```powershell tab="Windows"
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

两个安装脚本都会固定所有依赖版本，并可通过 `pi update` 更新 Pi。也可以从 npm 安装；此方式不会固定传递依赖版本，需要 Node.js 22.19 或更高版本：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

普通 npm 安装不需要执行依赖的生命周期脚本。

macOS 或 Linux 用户也可以通过 Nix 从 Pi 的 flake 安装最新版本。Nix 会从源代码构建 Pi：

```bash
nix profile add github:earendil-works/pi/stable
```

较旧版本的 Nix 请使用 `nix profile install`。使用 `nix profile upgrade pi` 更新；`pi update` 不能更新 Nix 安装。若要固定某个版本，可使用标签，例如 `github:earendil-works/pi/v1.0.0`。

验证安装：

```bash
pi --version
```

## 2. 启动 Pi

切换到希望 Pi 操作的文件夹，然后启动：

```bash
cd /path/to/folder
pi
```

工作目录有助于 Pi 查找相关文件、指令和配置，保存的会话也会按工作目录归类。

<p align="center"><img src="/images/interactive-mode.png" alt="Pi 在终端中运行，显示对话、输入编辑器和状态栏" width="750"></p>

界面显示对话、用于输入提示和命令的编辑器，以及显示当前目录、模型和会话状态的状态栏。请参阅[在终端中使用 Pi](/usage/)，了解如何添加文件、运行命令、引导正在进行的任务以及管理结果。

<a id="3-choose-a-model"></a>

## 3. 选择模型

**模型**负责生成 Pi 的回复；**Provider** 则是 Pi 用来访问模型的服务或账户。

在 Pi 中运行：

```text
/login
```

选择一个 Provider，然后按提示使用订阅或保存 API Key。之后可运行 `/model`，选择其他可用模型。

请参阅[选择模型与 Provider](/models/)，了解受支持的 Provider、环境变量认证、本地模型和自定义端点。

## 4. 给 Pi 一个任务

Pi 会显示它读取的文件、执行的搜索、命令和修改操作，但不会在每次调用工具前都询问你。

输入一个与你的工作相关的任务，例如：

```text
总结 @meeting-notes.md，并将行动项保存到 action-items.md。
```

```text
说明这个仓库的结构，以及如何运行其中的检查。
```

```text
比较 @previous.csv 和 @current.csv，并总结重要变化。
```

在编辑器中输入 `@` 可搜索文件，无需输入完整路径。Pi 完成后，请检查回复和任何已修改的文件。重要工作请使用版本控制或备份。处理不可信内容或无人值守任务时，请使用容器或其他沙箱。详情请参阅[安全](/security/)。

## 稍后继续

Pi 会自动保存会话。退出后，在同一工作目录中运行以下命令，即可恢复最近的会话：

```bash
pi --continue
```

运行 `/resume` 可选择其他已保存的会话。会话命名、分支、压缩、导出和分享请参阅[继续会话或创建分支](/sessions/)。

## 后续步骤

- 阅读[交互式使用 Pi](/usage/)，了解输入、命令、快捷键和排队消息。
- 通过[添加指令](/configuration/#context-files)，设置 Pi 在某个文件夹中工作时应遵循的规则。
- [选择模型与 Provider](/models/)。

### 选择 Pi 的定制方式

从满足需求的最简单机制开始：

| 需求 | 建议使用 |
|---|---|
| 为某个文件夹提供持久指令 | [`AGENTS.md`](/configuration/#context-files) |
| 在 `/` 菜单中复用提示词 | [提示模板](/prompt-templates/) |
| 添加针对特定任务的指令和辅助文件 | [Skill](/skills/) |
| 添加可执行工具、命令或事件处理程序 | [扩展](/extensions/) |
| 构建自定义终端组件 | [终端 UI](/tui/) |
| 接入尚不支持的模型服务 | [自定义 Provider](/custom-provider/) |
| 安装或分发多种资源 | [Pi 包](/packages/) |

## 卸载 Pi

如果通过 npm 安装，请运行：

```bash
npm uninstall -g @earendil-works/pi-coding-agent
```

如果通过安装脚本安装，请再次运行脚本并选择 **Uninstall Pi**：

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

如果通过 Nix 安装，请运行：

```bash
nix profile remove pi
```

以上方式都不会删除 `~/.pi/agent/` 中的配置、凭据、会话或已安装的 Pi 包。
