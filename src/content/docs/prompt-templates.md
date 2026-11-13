---
title: "提示模板"
---

# 提示模板

提示模板会将 Markdown 文件转换为可重复使用的 `/` 命令。如果你想复用同一段提示词，又不需要添加可执行行为或一大组配套指令，可以使用提示模板。

模板可以接收参数，并会显示在命令补全中。Pi 可以从个人配置、项目配置、显式指定的路径或 Pi 包中加载模板。项目配置只有在[信任项目](/security/#understand-project-trust)后才会加载。

<a id="create-a-template"></a>
## 创建模板

创建 `~/.pi/agent/prompts/review.md`：

```markdown
---
description: Review staged git changes
argument-hint: "[focus]"
---
Review the staged changes. Focus on ${1:-correctness, security, and error handling}.
```

文件名会成为命令名，因此这个模板可通过 `/review` 使用。`description` 会显示在命令补全中；如果省略，Pi 会使用文件中的第一行非空内容作为描述。

`argument-hint` 是可选项。必需参数使用尖括号表示，可选参数使用方括号表示。

在活动会话中添加或修改模板后，运行 `/reload`。

<a id="invoke-a-template"></a>
## 使用模板

在编辑器中输入模板命令：

```text
/review
/review concurrency
```

在文本进入 Agent 之前，Pi 会先展开模板。如果没有扩展命令使用同名命令处理输入，扩展会通过 `input` 事件先收到原始输入。

模板支持以下替换语法：

| 语法 | 替换结果 |
|---|---|
| `$1`、`$2`、…… | 对应位置的单个参数 |
| `$@` 或 `$ARGUMENTS` | 以空格连接的全部参数 |
| `${1:-default}` | 第一个参数；未提供时使用默认值 |
| `${@:-default}` | 全部参数；未提供时使用默认值 |
| `${@:N}` | 从第 `N` 个位置开始的参数 |
| `${@:N:L}` | 从第 `N` 个位置开始的 `L` 个参数 |

参数使用类似 Shell 的引号规则，因此 `/review "API compatibility"` 会传入一个包含空格的参数。只有引号出现在参数开头时才会开始引用，所以 `doesn't` 这样的单词内部撇号会保留为普通文本；没有匹配结束引号时，输入也会作为文本保留。在带引号的参数中，反斜杠只有在转义相同的引号字符时才会被处理，因此 `/review "the \"fast\" path"` 会传入 `the "fast" path`；其他反斜杠都会按原样保留。

<a id="choose-where-it-loads"></a>
## 将模板添加到 Pi

将模板放入用户级或项目级提示模板目录。默认情况下，常规提示模板目录只加载其直接子目录中的 `.md` 文件。

设置和 Pi 包可以选择嵌套目录中的 Markdown 文件；包清单还可以通过显式路径和 glob 限定发现范围。详情请参阅[设置](/settings/#resources)和 [Pi 包](/packages/)。

授予项目权限后，项目模板才会成为编辑器中的命令。信任陌生项目之前，请先检查模板内容。详情请参阅[安全](/security/#understand-project-trust)。
