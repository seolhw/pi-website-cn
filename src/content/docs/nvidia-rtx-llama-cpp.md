---
title: "在 NVIDIA RTX 上运行本地模型"
---

# 使用 NVIDIA RTX 和 llama.cpp 运行 Pi

[NVIDIA Local AI Inference Recipes](https://nvidia.github.io/local-ai-inference-recipes/index.html) 提供针对特定 NVIDIA 硬件和模型调优的 llama.cpp 设置。每份配方都会给出针对单个模型的 `llama-server` 命令。Pi 使用 llama.cpp 路由器来服务和管理多个模型，因此本指南会将配方命令转换为路由器预设，再使用 `llama serve` 启动。`llama serve` 接受与 `llama-server` 相同的选项。

以下示例使用 Windows PowerShell。关于 Pi 的完整路由器与模型管理说明，请参阅[使用 llama.cpp 运行本地模型](/llama-cpp/)。

<a id="before-you-begin"></a>
## 准备工作

1. 打开[配方目录](https://nvidia.github.io/local-ai-inference-recipes/index.html)，选择硬件、操作系统和模型，然后选择 **llama.cpp**。检查前置条件和内存需求，并保留配方中的启动命令，以便按下文转换。
2. 按照配方中的安装说明安装 llama.cpp。配方设置可能依赖特定构建选项，例如 CUDA 支持或推测解码选项。
3. 运行 `llama serve --help`，确认帮助中包含 `--models-preset`。如果构建中没有 `llama` 程序或缺少该选项，就无法将配方用作路由器预设。请改用仍满足配方要求的较新构建。
4. 按照[快速开始](/quickstart/)安装 Pi。原生 Windows 用户也请参阅[在 Windows 上运行 Pi](/windows/)。

<a id="convert-the-recipe-to-a-preset"></a>
## 将配方转换为预设

预设用于列出一个或多个模型的设置。每个配置段的名称都会成为 Pi 中显示的模型 ID。可以将预设保存在 llama.cpp 目录中，也可以在启动路由器时提供完整路径。

将配方命令中的每个选项转换为预设中的一行：

- 去掉选项前面的连字符：`--ctx-size 65536` 转换为 `ctx-size = 65536`。
- 没有取值的选项设为 `true`：`--jinja` 转换为 `jinja = true`。
- 去掉值两侧的引号和 PowerShell 行续接反引号。
- 不要添加 `--host` 和 `--port`，它们属于路由器命令行选项。
- 添加 `load-on-startup = true`，让路由器启动时加载模型。
- 将模型文件相关的简写选项替换为预设中的长选项：

| 配方选项 | 预设键 |
|---|---|
| `-hf` | `hf-repo` |
| `-hff` | `hf-file` |
| `-hfrd` | `hf-repo-draft` |
| `--spec-draft-model` | `spec-draft-model` |

例如，以下配方命令：

```powershell
llama-server.exe -hf "unsloth/Qwen3.8-27B-GGUF" `
  -hff "Qwen3.8-27B-UD-Q4_K_M.gguf" `
  -hfrd "z-lab/Qwen3.8-27B-DFlash2-GGUF" `
  --spec-draft-model "Qwen3.8-27B-DFlash2-Q4_K_M.gguf" `
  --no-mmproj `
  --host 127.0.0.1 `
  --port 9931 `
  --batch-size 4096 `
  --ubatch-size 1024 `
  --ctx-size 65536 `
  --parallel 1 `
  -ngl 999 `
  --jinja `
  --chat-template-kwargs '{"preserve_thinking":true}' `
  --spec-type draft-dflash `
  --spec-draft-n-max 7 `
  --spec-draft-backend-sampling
```

转换为 `qwen3.8-27b.ini`：

```ini
version = 1

[qwen3.8-27b]
load-on-startup = true
hf-repo = unsloth/Qwen3.8-27B-GGUF
hf-file = Qwen3.8-27B-UD-Q4_K_M.gguf
hf-repo-draft = z-lab/Qwen3.8-27B-DFlash2-GGUF
spec-draft-model = Qwen3.8-27B-DFlash2-Q4_K_M.gguf
no-mmproj = true
batch-size = 4096
ubatch-size = 1024
ctx-size = 65536
parallel = 1
ngl = 999
jinja = true
chat-template-kwargs = {"preserve_thinking":true}
spec-type = draft-dflash
spec-draft-n-max = 7
spec-draft-backend-sampling = true
```

<a id="start-the-router"></a>
## 启动路由器

在 llama.cpp 目录中打开 PowerShell 并运行：

```powershell
.\llama.exe serve --models-preset qwen3.8-27b.ini --host 127.0.0.1
```

如果配方需要 Hugging Face Token，请在同一个 PowerShell 窗口启动路由器前设置 `$env:HF_TOKEN`。首次启动时，路由器会下载模型文件。

请使用[路由器健康检查](/llama-cpp/#troubleshooting)确认服务已就绪。在 Windows PowerShell 中，请使用 `curl.exe` 而不是 `curl`，因为 PowerShell 会将 `curl` 映射到另一个命令。当 `/models` 列出状态为 `loaded` 的 `qwen3.8-27b` 时，模型即可使用。

<a id="use-the-model-in-pi"></a>
## 在 Pi 中使用模型

按照[配置 Pi](/llama-cpp/#configure-pi)连接到 `http://127.0.0.1:9931`。预设配置段的名称就是模型 ID，因此本例中请在 `/model` 中选择 `qwen3.8-27b`。

NVIDIA 配方中的显存设置假定 GPU 只运行选定的模型。如果 `/llama` 显示还加载了其他模型，请先卸载它们，再使用该配方模型。
