---
title: "Pi"
slug: overview
---

# Pi

Pi 是一个可扩展的 AI Agent，在终端中运行。告诉它目标并指定工作目录，它就能检查文件、运行命令、编辑内容并完成多步骤任务。

你可以用 Pi 进行软件开发、整理研究笔记、写作、处理数据文件或开展个人项目。可以直接使用 Pi，也可以让它适应你的工作流，还可以通过 SDK 构建由 Pi 驱动的应用。

## 开始使用 Pi

如果你刚接触 Pi，请按照[快速开始](/quickstart/)安装 Pi、连接模型并完成第一个任务。

如果已经安装 Pi，可根据需要选择：

- [交互式使用 Pi](/usage/)：添加文件、运行命令、引导正在进行的任务并导出结果。
- [选择模型](/models/#model-guide)：连接订阅、API Key、本地模型或兼容端点。
- [继续会话或创建分支](/sessions/)：恢复工作，或在保留历史记录的同时探索其他方案。
- [配置 Pi](/configuration/)：设置偏好、工作目录、指令和可复用资源。
- [了解 Pi 的工作原理](/how-pi-works/)：认识工具、上下文、会话和 Agent 循环。

## 定制 Pi

Pi 可以复用提示词、加载专用指令、添加可执行集成、调整终端界面、连接模型服务，并将这些资源打包分发。请参考[快速开始中的定制方式选择指南](/quickstart/#选择-pi-的定制方式)，选择满足需求的最小机制。

## 自动化或嵌入 Pi

- 使用 [print 模式](/cli/#invocation-and-output)执行单次任务或脚本化任务。
- 使用 [JSON 事件流模式](/json/)，获取单次运行的结构化事件。
- 使用 [RPC 模式](/rpc/)控制独立运行的 Pi 进程。
- 使用 [TypeScript SDK](/sdk/)在应用中运行 Pi。

## 查找参考与安装信息

通过参考文档查阅 [CLI 选项](/cli/)、[设置](/settings/)、[Providers](/providers/)、[快捷键](/keybindings/)和[环境变量](/environment-variables/)。

平台相关帮助请参阅[终端配置](/terminal-setup/)、[Windows](/windows/)、[tmux](/tmux/)、[Android 上的 Termux](/termux/)或[容器化](/containerization/)。

## 安全使用

Pi 的工具和扩展以 Pi 进程本身的权限运行。项目信任设置会控制 Pi 加载哪些项目资源，但不会对工具调用进行沙箱隔离。处理不可信文件、仓库、扩展或无人值守自动化任务前，请阅读[安全](/security/)。
