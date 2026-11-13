---
title: "快捷键参考"
---

# 快捷键参考

Pi 提供命名操作，例如 `app.session.new`，可为这些操作分配快捷键。你可以修改默认绑定，或为尚未绑定的操作添加快捷键，配置位置为 Pi 的[用户设置](/configuration/#agent-directory)。

运行 `/hotkeys` 可查看主编辑器和应用当前启用的快捷键。

<a id="assign-keybindings"></a>
## 分配快捷键

创建 `<agent-dir>/keybindings.json`。Agent 目录默认为 `~/.pi/agent`，详情请参阅 [Agent 目录](/configuration/#agent-directory)。

将每个操作 ID 映射到一个按键或按键列表：

```json
{
  "$schema": "https://pi.dev/schemas/keybindings.schema.json",
  "app.session.new": "ctrl+shift+n",
  "app.session.tree": ["ctrl+shift+t", "alt+shift+t"]
}
```

配置值会替换该操作的默认绑定。使用空列表可禁用某个操作的快捷键：

```json
{
  "tui.altScreen.pageUp": []
}
```

编辑文件后运行 `/reload`，使更改应用到当前会话。

<a id="key-syntax"></a>
## 按键语法

按 `modifier+key` 的格式书写按键。修饰键包括 `ctrl`、`shift`、`alt` 和 `super`，可以组合使用。有效按键如下：

- **字母：** `a-z`
- **数字：** `0-9`
- **特殊按键：** `escape`、`esc`、`enter`、`return`、`tab`、`space`、`backspace`、`delete`、`insert`、`clear`、`home`、`end`、`pageUp`、`pageDown`、`up`、`down`、`left`、`right`
- **功能键：** `f1`-`f12`
- **符号：** `` ` ``、`-`、`=`、`[`、`]`、`\`、`;`、`'`、`,`、`.`、`/`、`!`、`@`、`#`、`$`、`%`、`^`、`&`、`*`、`(`、`)`、`_`、`+`、`|`、`~`、`{`、`}`、`:`、`<`、`>`、`?`

示例：`ctrl+shift+x`、`alt+ctrl+x`、`ctrl+shift+alt+x`、`super+k`、`ctrl+super+k` 和 `ctrl+1`。

`super` 快捷键需要终端能够单独报告该修饰键，通常需要使用 Kitty 键盘协议。不支持该功能的终端中，这些快捷键可能无法使用。

<a id="actions"></a>
## 操作

<a id="terminal-ui"></a>
### 终端 UI

<a id="cursor-movement"></a>
#### 光标移动

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `tui.editor.cursorUp` | `up` | 光标上移；到达顶部时浏览较早的历史记录 |
| `tui.editor.cursorDown` | `down` | 光标下移；到达底部时浏览较新的历史记录 |
| `tui.editor.historyPrevious` | 无 | 选择上一条提示词历史记录 |
| `tui.editor.historyNext` | 无 | 选择下一条提示词历史记录 |
| `tui.editor.cursorLeft` | `left`、`ctrl+b` | 光标左移 |
| `tui.editor.cursorRight` | `right`、`ctrl+f` | 光标右移 |
| `tui.editor.cursorWordLeft` | `alt+left`、`ctrl+left`、`alt+b` | 光标按单词向左移动 |
| `tui.editor.cursorWordRight` | `alt+right`、`ctrl+right`、`alt+f` | 光标按单词向右移动 |
| `tui.editor.cursorLineStart` | `home`、`ctrl+a` | 移至行首 |
| `tui.editor.cursorLineEnd` | `end`、`ctrl+e` | 移至行尾 |
| `tui.editor.jumpForward` | `ctrl+]` | 向前跳转到指定字符 |
| `tui.editor.jumpBackward` | `ctrl+alt+]` | 向后跳转到指定字符 |
| `tui.editor.pageUp` | `pageUp`、`ctrl+pageUp` | 向上滚动一页 |
| `tui.editor.pageDown` | `pageDown`、`ctrl+pageDown` | 向下滚动一页 |

无论光标位于何处，专用的历史操作都会浏览提示词历史；如果应用操作使用了相同按键，历史操作优先。

<a id="text-editing"></a>
#### 文本编辑

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `tui.editor.deleteCharBackward` | `backspace` | 删除光标前的字符 |
| `tui.editor.deleteCharForward` | `delete`、`ctrl+d` | 删除光标后的字符 |
| `tui.editor.deleteWordBackward` | `ctrl+w`、`alt+backspace` | 删除光标前的单词 |
| `tui.editor.deleteWordForward` | `alt+d`、`alt+delete` | 删除光标后的单词 |
| `tui.editor.deleteToLineStart` | `ctrl+u` | 删除至行首 |
| `tui.editor.deleteToLineEnd` | `ctrl+k` | 删除至行尾 |
| `tui.editor.yank` | `ctrl+y` | 粘贴最近删除的文本 |
| `tui.editor.yankPop` | `alt+y` | 在粘贴后循环切换已删除文本 |
| `tui.editor.undo` | `ctrl+-`（Windows 上为 `ctrl+z`；WSL 上为 `alt+z`） | 撤销上次编辑 |

<a id="input-and-selection"></a>
#### 输入与选择

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `tui.input.newLine` | `shift+enter`、`ctrl+j` | 插入新行 |
| `tui.input.submit` | `enter` | 提交输入 |
| `tui.input.tab` | `tab` | Tab 或自动补全 |
| `tui.input.copy` | `ctrl+c` | 复制所选内容 |
| `tui.select.up` | `up` | 向上移动选项 |
| `tui.select.down` | `down` | 向下移动选项 |
| `tui.select.pageUp` | `pageUp` | 在列表中向上翻页 |
| `tui.select.pageDown` | `pageDown` | 在列表中向下翻页 |
| `tui.select.confirm` | `enter` | 确认选择 |
| `tui.select.cancel` | `escape`、`ctrl+c` | 取消选择 |

<a id="fullscreen"></a>
#### 全屏模式

在全屏模式中，这些操作控制对话记录，并且优先于使用相同按键的编辑器操作。当覆盖层或自动补全、`/settings`、模型选择器等可滚动列表获得焦点时，滚动和提示词跳转操作会作用于该界面，而不是对话记录；因此 `tui.select.pageUp` 和 `tui.select.pageDown` 会移动列表选项。对话记录搜索操作不受影响。

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `tui.altScreen.pageUp` | `pageUp` | 对话记录向上滚动一页 |
| `tui.altScreen.pageDown` | `pageDown` | 对话记录向下滚动一页 |
| `tui.altScreen.halfPageUp` | 无 | 对话记录向上滚动半页 |
| `tui.altScreen.halfPageDown` | 无 | 对话记录向下滚动半页 |
| `tui.altScreen.lineUp` | 无 | 对话记录向上滚动一行 |
| `tui.altScreen.lineDown` | 无 | 对话记录向下滚动一行 |
| `tui.altScreen.previousPrompt` | `ctrl+shift+up`、`ctrl+up`（仅 Windows 和 WSL 使用 `ctrl+up`） | 跳转到上一条已标记消息 |
| `tui.altScreen.nextPrompt` | `ctrl+shift+down`、`ctrl+down`（仅 Windows 和 WSL 使用 `ctrl+down`） | 跳转到下一条已标记消息 |
| `tui.altScreen.search` | `ctrl+shift+f`（Windows 和 WSL 上为 `ctrl+f`） | 搜索已渲染的对话记录 |
| `tui.altScreen.searchNext` | `enter`、`ctrl+g` | 搜索时选择下一个匹配项 |
| `tui.altScreen.searchPrevious` | `shift+enter`、`ctrl+shift+g` | 搜索时选择上一个匹配项 |
| `tui.altScreen.searchClose` | `escape` | 关闭对话记录搜索 |
| `tui.altScreen.top` | `ctrl+home` | 滚动到对话记录开头 |
| `tui.altScreen.bottom` | `ctrl+end` | 滚动到对话记录末尾并跟随新输出 |

<a id="application"></a>
### 应用

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `app.interrupt` | `escape` | 取消或中止 |
| `app.clear` | `ctrl+c` | 清空编辑器（第一次）／退出（第二次） |
| `app.exit` | `ctrl+d` | 退出（编辑器为空时） |
| `app.suspend` | `ctrl+z`（Windows 上无默认值） | 暂停并转入后台 |
| `app.editor.external` | `ctrl+g` | 在外部编辑器中打开（依次使用 `externalEditor`、`$VISUAL`、`$EDITOR`、Windows 上的 Notepad，或其他系统上的 `nano`） |
| `app.clipboard.pasteImage` | `ctrl+v`（Windows 和 WSL 上为 `alt+v`、`ctrl+v`） | 从剪贴板粘贴 macOS 文件、图片或文本 |

原生 Windows 上的 `app.suspend` 默认未绑定，因为 Windows 终端不支持 Unix 作业控制。手动分配后，Pi 会显示状态消息，而不会暂停进程。WSL 使用常规的 `ctrl+z` 和 `fg` 行为。

<a id="sessions"></a>
### 会话

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `app.session.new` | 无 | 开始新会话（`/new`） |
| `app.session.tree` | 无 | 打开会话树导航器（`/tree`） |
| `app.session.fork` | 无 | 分叉当前会话（`/fork`） |
| `app.session.resume` | 无 | 打开会话恢复选择器（`/resume`） |
| `app.session.togglePath` | `ctrl+p` | 切换路径显示 |
| `app.session.toggleSort` | `ctrl+s` | 切换排序模式 |
| `app.session.toggleNamedFilter` | `ctrl+n` | 切换仅显示已命名会话 |
| `app.session.rename` | `ctrl+r` | 重命名会话 |
| `app.session.delete` | `ctrl+d` | 删除会话 |
| `app.session.deleteNoninvasive` | `ctrl+backspace` | 搜索内容为空时删除会话 |

<a id="models-and-thinking"></a>
### 模型与思考

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `app.model.select` | `ctrl+l` | 打开模型选择器 |
| `app.model.cycleForward` | `ctrl+p` | 切换到下一个模型 |
| `app.model.cycleBackward` | `shift+ctrl+p`（Windows 和 WSL 上为 `alt+p`） | 切换到上一个模型 |
| `app.models.save` | `ctrl+s` | 将选定的默认模型或范围模型配置保存到设置 |
| `app.thinking.cycle` | `shift+tab` | 循环切换思考等级 |
| `app.thinking.save` | `ctrl+s` | 将当前思考等级保存到设置 |
| `app.thinking.toggle` | `ctrl+t` | 折叠或展开思考块 |

<a id="display-and-message-queue"></a>
### 显示与消息队列

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `app.tools.expand` | `ctrl+o` | 折叠或展开工具输出 |
| `app.message.copy` | `ctrl+x` | 在 `/tree` 中复制选定消息；在全屏模式中，如果 `fullscreenCopyOnSelect` 为 `false`，则复制当前选区，否则复制最后一条助手消息。在 OAuth 登录页面中复制登录 URL。 |
| `app.message.followUp` | `alt+enter`（Windows 和 WSL 上为 `ctrl+q`） | 将后续消息加入队列 |
| `app.message.dequeue` | `alt+up`（Windows 和 WSL 上为 `alt+q`） | 将排队消息恢复到编辑器 |

<a id="tree-navigation"></a>
### 树状导航

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `app.tree.foldOrUp` | `ctrl+left`、`alt+left` | 折叠当前分支片段，或跳转到上一个片段的起点 |
| `app.tree.unfoldOrDown` | `ctrl+right`、`alt+right` | 展开当前分支片段，或跳转到下一片段的起点或分支末尾 |
| `app.tree.editLabel` | `shift+l` | 编辑选中树节点的标签 |
| `app.tree.toggleLabelTimestamp` | `shift+t` | 切换树中是否显示标签时间戳 |
| `app.tree.filter.default` | `ctrl+d` | 将树筛选器设为默认视图 |
| `app.tree.filter.noTools` | `ctrl+t` | 切换隐藏工具结果的树筛选器 |
| `app.tree.filter.userOnly` | `ctrl+u` | 切换仅显示用户消息的树筛选器 |
| `app.tree.filter.labeledOnly` | `ctrl+l` | 切换仅显示已标记条目的树筛选器 |
| `app.tree.filter.all` | `ctrl+a` | 切换显示所有条目的树筛选器 |
| `app.tree.filter.cycleForward` | `ctrl+o` | 向前循环切换树筛选器 |
| `app.tree.filter.cycleBackward` | `shift+ctrl+o` | 向后循环切换树筛选器 |

<a id="scoped-models-selector"></a>
### 范围模型选择器

在范围模型选择器中使用（通过 `/scoped-models` 打开）。

| 快捷键 ID | 默认值 | 说明 |
|---|---|---|
| `app.models.enableAll` | `ctrl+a` | 启用所有模型，或启用当前搜索匹配的所有模型 |
| `app.models.clearAll` | `ctrl+x` | 清除所有模型，或清除当前搜索匹配的所有模型 |
| `app.models.toggleProvider` | `ctrl+p` | 切换当前 Provider 下所有模型的启用状态 |
| `app.models.reorderUp` | `alt+up` | 在循环顺序中将选中模型上移 |
| `app.models.reorderDown` | `alt+down` | 在循环顺序中将选中模型下移 |
