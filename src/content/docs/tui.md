---
title: "构建终端界面组件"
---

# 终端界面

`@earendil-works/pi-tui` 提供 Pi 使用的终端组件系统。当内置对话框、通知、状态文本和 widget 无法满足交互需求时，扩展可以使用它。

优先使用[扩展](/extensions/#interact-with-the-user)提供的 `ctx.ui` 方法。只有当界面需要自定义渲染、键盘或鼠标输入、焦点、布局或生命周期时，才构建自定义组件。

## 选择集成方式

| 需求 | 方案 |
|---|---|
| 选择、确认、输入或多行编辑器 | `ctx.ui.select()`、`confirm()`、`input()` 或 `editor()` |
| 非阻塞反馈 | `ctx.ui.notify()` 或 `setStatus()` |
| 编辑器附近的持久内容 | `ctx.ui.setWidget()` |
| 替换页眉、页脚或编辑器 | 对应的 `ctx.ui` 组件工厂 |
| 临时交互界面或覆盖层 | `ctx.ui.custom()` |
| 自定义渲染工具或会话条目 | 扩展渲染器 |

这些 API 会在需要时接收 Pi 当前主题和快捷键配置。不要在扩展中再创建一套终端渲染器。

## 理解组件模型

组件会根据可用宽度渲染终端行数组。它可以选择处理键盘和鼠标输入；状态或依赖主题的内容发生变化时，必须使缓存输出失效。

每行渲染结果都必须适合给定宽度。应测量终端中实际显示的列数，而不是字符串长度，因为 ANSI 转义序列、宽字符、emoji 和组合字符都会影响显示宽度。

请使用 `visibleWidth()`、`truncateToWidth()`、`sliceByColumn()` 和 `wrapTextWithAnsi()`，不要自行实现终端宽度处理。Pi 会在每行结束后重置样式和超链接，因此每行渲染时都要重新应用样式。

更改组件状态后，应使受影响组件的缓存失效，并调用注入的 `tui.requestRender()`。TUI 会合并渲染请求并更新终端。

## 组合内置组件

该软件包提供常用布局和控件组件：

- `Text`、`Markdown`、`Image` 和 `TruncatedText` 用于渲染内容。
- `Container`、`VStack`、`HStack`、`Box` 和 `Spacer` 用于组合布局。
- `Input` 和 `Editor` 用于接收文本输入。
- `SelectList` 和 `SettingsList` 用于实现可搜索选择和设置流程。
- `ScrollView` 提供有界的可滚动视口。
- `Loader` 和 `CancellableLoader` 用于显示进行中的任务。
- `MouseRegion` 为其他组件添加指针交互行为。

应优先使用这些组件，而不是重新实现选择、滚动、文本编辑或宽度处理。扩展示例展示了如何将它们与 Pi 的边框和主题结合使用。

## 处理键盘输入与焦点

使用 `matchesKey()` 和 `Key` 处理终端键盘输入。解析器会考虑终端协议和按键修饰符。扩展组件应使用注入的 `KeybindingsManager` 处理可配置的应用操作。

显示文本光标的组件应实现 `Focusable`，并将 `CURSOR_MARKER` 放在可见光标之前。使用 `renderFakeCursor()` 包裹光标单元格，使 TUI 以反显方式绘制；显示硬件光标时，TUI 会隐藏标记后的假光标。TUI 还会利用该标记为输入法定位硬件光标。

包裹 `Input` 或 `Editor` 的容器必须将自身的 `focused` 状态传递给子组件。否则，中日韩等输入法的候选窗口可能出现在错误的屏幕位置。

替换主编辑器时，应扩展 Pi 的 `CustomEditor`，以保留应用快捷键和 agent 控件。

将编辑器未处理的按键转发给基类实现；清除自定义编辑器工厂即可恢复默认编辑器。

## 处理鼠标输入

全屏模式会将规范化的鼠标事件路由给组件。事件处理器可以标记事件已处理、捕获拖动序列、请求焦点或请求重新渲染。

未处理的滚轮事件会滚动最近的 `ScrollView`。未处理的主键拖动仍可用于选择对话记录。OSC 8 链接的优先级高于包围它的点击区域。

普通模式将鼠标输入交给终端处理，因为滚动历史由终端控制。即使全屏模式支持鼠标，也应确保每种交互都有键盘操作方式。

## 使用自定义界面和覆盖层

`ctx.ui.custom()` 会暂时将交互区域交给一个组件控制，并在该组件调用提供的完成回调时结束。

<a id="build-a-minimal-custom-screen"></a>

### 构建最小自定义界面

下面的完整扩展展示了自定义组件的生命周期：在给定宽度内渲染、使用注入的快捷键、在状态变化后使缓存失效、请求重新渲染，并通过 `done()` 结束交互。

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("pick-target", {
    description: "Pick a deployment target",
    handler: async (_args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("pick-target requires interactive mode", "error");
        return;
      }

      const choices = ["development", "staging", "production"];
      const selected = await ctx.ui.custom<string | undefined>((tui, theme, keybindings, done) => {
        let selectedIndex = 0;
        let cachedWidth: number | undefined;
        let cachedLines: string[] | undefined;

        const invalidate = () => {
          cachedWidth = undefined;
          cachedLines = undefined;
        };

        return {
          render(width: number): string[] {
            if (cachedLines && cachedWidth === width) return cachedLines;

            cachedWidth = width;
            cachedLines = [
              theme.fg("accent", "Choose a deployment target"),
              ...choices.map((choice, index) => `${index === selectedIndex ? "> " : "  "}${choice}`),
              theme.fg("dim", "up/down move, enter selects, escape cancels"),
            ].map((line) => truncateToWidth(line, width));
            return cachedLines;
          },
          handleInput(data: string): void {
            if (keybindings.matches(data, "tui.select.up")) {
              selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
            } else if (keybindings.matches(data, "tui.select.down")) {
              selectedIndex = (selectedIndex + 1) % choices.length;
            } else if (keybindings.matches(data, "tui.select.confirm")) {
              done(choices[selectedIndex]);
              return;
            } else if (keybindings.matches(data, "tui.select.cancel")) {
              done(undefined);
              return;
            } else {
              return;
            }

            invalidate();
            tui.requestRender();
          },
          invalidate,
        };
      });

      if (selected) ctx.ui.notify(`Selected ${selected}`, "info");
    },
  });
}
```

该组件不显示文本光标，因此无需实现 `Focusable`。包含 `Input` 或 `Editor` 的组件必须实现 `Focusable`，并将 `focused` 值传递给对应子组件。

自定义组件不会自动将 pi 报告为等待用户操作，因为 `ctx.ui.custom()` 也用于显示加载器和其他非阻塞界面。当组件确实在等待用户回答时，请传入 `blocked: { kind: "question", message: "Pick a color" }`，这样支持[程序状态协议](/terminal-setup/#program-status)的终端会将 pi 显示为受阻状态。`kind` 可以是 `"question"`、`"permission"` 或 `"auth"`。内嵌组件仅在可见时报告受阻状态；若有更新的对话框或组件覆盖它，则改为报告新界面的状态。覆盖层从显示开始到调用 `done()` 为止都会报告受阻，即使通过 `setHidden()` 隐藏或被其他覆盖层遮挡也一样。若同时打开多个阻塞式提示，则以最近显示的提示提供 `kind` 和 `message`。

传入 `overlay: true` 可在现有内容上方绘制。覆盖层选项用于控制尺寸、锚点、偏移、边距和响应式可见性。交互仍在进行时，覆盖层句柄可以更改焦点，或通过 `setHidden()` 临时隐藏和重新显示覆盖层。

获得焦点的覆盖层在常规重绘期间仍会保留输入控制权。如果覆盖层继续显示，但需要其他组件接收输入，请通过句柄显式释放或转移焦点。

每个自定义组件实例都应只服务于一次交互。再次启动交互时，请创建新的组件实例。

使用组件工厂提供的完成回调结束交互。该回调会完成 `ctx.ui.custom()` 返回的 Promise，并释放组件。对于由 `ctx.ui.custom()` 创建的覆盖层，不要调用 `OverlayHandle.hide()`。

覆盖层的位置、层叠、焦点、响应式可见性和动画行为，请参阅 [`overlay-qa-tests.ts`](../examples/extensions/overlay-qa-tests.ts)。

<a id="apply-themes-correctly"></a>

## 正确应用主题

使用传递给扩展或组件回调的主题。主题辅助函数会为强调色、弱化文本、成功、警告、错误、工具输出和 Markdown 等语义颜色生成带 ANSI 样式的字符串。

使用 `theme.style()` 将前景色、背景色和文本属性组合起来：

```typescript
return new Text(
  theme.style("Done!", {
    fg: "success",
    bg: "toolSuccessBg",
    bold: true,
  }),
  0,
  0,
);
```

样式颜色可以是语义主题 token，也可以是具体的 `Color`。前景 token 用作 `fg`，背景 token 用作 `bg`；若要在另一位置使用某个 token 的颜色，请传入其具体颜色，例如 `{ fg: theme.colors.userMessageBg }`。通过 `theme.colors` 获取具体颜色；需要颜色运算时，可使用 `@earendil-works/pi-tui` 中的 `mixColors()` 等工具。如果主题将某个 token 设为终端默认色，渲染时会使用终端自身颜色；`theme.colors` 会返回终端报告的颜色，若终端未报告则返回估算值。可根据 `theme.appearance`（`"dark"` 或 `"light"`）决定是否调亮或调暗颜色。Pi 会根据终端能力将结果转换为真彩色或 256 色输出。每种主题只会转换一次 token；如有可能，应在渲染路径之外计算具体颜色。

仍可使用现有的 `theme.fg()` 和 `theme.bg()` 辅助函数应用单一语义颜色。

除非 `invalidate()` 会重新生成字符串，否则不要长期保存带主题颜色的字符串。主题切换会清除渲染缓存，但无法移除应用状态中已经嵌入的旧 ANSI 颜色。

渲染过程中执行的主题回调无需特殊重建。无状态组件也可以在每次渲染时重新计算带主题的输出。

创建终端配色方案请参阅[主题](/themes/)。渲染需要匹配当前应用主题的 Markdown 时，请使用 Pi 的 `getMarkdownTheme()`。

## 保持渲染流畅

渲染位于交互关键路径上。应按宽度和内容缓存开销较大的布局与语法高亮结果，并通过 `invalidate()` 清除缓存。

默认视图应保持紧凑，详细内容可通过展开或独立界面查看。自定义工具渲染应处理部分结果；若可安全更新，则复用已有组件。

排查渲染问题时，可使用 `PI_TUI_WRITE_LOG` 捕获原始 ANSI 流。请测试窄宽度、宽字符、窗口尺寸变化、主题切换、焦点转换，以及普通和全屏模式。

## 示例与源码

经过验证的扩展示例涵盖了以下主要模式：

- [`preset.ts`](../examples/extensions/preset.ts) 和 [`tools.ts`](../examples/extensions/tools.ts)：使用选择列表和设置列表。
- [`qna.ts`](../examples/extensions/qna.ts)：使用可取消的异步界面。
- [`modal-editor.ts`](../examples/extensions/modal-editor.ts)：替换编辑器。
- [`custom-footer.ts`](../examples/extensions/custom-footer.ts)：替换页脚。
- [`widget-placement.ts`](../examples/extensions/widget-placement.ts)：在编辑器周围放置持久内容。
- [`doom-overlay/`](../examples/extensions/doom-overlay/)：展示持续渲染的覆盖层。

公开导出定义在 [`packages/tui/src/index.ts`](https://github.com/earendil-works/pi/blob/main/packages/tui/src/index.ts)。扩展生命周期、状态、工具、事件和运行模式请参阅[扩展](/extensions/)。
