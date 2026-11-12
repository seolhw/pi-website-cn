// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://pi.dev',
	integrations: [
		starlight({
			title: 'Pi',
			description: 'Pi 是一个极简的 agent harness。让工作流适应 Pi，而不是反过来。',
			defaultLocale: 'root',
			locales: {
				root: { label: '简体中文', lang: 'zh-CN' },
			},
			logo: { src: './src/assets/pi-logo.svg', replacesTitle: true },
			pagefind: false,
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/earendil-works/pi' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.com/invite/nKXTsAcmbT' },
			],
			customCss: ['./src/styles/custom.css'],
			components: {
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
			},
			credits: false,
			expressiveCode: {
				themes: ['github-light-default'],
			},
			sidebar: [
				{
					label: '开始使用',
					items: [
						{ label: '概览', slug: 'docs' },
						{ label: '快速开始', slug: 'docs/quickstart' },
						{ label: 'Pi 是如何工作的', slug: 'docs/how-pi-works' },
					],
				},
				{
					label: '使用指南',
					items: [
						{
							label: '运行 Pi',
							items: [
								{ label: '在终端中使用 Pi', slug: 'docs/usage' },
								{ label: '选择模型', slug: 'docs/models' },
								{ label: '管理会话与上下文', slug: 'docs/sessions' },
								{ label: '安全地运行 Pi', slug: 'docs/security' },
								{ label: '隔离 Pi', slug: 'docs/containerization' },
								{ label: '运行本地模型', slug: 'docs/llama-cpp' },
								{ label: '在 NVIDIA RTX 上运行本地模型', slug: 'docs/nvidia-rtx-llama-cpp' },
								{ label: '配置终端', slug: 'docs/terminal-setup' },
								{ label: '配置 Shell 命令', slug: 'docs/shell-aliases' },
								{ label: '在 tmux 中运行 Pi', slug: 'docs/tmux' },
								{ label: '在 Windows 上运行 Pi', slug: 'docs/windows' },
								{ label: '在 Android 上运行 Pi', slug: 'docs/termux' },
							],
						},
						{
							label: '定制 Pi',
							items: [
								{ label: '配置 Pi', slug: 'docs/configuration' },
								{ label: '创建提示模板', slug: 'docs/prompt-templates' },
								{ label: '添加 Skills', slug: 'docs/skills' },
								{ label: '创建主题', slug: 'docs/themes' },
								{ label: '使用 Pi 包', slug: 'docs/packages' },
								{ label: '连接 MCP 服务器', slug: 'docs/mcp' },
							],
						},
						{
							label: '基于 Pi 构建',
							items: [
								{ label: '构建扩展', slug: 'docs/extensions' },
								{ label: '添加自定义 Provider', slug: 'docs/custom-provider' },
								{ label: '使用虚拟模型路由', slug: 'docs/virtual-models' },
								{ label: '构建终端 UI 组件', slug: 'docs/tui' },
								{ label: '集成 CLI', slug: 'docs/cli-integration' },
								{ label: '使用 SDK', slug: 'docs/sdk' },
							],
						},
					],
				},
				{
					label: '参考',
					collapsed: true,
					items: [
						{ label: 'CLI', slug: 'docs/cli' },
						{ label: 'Codemode', slug: 'docs/codemode' },
						{ label: '斜杠命令', slug: 'docs/slash-commands' },
						{ label: '设置', slug: 'docs/settings' },
						{ label: '模型配置', slug: 'docs/models-configuration' },
						{ label: '环境变量', slug: 'docs/environment-variables' },
						{ label: '快捷键', slug: 'docs/keybindings' },
						{ label: 'Providers', slug: 'docs/providers' },
						{ label: '会话文件格式', slug: 'docs/session-format' },
						{ label: '上下文压缩与分支摘要', slug: 'docs/compaction' },
						{ label: 'JSON 事件流', slug: 'docs/json' },
						{ label: 'RPC 协议', slug: 'docs/rpc' },
						{ label: 'RPC 命令', slug: 'docs/rpc-commands' },
						{ label: 'RPC 扩展 UI', slug: 'docs/rpc-extension-ui' },
						{ label: '消息类型', slug: 'docs/message-types' },
					],
				},
			],
		}),
	],
});
