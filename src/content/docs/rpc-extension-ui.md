---
title: "RPC 扩展界面"
---

# RPC 扩展界面

扩展可以通过 `ctx.ui` 请求用户交互。在 RPC 模式下，受支持的调用会成为请求/响应子协议，与常规 [RPC 命令](/rpc-commands/)和[会话事件](/json/)并行工作。

扩展界面方法分为两类：

- **对话框方法**（`select`、`confirm`、`input`、`editor`）：向标准输出发送 `extension_ui_request`，并等待客户端在标准输入中返回 `id` 匹配的 `extension_ui_response`。
- **发出后即完成的方法**（`notify`、`setStatus`、`setWidget`、`setTitle`、`set_editor_text`）：向标准输出发送 `extension_ui_request`，但不等待响应。客户端可以显示或忽略这些信息。

如果对话框方法包含 `timeout` 字段，超时后 agent 端会自动使用默认值完成请求。客户端无需自行跟踪超时。

## 限制

某些 `ExtensionUIContext` 方法需要直接访问终端界面，因此在 RPC 模式下不受支持或功能受限：

- `custom()` 返回 `undefined`。
- `onTerminalInput()` 返回不执行任何操作的取消订阅函数。
- `setWorkingMessage()`、`setWorkingVisible()`、`setWorkingIndicator()`、`setHiddenThinkingLabel()`、`setFooter()`、`setHeader()`、`addAutocompleteProvider()`、`setEditorComponent()` 和 `setToolsExpanded()` 均不执行任何操作。
- `getEditorText()` 返回 `""`，`getEditorComponent()` 返回 `undefined`。
- `getToolsExpanded()` 返回 `false`。
- `pasteToEditor()` 会委托给 `setEditorText()`，但不执行终端粘贴处理。
- `getAllThemes()` 返回 `[]`，`getTheme()` 返回 `undefined`。
- `setTheme()` 返回 `{ success: false, error: "Theme switching not supported in RPC mode" }`。

注意：RPC 模式下 `ctx.mode` 为 `"rpc"`，`ctx.hasUI` 为 `true`，因为对话框和发出后即完成的方法可通过扩展界面子协议使用。需要真实终端的 TUI 专属功能（例如 `custom()`）应使用 `ctx.mode === "tui"` 进行判断。

## Pi 发出的请求

所有请求都包含 `type: "extension_ui_request"`、唯一的 `id` 和 `method` 字段。

### select

提示用户从列表中选择。对话框方法的 `timeout` 单位为毫秒；如果客户端未及时响应，agent 会自动以 `undefined` 完成请求。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-1",
  "method": "select",
  "title": "Allow dangerous command?",
  "options": ["Allow", "Block"],
  "timeout": 10000
}
```

预期响应：包含 `value`（所选选项字符串）或 `cancelled: true` 的 `extension_ui_response`。

### confirm

请求用户确认是或否。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-2",
  "method": "confirm",
  "title": "Clear session?",
  "message": "All messages will be lost.",
  "timeout": 5000
}
```

预期响应：包含 `confirmed: true/false` 或 `cancelled: true` 的 `extension_ui_response`。

### input

请求用户输入任意文本。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-3",
  "method": "input",
  "title": "Enter a value",
  "placeholder": "type something..."
}
```

预期响应：包含 `value`（输入的文本）或 `cancelled: true` 的 `extension_ui_response`。

### editor

打开多行文本编辑器，可选择预填内容。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-4",
  "method": "editor",
  "title": "Edit some text",
  "prefill": "Line 1\nLine 2\nLine 3"
}
```

预期响应：包含 `value`（编辑后的文本）或 `cancelled: true` 的 `extension_ui_response`。

### notify

显示通知。该方法发出后即完成，不等待响应。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-5",
  "method": "notify",
  "message": "Command blocked by user",
  "notifyType": "warning"
}
```

`notifyType` 字段可设为 `"info"`、`"warning"` 或 `"error"`。省略时默认为 `"info"`。

### setStatus

设置或清除页脚/状态栏中的状态条目。该方法发出后即完成。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-6",
  "method": "setStatus",
  "statusKey": "my-ext",
  "statusText": "Turn 3 running..."
}
```

将 `statusText` 设为 `undefined`（或省略该字段），即可清除对应键的状态条目。

### setWidget

设置或清除显示在编辑器上方或下方的组件（多行文本块）。该方法发出后即完成。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-7",
  "method": "setWidget",
  "widgetKey": "my-ext",
  "widgetLines": ["--- My Widget ---", "Line 1", "Line 2"],
  "widgetPlacement": "aboveEditor"
}
```

将 `widgetLines` 设为 `undefined`（或省略该字段）即可清除组件。`widgetPlacement` 字段可设为 `"aboveEditor"`（默认值）或 `"belowEditor"`。RPC 模式只支持字符串数组，组件工厂会被忽略。

### setTitle

设置终端窗口或标签页标题。该方法发出后即完成。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-8",
  "method": "setTitle",
  "title": "pi - my project"
}
```

### set_editor_text

设置输入编辑器中的文本。该方法发出后即完成。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-9",
  "method": "set_editor_text",
  "text": "prefilled text for the user"
}
```

## 回复 Pi

只有对话框方法（`select`、`confirm`、`input`、`editor`）需要发送响应。响应中的 `id` 必须与请求匹配。

### 值响应（select、input、editor）

```json
{"type": "extension_ui_response", "id": "uuid-1", "value": "Allow"}
```

### 确认响应（confirm）

```json
{"type": "extension_ui_response", "id": "uuid-2", "confirmed": true}
```

### 取消响应（任意对话框）

关闭任意对话框。扩展会收到 `undefined`（适用于 select/input/editor）或 `false`（适用于 confirm）。

```json
{"type": "extension_ui_response", "id": "uuid-3", "cancelled": true}
```

## 示例

请参阅经过验证的 [RPC 扩展界面客户端](../examples/rpc-extension-ui.ts)及其[演示扩展](../examples/extensions/rpc-demo.ts)。

导出的请求和响应联合类型定义在 [`rpc-types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-types.ts) 中。与运行模式无关的扩展指南请参阅[扩展](/extensions/#ui-and-modes)。
