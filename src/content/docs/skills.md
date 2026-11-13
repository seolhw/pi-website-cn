---
title: "添加 Skill"
---

# Skill

Skill 为特定类型的工作提供专用指令和支持文件。Pi 会向模型列出每个可用 Skill 的名称和说明，并只在任务需要时加载完整指令。

当工作流需要比提示模板更多的上下文，但不需要新的可执行集成点时，可以使用 Skill。Skill 可以将脚本、参考资料和资源文件与指令放在一起。

Pi 实现了 [Agent Skills 规范](https://agentskills.io/specification)。大多数无效字段只会触发警告，不会中止启动。

<a id="create-a-skill"></a>
## 创建 Skill

Skill 是一个包含 `SKILL.md` 的目录：

```text
pdf-tools/
├── SKILL.md
├── scripts/
│   └── extract.sh
├── references/
│   └── formats.md
└── assets/
    └── template.json
```

在 `SKILL.md` 中先写 Frontmatter，再写直接明确的指令：

```markdown
---
name: pdf-tools
description: 从 PDF 文件中提取文本和表格。用于阅读、转换或检查 PDF 时。
---

# PDF 工具

转换文档前先阅读 `references/formats.md`。运行脚本时使用相对于此 Skill 目录的路径。
```

模型会根据 description 判断何时加载 Skill。请说明 Skill 的功能以及适用时机。避免使用“帮助处理 PDF”这类信息不足、无法准确路由的说明。

引用 Skill 包含的文件时，请使用相对于 Skill 目录的路径。Pi 会告知模型 Skill 所在位置，使其能够解析这些路径。

<a id="understand-how-skills-load"></a>
## 了解 Skill 的加载方式

启动时，Pi 会扫描已配置的 Skill 位置，并将每个 Skill 的名称、说明和路径添加到系统提示词中，但不会加入完整指令。

任务匹配时，模型会读取 `SKILL.md` 并遵循其中指令。这样可以让详细指导留在上下文之外，直到确有需要。模型可能不会加载相关 Skill；需要强制使用时，请运行 `/skill:name`。

`/skill:name` 后面的参数会作为用户请求追加到已加载的指令中：

```text
/skill:pdf-tools extract report.pdf
```

如果 Skill 只能通过显式命令调用，请在 Frontmatter 中设置 `disable-model-invocation: true`。`enableSkillCommands` [设置](/settings/)控制 Skill 命令是否出现在交互式命令发现中；手动输入的 `/skill:name` 命令仍然有效。

<a id="choose-where-it-loads"></a>
## 将 Skill 添加到 Pi

将 Skill 放入用户目录或项目 Skill 目录中。Pi 会递归发现包含 `SKILL.md` 的目录。

Pi 也支持 Agent Skills 的标准目录 `~/.agents/skills/` 和 `.agents/skills/`。对于项目中的 `.agents/skills/`，Pi 会从当前工作目录向上搜索，遇到仓库根目录时停止。

Pi 可以接受某些独立的 Markdown Skill，但包含 `SKILL.md` 的目录形式可移植性更好，应优先使用。其他可用位置请参阅[设置](/settings/#resources)和 [Pi 包](/packages/)。

项目 Skill 可以指示模型运行脚本或修改文件。授予项目权限前，请检查不熟悉的 Skill 及其支持文件。

<a id="write-portable-frontmatter"></a>
## 编写可移植的 Frontmatter

Agent Skills 规范定义了以下字段：

| 字段 | 用途 |
|---|---|
| `name` | 命令名称和显示名称 |
| `description` | 展示给模型的路由说明 |
| `license` | 许可证名称或随包提供的许可证文件 |
| `compatibility` | 环境要求 |
| `metadata` | 附加键值元数据 |
| `allowed-tools` | 实验性的预先批准工具列表 |
| `disable-model-invocation` | 隐藏 Skill，使模型不能自动选择 |

名称只能使用小写字母、数字和连字符，且不能以连字符开头或结尾，也不能包含连续连字符。名称最多 64 个字符；说明最多 1024 个字符。

Pi 不要求声明的名称必须与父目录名称一致，也不会因此发出警告。其他 Agent Skills 实现可能会强制要求一致，因此保持名称一致可提高可移植性。

格式错误的 `SKILL.md` 文件以及未提供 description 的已声明 Skill 都不会加载。如果多个 Skill 同名，Pi 会保留最先发现的一个并发出警告。

<a id="validate-and-share-a-skill"></a>
## 验证并分享 Skill

从能够发现该 Skill 的位置运行 Pi，然后检查启动诊断信息和 `/skill:name` 命令。在活动会话中修改 Skill 后，请运行 `/reload`。

使用 [Pi 包](/packages/)通过 npm 或 git 分发一个或多个 Skill。将环境设置要求写在 Skill 内，并在软件包中声明所需的运行时依赖。

示例请参阅 [Anthropic Skill 集合](https://github.com/anthropics/skills)和 [Pi Skill 集合](https://github.com/badlogic/pi-skills)。
