---
title: "运行本地模型"
---

# 使用 llama.cpp 运行本地模型

Pi 支持 [llama.cpp](https://llama.app) Router 服务器。Router 会发现多个 GGUF 模型，并根据需要加载或卸载它们。

<a id="install-llama-cpp"></a>
## 安装 llama.cpp

按照[官方安装说明](https://llama.app/docs/installation)安装 llama.cpp：

```bash
curl -LsSf https://llama.app/install.sh | sh
```

验证是否安装成功：

```bash
llama --version
```

其他安装方式（包括使用包管理器和从源码构建）请参阅 [llama.app](https://llama.app)。

<a id="start-the-router"></a>
## 启动 Router

启动 `llama serve` 时不要传入 `--model`、`-m` 或 `-hf`。指定模型会启动单模型模式，而不是 Router 模式。Router 配置请参阅 [llama.cpp 服务器指南](https://llama.app/docs/serve#serving-multiple-models-router-mode)。

```bash
llama serve \
  --no-models-autoload \
  -ngl all \
  -c 32768
```

重要选项：

- `--no-models-autoload`：不自动加载模型，改由 `/llama` 显式加载。
- `-ngl all`：将所有层卸载到 GPU。省略此选项时会自动决定 GPU 卸载方式。
- `-c 32768`：设置上下文长度（Token 数）。使用 `-c 0` 可启用模型的完整上下文窗口，但可能需要更多内存。多个并行服务器槽位共享上下文。

单文件模型可以直接放在模型目录中。多模态模型和分片模型应分别放在独立子目录中：

```text
~/models/
├── llama-3.2-1b-Q4_K_M.gguf
├── gemma-3-4b-it-Q4_K_M/
│   ├── gemma-3-4b-it-Q4_K_M.gguf
│   └── mmproj-F16.gguf
└── large-model-Q4_K_M/
    ├── large-model-Q4_K_M-00001-of-00003.gguf
    ├── large-model-Q4_K_M-00002-of-00003.gguf
    └── large-model-Q4_K_M-00003-of-00003.gguf
```

手动添加模型文件后，请重启 Router。Router 也支持缓存模型和通过 `--models-preset` 使用预设文件，详情见[服务器指南](https://llama.app/docs/serve#serving-multiple-models-router-mode)。

<a id="configure-pi"></a>
## 配置 Pi

启动 Pi 并配置 Provider：

```text
/login llama.cpp
```

输入 Router URL 和可选的 API Key。默认 URL 为 `http://127.0.0.1:9931`。

如果启动 Router 时使用了 `--no-models-autoload`，`/login llama.cpp` 只会保存连接信息。运行 `/llama` 加载模型，然后运行 `/model` 为当前会话选择已加载的模型。

也可以使用环境变量设置相同的值，而不通过 `/login`：

```bash
export LLAMA_BASE_URL=http://127.0.0.1:9931
export LLAMA_API_KEY=optional-secret
pi
```

如果服务器使用 API Key，启动 `llama serve` 时应设置匹配的 `--api-key`。如需仅允许本机访问，请保留 `--host 127.0.0.1`。

<a id="manage-models"></a>
## 管理模型

运行：

```text
/llama
```

- 选择尚未加载的模型即可加载。
- 选择已加载的模型即可卸载。
- 选择 **下载模型…**，搜索 Hugging Face，然后选择仓库和量化版本。也可以直接输入完整的 `owner/repository[:quant]`。
- 加载或下载期间按 Escape 可确认取消操作。

如果设置了 `HF_TOKEN`，Hugging Face 搜索会优先使用它；否则会依次检查 `$HF_TOKEN_PATH`、`$HF_HOME/token`、`$XDG_CACHE_HOME/huggingface/token` 和 `~/.cache/huggingface/token`。无需认证也能搜索，但会受到更严格的速率限制。下载受限仓库前，Pi 会发出警告并提供其访问页面链接。模型由 llama.cpp 服务器进程下载，因此所选仓库需要访问权限时，服务器进程也必须设置 `HF_TOKEN`。

如果已有其他模型处于加载状态，Pi 会询问是先卸载它们还是保持加载。Pi 不会静默卸载模型，也不会删除模型文件。Router 可能与其他客户端共用，因此 `/llama` 始终显示 Router 的当前状态。

已加载和休眠的模型都会显示在 `/model` 中。选择休眠模型时，它会自动唤醒。如果 Router 启用了自动加载，未加载的预设模型也会显示在列表中，并在选择后加载。若使用 `--no-models-autoload`，则需先通过 `/llama` 加载模型。

如果 Router 断开连接，`/llama` 会显示 **重试** 和 **关闭**。重试会重新连接并刷新模型状态，不会重放被中断的操作。

<a id="classification"></a>
## 分类

分类器模型会针对 JSON 状态回答类型为 `choice`、`bool` 和 `score` 的问题，例如 TypeSafe 的 Jev 模型。模型可由 [`codemode`](/cli/#enable-codemode) 脚本调用；扩展可通过 `ctx.modelRegistry.classify()` 调用。详情请参阅[分类器模型](/models/#use-classifier-models)。Pi 会通过两种方式将 llama.cpp 模型列为分类器：

- **决策模型**（例如 [Julia-1、Laya、Kev、lev 和 OpenJev](https://huggingface.co/collections/ggml-org/decision-models-6abf80cca3c83f127060a769)）通过 llama.cpp 的 `/v1/systemone` 端点原生回答。它们只会作为分类器显示，使用 `typesafe-system-one` API，不会出现在 `/model` 中。
- **对话模型**也会以相同的 ID 列为分类器，并使用 `llama-cpp-classify` API；此 API 根据下文所述的下一 Token 概率读取答案。

llama.cpp 0.6.0 及之后版本会在 Router 模型列表中报告决策模型：它们的 `architecture.output_modalities` 包含 `decisions`。Router 无需加载模型即可从 GGUF 元数据中读取此信息，因此 Pi 也能识别未加载和休眠的决策模型。较早版本的 llama.cpp 不会报告此信息，Pi 会将其决策模型当作对话模型列出。

<a id="chat-models-as-classifiers"></a>
### 将对话模型用作分类器

模型不会生成普通文本答案。每个问题会被组合成一个对话提示词：状态、请求中的所有问题、再次出现的状态，以及带有单 Token 标签的当前问题和选项。选择题使用字母作为标签（最多 62 个选项）；布尔题使用 `Yes`/`No`；评分题使用数字（最多 10 个等级）。第二次出现的状态会与问题一同提供；在小模型上的 JevBench 测试中，这提高了准确度。Pi 会读取标签作为下一个 Token 的概率并进行归一化。选择题会返回每个选项的概率，以及置信度 `(n * peak - 1) / (n - 1)`；评分题会返回预期等级。

- 原始标签概率通常会过度自信。每个请求的 `temperature` 选项会在归一化前缩放标签 logits；大于 1 的值会使概率分布更平缓，但不会改变答案。
- 问题会依次处理。一个请求中，最后一个问题之前的内容对所有问题都相同，因此服务器的提示缓存只需计算一次。状态会出现两次，因此需要两倍于状态大小的上下文。
- 小模型可能会遵循状态中写入的指令。提示词会要求模型将状态视为数据来判断，但这并不能完全保证。
- Qwen3.5 等混合模型无法在没有上下文检查点时回退部分缓存的提示词。如果每个问题都要重新处理整个状态，请使用 `--ctx-checkpoints 32 --checkpoint-min-step 0` 启动 Router。

<a id="troubleshooting"></a>
## 故障排查

检查 Router 是否可访问：

```bash
curl http://127.0.0.1:9931/health
curl http://127.0.0.1:9931/models
```

- **`/llama` 中没有模型：** 检查 `--models-dir`、目录结构，然后重启 Router。
- **使用 `--no-models-autoload` 时，模型未出现在 `/model`：** 先通过 `/llama` 加载模型。
- **加载失败或内存占用过高：** 降低 `-c`，或卸载其他模型。
- **服务器未处于 Router 模式：** 启动时不要传入 `--model`、`-m` 或 `-hf`。

若要移除 `llama.cpp` Provider 和 `/llama`，请在 `pi config` 的 Built-in 区域禁用 `llama.cpp`，或在[设置](/settings/#resources)中设置 `"extensions": ["-builtin:llama.cpp"]`。
