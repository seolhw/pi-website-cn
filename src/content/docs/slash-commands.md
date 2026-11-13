---
title: "斜杠命令"
---

# 斜杠命令

在 Pi 的终端编辑器中输入 `/`，即可搜索当前会话中可用的命令。本页列出当前 Pi 版本内置的命令。

扩展、提示模板和 Skill 也可以添加命令。因此，Pi 中的命令菜单才是当前会话所加载资源的准确参考。

<a id="models-and-settings"></a>
## 模型与设置

| 命令 | 说明 |
|---|---|
| `/settings` | 打开设置 |
| `/model [provider/model]` | 选择模型 |
| `/thinking [level]` | 设置思考等级 |
| `/scoped-models` | 配置交互式循环切换使用的模型 |
| `/login [provider]` | 添加 Provider 认证 |
| `/logout` | 移除 Provider 认证 |
| `/llama` | 管理已配置的 llama.cpp 路由器中的模型 |

<a id="sessions-and-context"></a>
## 会话与上下文

| 命令 | 说明 |
|---|---|
| `/new` | 开始新会话 |
| `/resume` | 恢复其他会话 |
| `/name [name]` | 设置会话显示名称；省略参数时显示当前名称 |
| `/session` | 显示当前会话信息和统计数据 |
| `/tree` | 浏览会话树 |
| `/fork` | 从较早的用户消息创建新会话 |
| `/clone` | 在当前位置复制当前会话 |
| `/compact [instructions]` | 压缩当前上下文，可选自定义指令 |
| `/import <path>` | 导入 JSONL 会话，并保留其 ID 和工作目录 |

<a id="export-and-share"></a>
## 导出与分享

| 命令 | 说明 |
|---|---|
| `/copy` | 复制最后一条助手消息 |
| `/export [path]` | 将会话导出为 HTML 或 JSONL |
| `/share` | 上传会话并返回查看链接 |
| `/bug [description]` | 为 Pi 开发者准备私密问题报告 |

导出或分享前请先检查会话。会话可能包含提示词、工具参数、命令输出、文件内容以及处理过程中暴露的凭据。

<a id="runtime-and-project"></a>
## 运行时与项目

| 命令 | 说明 |
|---|---|
| `/trust` | 为后续 Pi 进程保存项目权限决定 |
| `/mcp` | 管理 MCP 服务器：登录、重新连接、启用或禁用，并更改工具暴露方式 |
| `/reload` | 重新加载快捷键、扩展、Skill、提示模板、主题和上下文文件 |
| `/hotkeys` | 显示当前启用的快捷键 |
| `/changelog` | 显示更新日志条目 |
| `/quit` | 退出 Pi |

<a id="commands-added-by-resources"></a>
## 由资源添加的命令

- 扩展可以注册带有自定义参数和补全行为的命令。
- 每个提示模板都可以通过其模板名称使用。
- 启用 Skill 命令后，可通过 `/skill:name` 调用 Skill。

添加或修改已发现的命令资源后运行 `/reload`。相关加载规则请参阅[扩展](/extensions/)、[提示模板](/prompt-templates/)和 [Skill](/skills/)。
