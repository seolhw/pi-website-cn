---
title: "在 Android 上运行 Pi"
---

# 通过 Termux 在 Android 上运行 Pi

Pi 可通过 [Termux](https://termux.dev/) 在 Android 上运行。Termux 提供终端模拟器和 Linux 环境，支持文本输入、文件工具和 Shell 命令。借助 Termux:API，Pi 可以通过 Android 剪贴板复制和粘贴文本；暂不支持粘贴剪贴板中的图片。

<a id="before-you-begin"></a>
## 准备工作

请从 [GitHub 或 F-Droid](https://github.com/termux/termux-app#installation) 安装 Termux。不要使用已弃用的 Google Play 版本。

[Termux:API](https://github.com/termux/termux-api#installation) 是可选组件。只有在需要 Pi 复制或粘贴 Android 剪贴板文本，或 Shell 命令需要调用 Android 设备 API 时，才需要安装。

<a id="install-pi"></a>
## 安装 Pi

1. 更新 Termux 软件包：

   ```bash
   pkg update && pkg upgrade
   ```

2. 安装 Node.js 和 Git：

   ```bash
   pkg install nodejs git
   ```

3. 安装 Pi：

   ```bash
   npm install -g --ignore-scripts @earendil-works/pi-coding-agent
   ```

4. 验证安装：

   ```bash
   pi --version
   ```

5. 打开要处理的文件夹并启动 Pi：

   ```bash
   cd /path/to/working-folder
   pi
   ```

接下来请按照主[快速开始指南](/quickstart/#3-choose-a-model)连接模型并完成第一个任务。

<a id="access-android-shared-storage"></a>
## 访问 Android 共享存储

授予权限前，Termux 无法访问 Android 共享存储。只需运行一次：

```bash
termux-setup-storage
```

授权后，可通过 `/storage/emulated/0` 访问 Android 共享存储，也可使用 Termux 在 `~/storage/` 下创建的链接。

只有确实需要 Pi 访问这些文件时才授予该权限。在 Termux 中运行的命令和工具拥有与 Termux 进程相同的存储权限。

<a id="use-clipboard-commands"></a>
## 使用剪贴板命令

Pi 使用 `termux-clipboard-set` 复制文本，并通过 `termux-clipboard-get` 实现剪贴板粘贴快捷键。Shell 命令也可以直接调用这两个命令。请先安装 Termux:API 应用及其命令行软件包：

```bash
pkg install termux-api
```

验证集成：

```bash
printf 'Pi clipboard test' | termux-clipboard-set
termux-clipboard-get
```

第二条命令应输出 `Pi clipboard test`。

Termux 剪贴板 API 仅支持文本。Pi 的剪贴板粘贴快捷键会将文本插入编辑器，但无法将剪贴板中的图片作为附件添加。

<a id="add-termux-specific-instructions"></a>
## 添加 Termux 专用指令

Pi 能检测到自己运行在 Termux 中，但无法推断你希望它如何与 Android 交互。请仅将当前工作所需的环境信息添加到 `~/.pi/agent/AGENTS.md`：

````markdown
# Termux 环境

- Pi 运行在 Android 上的 Termux 中。
- Android 共享存储位于 `/storage/emulated/0`。
- 使用 `termux-open-url "https://example.com"` 打开网址。
- 使用 `termux-open <path>` 打开文件。
- 除非任务需要，否则不要访问共享存储。
````

在活动会话中修改该文件后，运行 `/reload`。

<a id="troubleshooting"></a>
## 故障排查

<a id="clipboard-integration-fails"></a>
### 剪贴板集成失败

请确认已安装以下两个组件：

1. 与 Termux 来源相同的 Termux:API Android 应用
2. `termux-api` 命令行软件包

然后退出 Pi，运行上方的剪贴板验证命令。如果命令在 Termux 中也无法正常工作，请先修复 Termux:API 安装，再重试 Pi 的复制命令。

<a id="shared-storage-reports-permission-denied"></a>
### 共享存储提示权限不足

运行 `termux-setup-storage`，批准 Android 权限请求，然后重试 `~/storage/` 或 `/storage/emulated/0` 下的路径。

<a id="pi-is-not-found-after-installation"></a>
### 安装后找不到 Pi

打开新的 Termux Shell 并运行：

```bash
npm prefix -g
command -v pi
```

确认全局 npm 二进制目录已加入 `PATH`。如果软件包缺失，请重新安装。
