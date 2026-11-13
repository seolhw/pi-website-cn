---
title: "创建主题"
---

# 使用主题自定义 Pi

主题控制 Pi 在交互模式和 HTML 导出中使用的颜色。Pi 内置 `system`、`dark` 和 `light` 三种主题。你可以选择固定主题、跟随终端的浅色或深色外观，也可以创建自己的调色板。

<a id="use-your-terminals-colors"></a>
## 使用终端颜色

`system` 是默认主题。它会根据终端主题生成 Pi 的颜色，使 Pi 融入终端，而不是另外套用一套配色：

- Pi 会查询终端默认的前景色、背景色和 16 种 ANSI 颜色。
- Pi 的每种颜色都取自一种 ANSI 颜色的色相，例如错误颜色取自红色，链接颜色取自蓝色。
- Pi 会调整每种颜色的亮度，使其与背景之间达到最小对比度。正文与背景以及各面板之间均保持至少 4.5:1 的 WCAG 对比度。
- 终端在浅色和深色外观之间切换时，Pi 会重新查询颜色并重新生成主题。

主题会根据终端报告的信息调整：

| 终端报告内容 | 结果 |
|---|---|
| 背景色和 ANSI 颜色 | 使用终端调色板的颜色，并根据实际背景进行调整。 |
| 仅背景色 | 使用 Pi 自有色相，并根据实际背景进行调整。 |
| 无 | 使用 ANSI 颜色索引和终端默认颜色，由终端自行渲染。辅助文字会较淡，面板没有背景色。 |

Pi 会在启动时向终端查询颜色。终端通常会在几毫秒内响应；Pi 最多等待 100 毫秒，然后显示启动信息。如果终端未及时响应，Pi 会先使用 ANSI 颜色作为回退方案；颜色稍后到达时仍会应用，例如通过较慢的 SSH 连接使用终端时。`system` 是保留名称，同名自定义主题会被忽略。

<a id="selecting-a-theme"></a>
## 选择主题

打开 `/settings` 并选择 **Theme**。你可以为所有终端外观使用同一个主题，也可以分别为浅色和深色终端指定主题。

所选主题会作为 `theme` [设置](/settings/#terminal-and-display)保存：

```json
{
  "theme": "dark"
}
```

未设置 `theme` 时，Pi 使用 `system`。

自动模式依次保存浅色主题和深色主题：

```json
{
  "theme": "light/dark"
}
```

Pi 会根据终端报告的背景色和前景色判断终端属于浅色还是深色。如果终端没有报告背景色，Pi 会依次使用终端的浅色/深色通知、`COLORFGBG` 环境变量，最后默认深色。这个判断既用于选择浅色/深色主题对中的主题，也用于 `system` 主题。启用自动模式时，如果终端报告外观发生变化，Pi 会切换主题。主题名称不能包含 `/`，因为 Pi 将其保留为此设置格式的分隔符。

使用 `--use-theme` 可为单次运行选择初始主题，而不修改已保存的设置：

```bash
pi --use-theme light
pi --use-theme light/dark
```

命令行选项请参阅 [CLI 资源](/cli/#resources)。

<a id="create-a-custom-theme"></a>
## 创建自定义主题

复制一个[内置主题](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/src/modes/interactive/theme)，或创建符合[主题架构](https://pi.dev/schemas/theme.schema.json)的新 JSON 文件。内置主题使用 OKHSL 颜色，并通过变量复用多个角色共享的颜色，因此可以直接调整色相、饱和度或亮度。

1. 将文件保存为 `<agent-dir>/themes/my-theme.json`。Agent 目录默认为 `~/.pi/agent`。
2. 将 `name` 设置为 `my-theme`。
3. 修改 `vars` 和 `colors` 中的值。
4. 通过 `/settings` 选择 `my-theme`。

文件名应使用主题名称。Pi 只会从 `<agent-dir>/themes/<name>.json` 热加载当前活动的用户主题。从其他来源添加或修改主题后，请运行 `/reload`。

<a id="understand-the-theme-file"></a>
## 了解主题文件

| 属性 | 必填 | 用途 |
|---|---|---|
| `$schema` | 否 | 根据 Pi 发布的架构启用编辑器校验和自动补全。 |
| `name` | 是 | 主题在选择器和设置中的标识。名称必须唯一，不能包含 `/`，也不能为 `system`。 |
| `appearance` | 否 | `"dark"` 或 `"light"`，表示主题适配的背景类型。省略时 Pi 会根据主题颜色推断。 |
| `vars` | 否 | 定义可复用的颜色值。变量可以引用其他变量。 |
| `colors` | 是 | 为终端 UI 角色指定颜色。架构中列明了必需和可选的角色。 |
| `export` | 否 | 覆盖 HTML 导出中的页面和面板背景色。 |

主题对象采用严格格式：只接受文档中说明的顶层字段和颜色令牌。可复用的自定义颜色应定义在 `vars` 下；`colors` 或 `export` 中的自定义键以及额外的顶层元数据都会被拒绝。

颜色可以使用以下六种形式：

| 格式 | 示例 | 含义 |
|---|---|---|
| RGB 十六进制 | `"#0af"` 或 `"#00aaff"` | 三位或六位 sRGB 颜色。 |
| OKLCH | `"oklch(62% 0.1 200)"` | 感知亮度、色度和色相。 |
| OKHSL | `"okhsl(250 60% 55%)"` | 色相、饱和度和亮度。饱和度相对于该色相和亮度下 sRGB 色域所允许的最大值，因此所有值都在色域内，相同饱和度看起来也具有相同的鲜艳程度。 |
| 256 色索引 | `39` | `0` 到 `255` 之间的 ANSI 调色板索引。 |
| 变量引用 | `"primary"` | `vars` 中对应条目的值。 |
| 终端默认值 | `""` | 终端默认的前景色或背景色。 |

终端默认颜色会使用终端自身的颜色渲染。需要具体颜色的场景（例如 HTML 导出或扩展颜色计算）会使用终端报告的默认颜色；如果无法获取，则根据主题外观推测为黑色或白色。

Pi 会解析链式变量引用。缺失变量或循环引用会导致主题无效。支持真彩色时 Pi 会使用真彩色；OKLCH 会映射到 sRGB 色域；在 256 色终端中则会近似匹配颜色。HTML 导出会将 OKHSL 转换为十六进制，因为 CSS 不支持 OKHSL。如果颜色与源值不一致，请检查终端的真彩色检测和对比度设置。详情请参阅[配置终端](/terminal-setup/#override-detected-capabilities)。

准确的属性、必需颜色和可接受的值类型请以[主题 JSON 架构](https://pi.dev/schemas/theme.schema.json)为准。

启动和运行 `/reload` 时，Pi 会报告无效的主题文件。

<a id="find-the-color-to-change"></a>
## 查找要修改的颜色

主题颜色描述的是界面角色，而不是单个组件。可按以下类别在架构中查找：

| 区域 | 颜色名称 |
|---|---|
| 通用界面 | `accent`、`border*`、`text`、`muted`、`dim`、`success`、`error`、`warning` |
| 选择状态和全屏界面 | `selectedBg`、`searchMatch*`、`scrollbar*` |
| 消息 | `userMessage*`、`customMessage*`、`thinkingText` |
| 工具执行 | `toolPendingBg`、`toolSuccessBg`、`toolErrorBg`、`toolTitle`、`toolOutput` |
| Markdown | `md*` |
| 工具差异 | `toolDiff*` |
| 语法高亮 | `syntax*` |
| 编辑器模式 | `thinking*`、`bashMode` |
| HTML 导出 | `export.pageBg`、`export.cardBg`、`export.infoBg` |

架构是格式规范；内置主题提供了可复制和调整的完整配置。

以下五种颜色为可选项，省略时会继承其他颜色：

| 可选颜色 | 回退值 |
|---|---|
| `scrollbarTrack` | `muted` |
| `scrollbarThumb` | `text` |
| `searchMatchBg` | `selectedBg` |
| `searchMatchText` | `text` |
| `thinkingMax` | `thinkingXhigh` |

如果省略 `export` 颜色，Pi 会根据 `userMessageBg` 推导 HTML 页面和面板的背景色。

<a id="load-a-theme-from-a-project-or-package"></a>
## 从项目或软件包加载主题

将项目主题放入 `.pi/themes/`。只有在授予[项目权限](/security/#understand-project-trust)后，才会加载项目主题。

也可以通过 `themes` 设置加载主题文件或目录，或将主题放入 Pi 软件包分发。详情请参阅[配置](/configuration/)、[设置](/settings/#resources)和 [Pi 软件包](/packages/#package-guide)。

每个已加载主题的名称必须唯一。Pi 会将重复名称报告为资源冲突。
