---
title: "Pi 包"
---

# Pi 包

Pi 包可以将扩展、Skill、提示模板和主题作为一个整体安装与分发。当你想通过 npm 或 git 分享定制内容，或将多个资源打包在一起时，可以使用 Pi 包。

Pi 包本质上是普通目录或 npm 软件包。它可以提供约定俗成的资源目录，也可以通过 `package.json` 中的 `pi` 字段声明资源路径，并携带运行时依赖。

<a id="install-and-manage-packages"></a>
## 安装和管理软件包

可从 npm、git 或本地路径安装：

```bash
pi install npm:@example/pi-tools@1.0.0
pi install git:github.com/example/pi-tools@v1
pi install ./local-package
```

`pi list` 会显示已配置的软件包。使用 `pi remove <source>` 移除软件包，使用 `pi update --extensions` 同步软件包安装状态。所有软件包命令及选项请参阅[命令行](/cli/#package-commands)。

如果启动时配置的软件包安装失败，例如 npm 无法连接软件包注册表，Pi 会发出警告、跳过该软件包的资源并继续运行。下次启动或运行 `/reload` 时，Pi 会再次尝试安装。`pi install` 和 `pi update --extensions` 仍会报告失败并以非零状态退出。

个人软件包声明写入 `~/.pi/agent/settings.json`。添加 `--local` 或 `-l` 可将声明写入 `.pi/settings.json`。只有在[信任项目](/security/#understand-project-trust)后，Pi 才会读取该文件中的声明。

项目软件包只有在完成项目权限判定后才会安装和加载。软件包可以执行扩展代码，也可以包含会指示模型运行程序的 Skill。安装前请检查第三方软件包源代码；授予项目权限前也请审查项目中的软件包声明。

使用 `--extension` 或 `-e` 可在单次调用中试用软件包，而不将其添加到设置：

```bash
pi -e npm:@example/pi-tools
```

Pi 会将 `-e` 软件包缓存到 `~/.pi/agent/tmp/extensions/`，并在每次启动和 `/reload` 时检查更新。如果注册表中出现符合指定范围的新版本，npm 软件包会重新安装。使用精确版本号（例如 `@1.2.3`）固定的软件包不会检查更新。git 软件包会重新获取并重置到远程分支或引用；如果当前检出的引用已经是提交哈希，则不会重新获取。检查失败或启用离线模式时，Pi 会加载缓存副本。

<a id="choose-a-source"></a>
## 选择来源

| 来源 | 示例 | 行为 |
|---|---|---|
| npm | `npm:@example/pi-tools@1.0.0` | 安装到 Pi 的 npm 目录下 |
| git | `git:github.com/example/pi-tools@v1` | 克隆仓库并同步到指定引用 |
| URL | `https://github.com/example/pi-tools` | 按 git 来源处理 |
| 本地 | `./pi-tools` | 从解析后的路径加载，不复制文件 |

带版本的 npm 声明会固定版本。git 标签和提交也会固定；更新软件包时会同步检出内容，但不会移动已配置的引用。

相对本地路径会相对于包含该声明的设置文件解析。文件路径会加载一个扩展；目录则遵循常规的软件包发现规则。

<a id="create-a-package"></a>
## 创建软件包

最简单的软件包使用约定俗成的目录结构：

```text
my-pi-package/
├── package.json
├── extensions/
├── skills/
├── prompts/
└── themes/
```

如果没有 `pi` 清单，Pi 会从这些目录中发现 TypeScript 和 JavaScript 扩展、Skill 目录、Markdown 提示模板以及 JSON 主题。

如果资源位于其他位置或需要筛选，可使用显式清单：

```json
{
  "name": "my-pi-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./src/extension.ts"],
    "skills": ["./resources/skills"],
    "prompts": ["./resources/prompts/*.md"],
    "themes": ["./resources/themes/*.json"]
  }
}
```

路径相对于软件包根目录。数组支持 glob 模式和排除规则。如果资源根目录以点开头或是符号链接，而 glob 遍历无法发现它们，请直接列出路径。

在 npm 软件包的 `keywords` 中添加 `pi-package`，该包就有资格出现在 [Pi 软件包目录](/packages/)中。可选的 `pi.image` 和 `pi.video` 字段还可以为目录页面添加预览内容。

<a id="show-a-changelog"></a>
## 显示更新日志

软件包更新后，Pi 可以显示变更内容。下次全新启动时，Pi 会读取软件包更新日志，并在“扩展更新”区域显示自上次查看版本之后的新条目，方式与 Pi 自身更新日志相同。Pi 首次发现软件包时只记录版本，不显示更新日志。

此功能适用于至少加载一个扩展的软件包。只提供 Skill、提示模板或主题的软件包不会显示更新日志。

默认情况下，Pi 会读取软件包根目录中的 `CHANGELOG.md`。可以通过 `pi.changelogPath` 指向软件包内的其他文件，或将其设为 `""` 禁用更新日志：

```json
{
  "name": "my-pi-package",
  "version": "1.2.0",
  "pi": {
    "changelogPath": "./docs/CHANGELOG.md"
  }
}
```

版本标题格式应与 Pi 更新日志一致，例如 `## [1.2.0]` 或 `## 1.2.0 - 2026-01-01`。Pi 会将更新日志条目与 `package.json` 中的 `version` 字段进行匹配，因此 git 软件包只有在该字段增加时才会显示更新日志。`collapseChangelog` 设置可将内容压缩为每个软件包一行，例如 `Updated my-pi-package to v1.2.0.`。与 Pi 自身的更新日志不同，`/changelog` 不会显示软件包更新日志；详情请查看软件包的更新日志文件或仓库。

<a id="declare-dependencies"></a>
## 声明依赖

扩展导入的运行时软件包应放入 `dependencies`。Pi 会在安装 npm 或 git 来源时安装这些依赖。

Pi 会向扩展和 Skill 提供以下软件包：

- `@earendil-works/pi-ai`
- `@earendil-works/pi-agent-core`
- `@earendil-works/pi-coding-agent`
- `@earendil-works/pi-tui`
- `typebox`

将上述宿主提供的软件包以 `"*"` 版本范围声明在 `peerDependencies` 中，不要将它们打包进软件包。对于由 Pi 管理的 npm 软件包，以及通过 npm、pnpm 或 Bun 安装的 git 软件包，Pi 会抑制自动安装 peer 依赖。Pi 不会安装或修改本地软件包，因此其依赖树由软件包作者负责。

不要将宿主提供的软件包列入 `dependencies`。实际安装的副本可能绕过 Pi 在编译 ESM 中的扩展模块映射，导致重复的类、注册表和初始化操作。Pi 检测到这种清单配置时会报告扩展警告。其他作为依赖使用的 Pi 软件包必须包含在发布的 tarball 中，并通过其 `node_modules` 资源路径引用。

已安装的软件包使用独立的模块根目录。不要假设不同软件包会共享同一个依赖实例，也不要依赖一个软件包解析另一个软件包未声明的依赖。

<a id="select-package-resources"></a>
## 选择要加载的软件包资源

设置中的对象形式可以缩小从软件包加载的资源范围：

```json
{
  "packages": [
    {
      "source": "npm:@example/pi-tools",
      "extensions": ["extensions/*.ts", "!extensions/legacy.ts"],
      "skills": [],
      "prompts": ["prompts/review.md"]
    }
  ]
}
```

针对每类资源：

- 省略该属性会加载软件包允许提供的全部资源。
- 使用 `[]` 表示不加载该类资源。
- 使用 `!pattern` 排除 glob 匹配项。
- 使用 `+path` 包含某个精确的允许路径。
- 使用 `-path` 排除某个精确路径。

筛选条件只会缩小软件包清单声明的范围，不会暴露软件包本身未声明的资源。

运行 `pi config` 可启用或禁用已发现的资源和 Pi 内置扩展。该命令默认从个人配置开始；按 Tab 可切换配置范围，也可以运行 `pi config --local` 从项目覆盖设置开始。

<a id="understand-scope-and-identity"></a>
## 了解配置范围与身份识别

同一个软件包可以同时出现在个人设置和项目设置中。项目条目通常会替换个人条目。如果设置 `autoload: false`，项目条目则会作为筛选增量应用到个人软件包上。

Pi 根据 npm 软件包名称、去掉引用后的 git 仓库 URL，以及解析后的本地绝对路径识别软件包，避免同一软件包通过等价声明重复加载。

创建软件包前，请先阅读[扩展](/extensions/)、[Skill](/skills/)、[提示模板](/prompt-templates/)和[主题](/themes/)文档，分别了解这些资源的设计方式。
