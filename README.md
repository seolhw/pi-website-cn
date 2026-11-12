# Pi 中文文档站

本项目是基于 Astro 与 Starlight 构建的 Pi 中文文档站，目标是以 [pi.dev](https://pi.dev) 为参照，提供中文内容，并尽可能保持原站的信息结构与使用体验。

本站为社区中文版本，并非 Pi 官方站点。产品名称、命令、代码、配置项和 API 标识通常保留英文，以确保可直接使用；文档内容以 Pi 官方资料为依据，持续翻译、校对和同步。

## 本地开发

需要 Node.js 与 pnpm。安装依赖后启动开发服务器：

```sh
pnpm install
pnpm dev
```

根据项目约定，也可以在后台启动 Astro 开发服务器：

```sh
astro dev --background
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm build` | 构建生产站点至 `dist/` |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm astro ...` | 执行 Astro CLI 命令 |

## 项目结构

- `src/content/docs/`：站点页面与文档内容
- `src/components/`：站点自定义组件
- `src/styles/`：全局及首页样式
- `src/pi/coding-agent/docs/`：随项目保存的 Pi 上游文档副本
- `astro.config.mjs`：Starlight 配置与文档导航

## 内容维护

翻译或修改文档时，请以对应的 Pi 官方文档为依据，保留命令、代码示例和技术标识符，并检查页面链接及构建结果。发现上游更新时，同步核对对应中文页面。

上游项目：[earendil-works/pi](https://github.com/earendil-works/pi) · 官方文档：[pi.dev](https://pi.dev)
