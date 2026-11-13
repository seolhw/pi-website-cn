# Pi 中文站开发指南

## 项目概况

本站是社区维护的 Pi Coding Agent 中文站，并非 Pi 官方站点。项目使用 Astro、TypeScript、MDX 和 Cloudflare adapter；默认输出由 Cloudflare Workers 提供。修改时保留中文站定位和非官方说明，不要让本站链接误指向官方内容，或反之。

## 开发命令

使用 pnpm 管理依赖和脚本。

```sh
pnpm install
astro dev --background
```

开发服务器使用后台模式管理：

```sh
astro dev status
astro dev logs
astro dev stop
```

提交前运行：

```sh
pnpm biome:check
pnpm check
pnpm build
git diff --check
```

不要为了处理无关问题而改写、暂存或覆盖其他工作区改动。提交时仅暂存当前任务相关文件。

## 架构与路由

- 页面、动态路由和布局位于 `src/pages/`、`src/layouts/`；共享界面组件位于 `src/components/`。
- 文档内容在 `src/content/docs/`，由 Astro Content Collections 加载；首页正文也来自该目录中的 `index.mdx`。
- 网站源代码副本在 `src/pi/coding-agent/`，用于上游内容对照。除非任务明确要求更新上游副本，不要将其当作本站页面直接渲染。
- 更新日志中文内容在 `src/content/changelog/`。该目录分成多个 `CHANGELOG*.md` 文件时，需同步维护 `src/pages/changelog.astro` 的区块顺序和版本目录顺序；新版本应排在旧版本之前。
- 模型目录和详情通过 `src/lib/` 中的数据逻辑读取 pi.dev 数据；包目录和详情使用 `src/lib/packages-catalog.ts`。保持详情页本站路由与规范尾斜线一致。
- 网站使用 `trailingSlash: 'always'` 和 Cloudflare adapter。新增常规内容页时明确其预渲染策略；只有需要请求时动态数据的页面才采用 SSR。

## 内容与翻译

- 翻译需准确、自然，并保留命令、代码、API 名称、技术标识符、链接、锚点和版本号。
- 不翻译或改动 URL 中的英文锚点，除非同时验证目标页面锚点确实匹配。
- `models-configuration.md` 为自动生成内容，不要手工编辑；先检查仓库是否提供其生成器。
- 更新上游内容时，不要意外覆盖中文译文或与任务无关的本地修改。

## UI 与样式

- 若任务涉及还原 pi.dev 的界面或交互，优先检查官网当前 DOM、样式和行为，再修改本站；明确区分“观察到的事实”和设计推断。
- 正文和界面优先使用项目本地 Noto Sans SC；命令、代码和技术标识符使用等宽字体。
- 继续保持桌面和移动端布局可用，并检查主题变量在浅色、深色模式下均可读。
- 避免把仅适用于某个页面的样式加入全局规则；优先使用页面级样式或限定作用域的选择器。
- 首页终端演示使用官方 pi.dev asciinema 录屏的本地副本及播放器，不要未经确认自行重录、替换或改为依赖跨域热链。
- 主题、导航、代码复制和其他共享交互应复用现有组件及 CSS 变量，避免引入重复实现。

## 技术文档

Astro 文档：<https://docs.astro.build>

在相关任务开始前查看对应指南：

- 路由与 middleware：<https://docs.astro.build/en/guides/routing/>
- Astro 组件：<https://docs.astro.build/en/basics/astro-components/>
- 内容集合：<https://docs.astro.build/en/guides/content-collections/>
- 样式：<https://docs.astro.build/en/guides/styling/>
- 国际化：<https://docs.astro.build/en/guides/internationalization/>
- Cloudflare adapter 与部署：<https://docs.astro.build/en/guides/integrations-guide/cloudflare/>
