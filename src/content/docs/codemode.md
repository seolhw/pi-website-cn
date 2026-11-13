---
title: "Codemode 脚本"
---

# Codemode 脚本

`codemode` 工具允许模型编写 JavaScript 脚本，调用 Pi 的其他工具并运行非 LLM 模型，例如分类器和图像模型。只有脚本的输出会返回给模型，因此脚本可以并行调用工具，并在模型看到结果前筛选大量数据。启用方法请参阅[启用 codemode](/cli/#enable-codemode)。

## 脚本

工具输入是原始 JavaScript 源码，而不是 JSON 或 Markdown 代码围栏。脚本会作为异步函数体在 QuickJS 沙箱中运行，因此可以在顶层使用 `await` 和 `return`。沙箱不提供 Node API、文件系统、网络或计时器；脚本只能通过工具和 `models` 与外部交互。

脚本可以用选项行开头，但该行必须位于第一行；若出现在其他位置，调用会在脚本运行前失败：

```js
// @options: {"max_output_tokens": 2000, "timeout_ms": 60000}
```

- `max_output_tokens`（默认值为 10000）限制输出长度。超出限制时，输出会保留开头和结尾，完整文本则写入临时文件，结果中会附上文件路径。如果文本和 Base64 图像数据总计超过 16777216 个字符，或 `text()`、`image()` 和 `console` 调用次数超过 100000 次，脚本就会失败；大量数据应改用工具写入文件。
- `timeout_ms` 为整个脚本设置硬性截止时间，其中包括等待空闲 worker 的时间。默认不设超时。图像生成可能需要数分钟，因此生成图像时不要设置过短的超时时间。

结果会先显示 `Script completed` 或 `Script failed`、耗时和输出。文本与图像按产生顺序逐项显示，每项独占一行。如果输出包含多个文本项（由 `text()` 或 `return` 产生），每项前会有一行 `==> text N/M <==`。`console` 调用会集中显示在 `<console_output>` 区块中，每次调用占一行。脚本失败时，已产生的部分输出仍会保留，之后显示 `Script error:` 和错误信息。工具调用会实际执行：脚本失败前已完成的调用不会撤销。脚本结束时仍在运行的调用会被取消，未等待的 Promise 会被丢弃。

## 全局对象

| 全局对象 | 用途 |
|---|---|
| `tools.<name>(args)` | 调用工具，详见[调用工具](#call-tools)。 |
| `text(value)` | 向输出添加文本项。字符串原样输出，其他值以 JSON 形式输出。 |
| `image(value)` | 向输出添加图像：可传入 Base64 `data:` URL、`{ image_url }` 对象，或图像块 `{ type: "image", data, mimeType }`。不支持远程 URL；支持 PNG、JPEG、GIF 和 WebP。图像也会保存到临时文件，结果会在图像前显示文件路径。 |
| `console.log(...)` | 在其他输出之后，向 `<console_output>` 区块添加一行。参数以空格连接；`info`、`warn`、`error` 和 `debug` 的行为相同。 |
| `return value` | 顶层 `return` 会像 `text()` 一样将值添加到输出。 |
| `exit()` | 正常结束脚本。 |
| `store(key, value)` / `load(key)` | 在多次 `codemode` 调用之间保存少量 JSON 值，详见[存储值](#store-values)。 |
| `ALL_TOOLS` | 所有可调用工具，格式为 `{ name, description }`，包括描述中未列出的工具。 |
| `searchTools(query, { limit?, namespace? })` | 按相关度（BM25）搜索可调用工具，默认最多返回 8 项，结果为 `{ name, description }[]`。 |
| `describeTool(name)` | 返回工具说明和 TypeScript 声明；找不到时返回 `undefined`。 |
| `describeNamespace(name)` | 返回命名空间（例如 MCP 服务器）的 `{ name, description?, instructions?, tools }`；找不到时返回 `undefined`。 |
| `models` | 列出并运行非 LLM 模型，详见[模型](#models)。 |

<a id="call-tools"></a>
## 调用工具

会话可调用的每个工具都是 `tools` 的一个方法，方法名取自工具标识符：不能用于 JavaScript 标识符的字符会替换为 `_`。例如，MCP 工具 `mcp__dev-radius__search` 对应 `tools.mcp__dev_radius__search`。每个方法都接收一个包含工具参数的对象。

调用的返回值取决于工具类型：

- 带有输出架构的工具会返回结构化值。`bash` 返回 `{ output, truncated, full_output_path?, exit_code, wall_time_seconds }`，非零退出码时也一样。其 `output` 最多可达 1 MiB，不受模型可见的 2000 行或 50 KB 限制；更长的输出会保留开头和结尾各 512 KiB，中间插入省略标记，同时设置 `truncated`，并通过 `full_output_path` 提供完整输出路径。
- MCP 工具返回 `CallToolResult`，其中包括 `isError` 和 `structuredContent`。
- `read` 返回文件文本；读取图像时返回 `{ type: "image", data, mimeType, note }` 图像块，可用 `image()` 展示。`data` 是模型可读取的 Base64 图像数据，`note` 是附带说明，例如调整尺寸的提示。
- 其他工具（例如 `edit` 和 `write`）返回文本。

调用失败、被阻止或参数无效时，会抛出包含错误文本的 `Error`。使用 `Promise.allSettled()` 可以保留成功调用的结果。

`codemode` 描述会按命名空间（例如某个 MCP 服务器）列出工具及其 TypeScript 声明。具有 `deferred` 暴露级别的工具不会列出，其中包括默认使用 `codemode` 暴露级别的 MCP 工具，因此 MCP 服务器连接时该描述不会改变。已列出的声明共占用约 3000 个 token 的预算（参见[设置](/settings/#tools)中的 `codemode.inlineBudget`）。脚本可通过 `searchTools()`、`describeTool()`、`describeNamespace()` 或筛选 `ALL_TOOLS` 来查找其他工具。

启用 `codemode` 后，[设置](/settings/#tools)中的 `codemode.mode` 决定其他工具的呈现方式。默认值 `on` 会保留已声明的工具，并在工具说明中提供从脚本调用的方法。设为 `only` 时，工具会从模型的直接工具列表中隐藏，改为列在 `codemode` 描述中，由模型通过脚本调用。`codemode` 描述、`describeTool()` 和 `ALL_TOOLS` 中的工具声明包含相应的提示指引，因为系统提示词规则只覆盖直接声明的工具。

<a id="store-values"></a>
## 存储值

`store(key, value)` 会用字符串键保存 JSON 值，供后续 `codemode` 调用使用；保存 `undefined` 会删除该键。`load(key)` 返回对应值，不存在时返回 `undefined`。只有脚本成功执行后，写入才会保留：成功保存值的脚本会向会话追加一个 `codemode-store` 自定义条目，因此恢复会话后仍可读取这些值，而各分支只能看到自己路径上写入的值。

此存储适合保存 ID、游标或摘要等少量状态。单个值最多包含 262144 个 JSON 字符，所有值合计最多 1048576 个字符。不要在其中保存图像数据；使用 `image()` 展示图像，该函数也会将图像保存到临时文件。

<a id="models"></a>
## 模型

`models` 可以访问模型目录，并使用当前会话的凭据运行非 LLM 模型：分类器可针对 JSON 状态（部分模型也包括图像）回答类型化问题；图像模型则用于生成图像。聊天模型会列出，但不能从脚本中运行。可用的分类器和图像模型请参阅[使用分类器模型](/models/#use-classifier-models)和[使用图像模型](/models/#use-image-models)。

```ts
type ModelType = "chat" | "image" | "classifier";

/** A catalog entry. `provider` and `id` identify it; other fields depend on the type. */
interface ModelInfo {
  type?: ModelType;
  provider: string;
  id: string;
  name: string;
  api: string;
  input: ("text" | "image")[];
  contextWindow?: number;
  [key: string]: unknown;
}

declare const models: {
  /** Every known model of a type, optionally for one provider. */
  getModelsOfType(type: ModelType, provider?: string): Promise<ModelInfo[]>;
  /** Models of a type whose provider has working credentials. */
  getAvailableOfType(type: ModelType, provider?: string): Promise<ModelInfo[]>;
  /** One catalog entry, or undefined. */
  getModelOfType(type: ModelType, provider: string, id: string): Promise<ModelInfo | undefined>;
  /** Answer `context.questions` about `context.state`; answers are in `result.answers` by question ID. */
  classify(model: ModelInfo, context: ClassifierContext): Promise<ClassifierResult>;
  /** Generate images from `context.input` text and image blocks; show `result.output` blocks with image(). Can take minutes. */
  generateImages(model: ModelInfo, context: ImagesContext): Promise<ImagesResult>;
};
```

`classify()` 和 `generateImages()` 只使用 `model` 的 `provider` 与 `id`，因此也可以直接传入 `{ provider, id }`。Provider 出错时它们不会抛出异常，应检查 `stopReason` 和 `errorMessage`。每个脚本最多同时运行四个此类调用；超出的调用会等待空闲名额，因此可以对多个项目使用 `Promise.all()`。这些调用的用量会加入 `codemode` 工具结果，并计入会话成本。

同一模型在不同 Provider 下的 ID 可能不同，例如 `typesafe/jev-latest` 和 `openrouter/typesafe/jev-1.13`。使用 `models.getAvailableOfType(type)` 可查找当前凭据可用的模型 ID。

<a id="classify"></a>

### 分类

```ts
interface ClassifierContext {
  /** The data to classify. */
  state: Record<string, unknown>;
  /** Images judged together with `state`. Only models whose `input` includes "image" accept them. */
  images?: { type: "image"; data: string; mimeType: string }[];
  /** Questions by ID. One call answers all of them. */
  questions: Record<string, ClassifierQuestion>;
}

type ClassifierQuestion =
  /** Pick one label. `criteria` maps each label to what it means. */
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  /** Score on an ordered scale. `criteria` describes each level, lowest first. */
  | { type: "score"; instructions: string; criteria: string[] }
  /** Yes or no. */
  | { type: "bool"; instructions: string; criteria: { true: string; false: string } };

interface ClassifierResult {
  provider: string;
  model: string;
  /** Answers by question ID. */
  answers: Record<string, ClassifierAnswer>;
  usage?: ModelUsage;
  stopReason: "stop" | "error" | "aborted";
  errorMessage?: string;
}

type ClassifierAnswer =
  | { type: "choice"; choice: string; probabilities: Record<string, number>; confidence: number }
  /** `score` is the expected level index, from 0 to `criteria.length - 1`. */
  | { type: "score"; score: number; confidence: number }
  /** Probability of `true`. */
  | { type: "bool"; probability: number };

/** Token counts and cost in USD, when the service reports them. */
type ModelUsage = { input: number; output: number; totalTokens: number; cost: { total: number } };
```

每个项目分别调用一次 `classify()`，即可对多个项目进行分类。下面的脚本会对反馈消息进行分类，例如脚本前面由工具返回的消息：

```js
const jev = await models.getModelOfType("classifier", "typesafe", "jev-latest");
const results = await Promise.all(
  messages.map((message) =>
    models.classify(jev, {
      state: { message },
      questions: {
        sentiment: {
          type: "choice",
          instructions: "How does the user feel about the product?",
          criteria: { positive: "Satisfied or happy", negative: "Unhappy or frustrated", neutral: "Neither" },
        },
        urgency: {
          type: "score",
          instructions: "How urgently does this need a reply?",
          criteria: ["no reply needed", "reply this week", "reply today"],
        },
      },
    }),
  ),
);
return results.map((result, i) =>
  result.stopReason === "stop"
    ? { message: messages[i], sentiment: result.answers.sentiment.choice, urgency: result.answers.urgency.score }
    : { message: messages[i], error: result.errorMessage },
);
```

`input` 包含 `"image"` 的分类器也能分析图像。`tools.read()` 会将图像文件作为 `images` 可接收的图像块返回。其他分类器在 `images` 非空时会返回错误结果。

```js
const luna = await models.getModelOfType("classifier", "openai", "gpt-6-luna");
const photo = await tools.read({ path: "screenshot.png" });
const result = await models.classify(luna, {
  state: { task: "Settings page redesign" },
  images: [photo],
  questions: {
    broken: {
      type: "bool",
      instructions: "Does the screenshot show a broken layout?",
      criteria: { true: "Overlapping, cut-off, or misaligned elements", false: "Clean layout" },
    },
  },
});
```

<a id="generate-images"></a>

### 生成图像

```ts
interface ImagesContext {
  /** The prompt as text blocks, plus image blocks to edit or use as references. */
  input: (TextBlock | ImageBlock)[];
}

interface ImagesResult {
  provider: string;
  model: string;
  /** Generated images, and text blocks for models that also return text. */
  output: (TextBlock | ImageBlock)[];
  usage?: ModelUsage;
  stopReason: "stop" | "error" | "aborted";
  errorMessage?: string;
}

type TextBlock = { type: "text"; text: string };
/** `data` is base64. */
type ImageBlock = { type: "image"; data: string; mimeType: string };
```

使用 `image(block)` 展示生成的图像。不要通过 `text()`、`console` 或 `return` 输出 `data`：图像数据体积很大，模型也无法将其作为文本读取。`image()` 还会将每张图像保存到临时文件，并在结果中提供路径，之后可通过工具复制或移动文件。

```js
// @options: {"timeout_ms": 300000}
const painter = await models.getModelOfType("image", "openrouter", "google/gemini-2.5-flash-image");
const result = await models.generateImages(painter, {
  input: [{ type: "text", text: "A red fox in the snow, watercolor" }],
});
if (result.stopReason !== "stop") return result.errorMessage;
for (const block of result.output) {
  if (block.type === "image") image(block);
  else text(block.text);
}
```

## 限制

- 每个脚本的虚拟机最多使用 256 MB 内存。内存耗尽时会抛出 `InternalError: out of memory`；处理大量数据时应先筛选或汇总，避免不断累积。
- 在 Bun 中，停止脚本或达到截止时间会立即结束调用；但若某个内置操作不检查 QuickJS 的中断处理器，它可能仍会在 worker 中继续运行，直到操作返回。
- 单个 pi 进程的所有会话最多同时运行两个 codemode worker；可通过 `PI_CODEMODE_MAX_WORKERS` 修改上限。已取消的 worker 在退出前仍占用名额。达到上限后，新脚本会按到达顺序等待空闲 worker。若脚本在 60 秒内或其 `timeout_ms` 截止前都未获得 worker，就会在运行前失败。
- 如果脚本等待的 Promise 永远不会完成（且没有待处理的工具调用），脚本会立即失败，因为环境不提供计时器。
- 脚本不能启动其他 `codemode` 脚本。
