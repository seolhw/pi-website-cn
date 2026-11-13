---
title: "配置 Pi"
---

# 配置

Pi 支持用户级和项目级配置。用户级配置位于 Agent 目录，默认为 `~/.pi/agent`。项目级配置位于工作目录下的 `.pi` 目录；只有在[信任项目](/security/#understand-project-trust)后才会加载。唯一例外是 `sessionDir`：Pi 会在判定信任状态前读取它，以便定位会话。

在交互模式中，可使用 `/settings` 修改常用偏好。其他选项可以让 Pi 帮你更新配置，也可以直接编辑相应文件。手动修改设置、快捷键、指令或资源后，运行 `/reload` 使更改生效。

<a id="agent-directory"></a>
## Agent 目录

下表中的 `<agent-dir>` 表示 Agent 目录。可通过环境变量 `PI_CODING_AGENT_DIR` 或 SDK 选项 [`agentDir`](/sdk/) 指定其位置。

| 路径 | 用途 |
|---|---|
| `<agent-dir>/settings.json` | 用户级[设置](/settings/)，包括偏好、默认值、资源路径和 Pi 包声明。 |
| `<agent-dir>/keybindings.json` | 自定义终端 UI 和应用[快捷键](/keybindings/)。 |
| `<agent-dir>/mcp.json` | 在所有项目中可用的 [MCP 服务器](/mcp/)。 |
| `<agent-dir>/models.json` | [兼容端点、模型和模型覆盖配置](/models/#configure-a-compatible-endpoint)。 |
| `<agent-dir>/auth.json` | 已保存的 API Key 和 OAuth 凭据。 |
| `<agent-dir>/AGENTS.override.md`、`AGENTS.md`、`AGENTS.MD`、`CLAUDE.md` 或 `CLAUDE.MD` | 对所有工作目录生效的用户指令。 |
| `<agent-dir>/SYSTEM.md` | 替换 Pi 的默认系统提示词。 |
| `<agent-dir>/APPEND_SYSTEM.md` | 向 Pi 的系统提示词追加指令。 |
| `<agent-dir>/extensions/` | 用户级[扩展](/extensions/)。 |
| `<agent-dir>/skills/` | 用户级 [Skill](/skills/) 及其支持文件。 |
| `<agent-dir>/prompts/` | 用户级[提示模板](/prompt-templates/)，可作为斜杠命令使用。 |
| `<agent-dir>/themes/` | 用户级[主题](/themes/)文件。 |

<a id="project-pi-directory"></a>
## 项目 `.pi` 目录

| 路径 | 用途 |
|---|---|
| `.pi/settings.json` | 项目级[设置](/settings/)、资源路径和 Pi 包声明。 |
| `.pi/mcp.json` | 项目级 [MCP 服务器](/mcp/)。 |
| `.pi/SYSTEM.md` | 替换此项目的系统提示词。 |
| `.pi/APPEND_SYSTEM.md` | 向此项目的系统提示词追加指令。 |
| `.pi/extensions/` | 项目扩展。 |
| `.pi/skills/` | 项目 Skill 及其支持文件。 |
| `.pi/prompts/` | 项目提示模板。 |
| `.pi/themes/` | 项目主题文件。 |

对于 `SYSTEM.md` 和 `APPEND_SYSTEM.md`，受信任项目中的文件优先于 Agent 目录中的对应文件。同名文件不会合并。

<a id="context-files"></a>
## 上下文文件

上下文文件独立于项目 `.pi` 配置。Pi 会从 Agent 目录、工作目录及其父目录中查找这些文件。在某个目录或其下级目录运行 Pi 时，该目录中的上下文文件都会生效。

同一目录中的 `AGENTS.override.md` 会取代 `AGENTS.md` 或 `CLAUDE.md`，但不会屏蔽 Agent 目录或其他目录中的上下文文件。

查找上下文文件不需要信任项目。
