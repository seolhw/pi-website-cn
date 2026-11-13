---
title: "隔离 Pi"
---

# 在隔离环境中运行 Pi

使用隔离环境可以限制生成的命令能够访问或影响哪些文件、凭据、进程和网络服务。

你可以将整个 Pi 进程放入隔离环境，也可以让 Pi 继续运行在主机上，仅将选定工具路由到隔离环境中。

<a id="choose-an-isolation-method"></a>
## 选择隔离方式

| 方式 | Pi 运行位置 | 隔离范围 | 凭据处理 | 适用场景 |
|---|---|---|---|---|
| 普通 Docker | 容器 | Pi、内置工具、`!` 命令和扩展 | 将凭据传入容器 | 简单直接的本地容器边界 |
| Docker Sandboxes | 托管沙箱 | Pi、内置工具、`!` 命令和扩展 | Provider 凭据保留在主机，由代理替换占位凭据 | 需要本地托管隔离，但不向容器暴露真实 Provider Key |
| OpenShell | 本地或远程沙箱 | Pi、内置工具、`!` 命令和扩展 | 由策略控制凭据和推理路由 | 需要管理文件系统、进程、网络和凭据策略 |
| Gondolin 扩展 | 主机 | 内置工具和 `!` 命令 | Pi 保存的凭据保留在主机，但命令会继承主机环境变量 | 使用本地 micro-VM 隔离工具执行，同时保留主机上的 Pi 界面 |

隔离方式会影响扩展的运行位置。如果整个 Pi 进程运行在隔离环境中，扩展也会在其中运行。如果主机上的 Pi 通过 Gondolin 转发内置工具，其他扩展工具仍会在主机上运行，除非它们也将工作转发到隔离环境。

<a id="decide-what-pi-can-access"></a>
## 决定 Pi 可以访问的内容

隔离进程仍然可以影响你主动暴露给它的资源：

- 以读写方式挂载的主机目录允许 Pi 修改其中的主机文件。
- 挂载 `~/.pi/agent` 会暴露 Pi 的凭据、设置、扩展和会话。
- 传入容器的环境变量可被容器内的进程读取。
- 网络访问可能让代码或工具输出离开隔离环境。
- 仅隔离工具不会限制主机上的 Pi 进程，也不会限制未使用隔离后端的扩展工具。

只暴露任务所需的工作目录、凭据和网络目标。如果不希望写入影响主机，可使用只读挂载，或将文件复制进出隔离环境。

<a id="run-pi-in-plain-docker"></a>
## 在普通 Docker 中运行 Pi

普通 Docker 提供最简单的整进程容器隔离。

<a id="build-the-image"></a>
### 构建镜像

创建 `Dockerfile.pi`：

```dockerfile
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent

WORKDIR /workspace
ENTRYPOINT ["pi"]
```

在该文件所在目录构建镜像：

```bash
docker build -t pi-sandbox -f Dockerfile.pi .
```

<a id="start-pi"></a>
### 启动 Pi

在希望 Pi 访问的工作目录中运行：

```bash
docker run --rm -it \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  -v pi-agent-home:/root/.pi/agent \
  pi-sandbox
```

请将 `ANTHROPIC_API_KEY` 替换为 Provider 所需的凭据。命名卷 `pi-agent-home` 会在多次运行之间保留容器内的设置、凭据和会话。

除非容器确实需要访问主机的 Pi 配置和凭据，否则不要挂载主机的 `~/.pi/agent`。

<a id="verify-the-workspace"></a>
### 验证工作目录

在 Pi 中运行：

```text
!pwd
```

命令应输出 `/workspace`。对 `/workspace` 中的文件所做更改会同步写入挂载的主机目录。如果不接受这种行为，请移除目录绑定挂载，或使用只读挂载。

<a id="run-pi-with-docker-sandboxes"></a>
## 使用 Docker Sandboxes 运行 Pi

[Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) 会将整个 Pi 进程运行在托管沙箱中。它的代理可以将真实 Provider 凭据保留在主机上，并在请求离开沙箱时替换凭据。

创建沙箱前先配置凭据。不要在沙箱内运行 `/login`，否则真实凭据会被写入沙箱。

<a id="use-a-claude-pro-or-max-token"></a>
### 使用 Claude Pro 或 Max Token

在装有 Claude Code 的机器上运行 `claude setup-token` 生成 Token。如果已经配置了名为 `anthropic` 的 Secret，请先移除它，避免代理在 Bearer Token 之外再添加 API Key 请求头：

```bash
sbx secret rm anthropic

sbx secret set-custom \
  --host api.anthropic.com \
  --env ANTHROPIC_OAUTH_TOKEN \
  --placeholder 'sk-ant-oat01-{rand}'
```

`sbx secret set-custom` 会从标准输入读取真实 Token。沙箱中拿到的是 OAuth 格式的占位值，代理只会针对配置的主机地址替换它。

如果使用 Anthropic API Key，请改用 `sbx secret set anthropic`。

<a id="start-pi-in-docker-sandbox"></a>
### 启动 Pi

在要挂载的工作目录中运行：

```bash
sbx run --kit "docker.io/sbx/pi-kit:latest" pi
```

对于已有沙箱，可通过以下命令以非交互方式运行 Pi：

```bash
sbx exec <sandbox-name> -- pi -p "list the failing tests"
```

其他 Provider、故障排查和镜像版本固定方法，请参阅 [Pi kit 文档](https://github.com/docker/sbx-kits-contrib/tree/main/pi)。

<a id="run-pi-with-openshell"></a>
## 使用 OpenShell 运行 Pi

[NVIDIA OpenShell](https://docs.nvidia.com/openshell/about/overview) 可提供本地或远程沙箱，并对文件系统、进程、网络、凭据和推理策略进行控制。

<a id="select-a-gateway"></a>
### 选择网关

每个沙箱都需要一个已启用的网关：

```bash
openshell gateway add <gateway-url> --name <name>
openshell gateway select <name>
```

<a id="create-the-sandbox"></a>
### 创建沙箱

```bash
openshell sandbox create --name pi-sandbox --from pi -- pi
```

Pi、内置工具、`!` 命令和扩展工具都会在 OpenShell 隔离边界内运行。

<a id="transfer-files-to-a-remote-sandbox"></a>
### 向远程沙箱传输文件

远程网关不会绑定挂载主机工作目录。请在沙箱内克隆仓库，或显式传输文件：

```bash
openshell sandbox upload pi-sandbox ./working-folder /workspace
openshell sandbox download pi-sandbox /workspace/working-folder ./working-folder-out
```

OpenShell 的推理路由可以让原始模型凭据留在沙箱外。配置完成后，将 Pi 指向网关提供的相应 OpenAI 兼容或 Anthropic 兼容端点。

<a id="route-tools-through-gondolin"></a>
## 通过 Gondolin 转发工具

[Gondolin](https://github.com/earendil-works/gondolin) 是一个本地 Linux micro-VM。它的示例扩展会让 Pi 进程和基于文件的 Provider 凭据保留在主机上，同时将内置工具和用户输入的 `!` 命令路由到虚拟机中。

虚拟机内的命令会继承主机进程的环境变量，因此通过环境变量提供的 Provider Key 也可能在虚拟机内可见。除非移除敏感环境变量或修改扩展的环境变量处理方式，否则不要将此方案当作凭据隔离边界。

Gondolin 需要 Node.js 23.6 或更高版本，以及通过操作系统包管理器安装的 QEMU。

<a id="install-the-gondolin-extension"></a>
### 安装扩展

在 Pi 源码检出目录中运行：

```bash
mkdir -p ~/.pi/agent/extensions
cp -R packages/coding-agent/examples/extensions/gondolin ~/.pi/agent/extensions/gondolin
cd ~/.pi/agent/extensions/gondolin
npm install --ignore-scripts
```

<a id="start-pi-with-gondolin"></a>
### 启动 Pi

在要挂载的工作目录中运行 Pi：

```bash
cd /path/to/working-folder
pi -e ~/.pi/agent/extensions/gondolin
```

该扩展会将主机工作目录挂载到虚拟机的 `/workspace`，并替换 `read`、`write`、`edit`、`bash`、`grep`、`find` 和 `ls` 工具。对 `/workspace` 中的文件所做更改会同步写入主机。

除非其他扩展工具明确将操作委托给虚拟机，否则它们仍会在主机上运行。添加可能绕过虚拟机隔离边界的工具前，请先检查 [Gondolin 示例](../examples/extensions/gondolin/)。
