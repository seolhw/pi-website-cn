export interface SidebarLink {
	label: string;
	slug: string;
}

export interface SidebarGroup {
	label: string;
	items: Array<SidebarLink | SidebarGroup>;
}

export const sidebar: SidebarGroup[] = [
	{
		label: '开始使用',
		items: [
			{ label: '概览', slug: 'overview' },
			{ label: '快速开始', slug: 'quickstart' },
			{ label: 'Pi 是如何工作的', slug: 'how-pi-works' },
		],
	},
	{
		label: '使用指南',
		items: [
			{
				label: '运行 Pi',
				items: [
					{ label: '在终端中使用 Pi', slug: 'usage' },
					{ label: '模型目录与选择', slug: 'models' },
					{ label: '管理会话与上下文', slug: 'sessions' },
					{ label: '安全地运行 Pi', slug: 'security' },
					{ label: '隔离 Pi', slug: 'containerization' },
					{ label: '运行本地模型', slug: 'llama-cpp' },
					{ label: '在 NVIDIA RTX 上运行本地模型', slug: 'nvidia-rtx-llama-cpp' },
					{ label: '配置终端', slug: 'terminal-setup' },
					{ label: '配置 Shell 命令', slug: 'shell-aliases' },
					{ label: '在 tmux 中运行 Pi', slug: 'tmux' },
					{ label: '在 Windows 上运行 Pi', slug: 'windows' },
					{ label: '在 Android 上运行 Pi', slug: 'termux' },
				],
			},
			{
				label: '定制 Pi',
				items: [
					{ label: '配置 Pi', slug: 'configuration' },
					{ label: '创建提示模板', slug: 'prompt-templates' },
					{ label: '添加 Skills', slug: 'skills' },
					{ label: '创建主题', slug: 'themes' },
					{ label: '包目录与使用指南', slug: 'packages' },
					{ label: '连接 MCP 服务器', slug: 'mcp' },
				],
			},
			{
				label: '基于 Pi 构建',
				items: [
					{ label: '构建扩展', slug: 'extensions' },
					{ label: '添加自定义 Provider', slug: 'custom-provider' },
					{ label: '使用虚拟模型路由', slug: 'virtual-models' },
					{ label: '构建终端 UI 组件', slug: 'tui' },
					{ label: '集成 CLI', slug: 'cli-integration' },
					{ label: '使用 SDK', slug: 'sdk' },
				],
			},
		],
	},
	{
		label: '参考',
		items: [
			{ label: '更新日志', slug: 'changelog' },
			{ label: 'CLI', slug: 'cli' },
			{ label: 'Codemode', slug: 'codemode' },
			{ label: '斜杠命令', slug: 'slash-commands' },
			{ label: '设置', slug: 'settings' },
			{ label: '模型配置', slug: 'models-configuration' },
			{ label: '环境变量', slug: 'environment-variables' },
			{ label: '快捷键', slug: 'keybindings' },
			{ label: 'Providers', slug: 'providers' },
			{ label: '会话文件格式', slug: 'session-format' },
			{ label: '上下文压缩与分支摘要', slug: 'compaction' },
			{ label: 'JSON 事件流', slug: 'json' },
			{ label: 'RPC 协议', slug: 'rpc' },
			{ label: 'RPC 命令', slug: 'rpc-commands' },
			{ label: 'RPC 扩展 UI', slug: 'rpc-extension-ui' },
			{ label: '消息类型', slug: 'message-types' },
		],
	},
];
