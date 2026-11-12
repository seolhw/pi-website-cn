// Starlight 虚拟模块的类型声明（Starlight 0.42 未自带，供 TS/编辑器识别）
declare module 'virtual:starlight/components/LanguageSelect' {
	const LanguageSelect: typeof import('@astrojs/starlight/components/LanguageSelect.astro').default;
	export default LanguageSelect;
}

declare module 'virtual:starlight/components/Search' {
	const Search: typeof import('@astrojs/starlight/components/Search.astro').default;
	export default Search;
}

declare module 'virtual:starlight/components/SiteTitle' {
	const SiteTitle: typeof import('@astrojs/starlight/components/SiteTitle.astro').default;
	export default SiteTitle;
}

declare module 'virtual:starlight/components/ThemeSelect' {
	const ThemeSelect: typeof import('@astrojs/starlight/components/ThemeSelect.astro').default;
	export default ThemeSelect;
}

declare module 'virtual:starlight/components/Banner' {
	const Banner: typeof import('@astrojs/starlight/components/Banner.astro').default;
	export default Banner;
}

declare module 'virtual:starlight/components/EditLink' {
	const EditLink: typeof import('@astrojs/starlight/components/EditLink.astro').default;
	export default EditLink;
}

declare module 'virtual:starlight/components/Footer' {
	const Footer: typeof import('@astrojs/starlight/components/Footer.astro').default;
	export default Footer;
}

declare module 'virtual:starlight/components/Header' {
	const Header: typeof import('@astrojs/starlight/components/Header.astro').default;
	export default Header;
}

declare module 'virtual:starlight/components/Hero' {
	const Hero: typeof import('@astrojs/starlight/components/Hero.astro').default;
	export default Hero;
}

declare module 'virtual:starlight/components/LastUpdated' {
	const LastUpdated: typeof import('@astrojs/starlight/components/LastUpdated.astro').default;
	export default LastUpdated;
}

declare module 'virtual:starlight/components/MobileMenuFooter' {
	const MobileMenuFooter: typeof import('@astrojs/starlight/components/MobileMenuFooter.astro').default;
	export default MobileMenuFooter;
}

declare module 'virtual:starlight/components/MobileMenuToggle' {
	const MobileMenuToggle: typeof import('@astrojs/starlight/components/MobileMenuToggle.astro').default;
	export default MobileMenuToggle;
}

declare module 'virtual:starlight/components/MobileTableOfContents' {
	const MobileTableOfContents: typeof import('@astrojs/starlight/components/MobileTableOfContents.astro').default;
	export default MobileTableOfContents;
}

declare module 'virtual:starlight/components/PageSidebar' {
	const PageSidebar: typeof import('@astrojs/starlight/components/PageSidebar.astro').default;
	export default PageSidebar;
}

declare module 'virtual:starlight/components/PageTitle' {
	const PageTitle: typeof import('@astrojs/starlight/components/PageTitle.astro').default;
	export default PageTitle;
}

declare module 'virtual:starlight/components/Pagination' {
	const Pagination: typeof import('@astrojs/starlight/components/Pagination.astro').default;
	export default Pagination;
}

declare module 'virtual:starlight/components/SkipLink' {
	const SkipLink: typeof import('@astrojs/starlight/components/SkipLink.astro').default;
	export default SkipLink;
}

declare module 'virtual:starlight/components/SocialIcons' {
	const SocialIcons: typeof import('@astrojs/starlight/components/SocialIcons.astro').default;
	export default SocialIcons;
}

declare module 'virtual:starlight/components/TableOfContents' {
	const TableOfContents: typeof import('@astrojs/starlight/components/TableOfContents.astro').default;
	export default TableOfContents;
}

declare module 'virtual:starlight/components/ThemeProvider' {
	const ThemeProvider: typeof import('@astrojs/starlight/components/ThemeProvider.astro').default;
	export default ThemeProvider;
}

declare module 'virtual:starlight/user-config' {
	const config: import('@astrojs/starlight/types').StarlightUserConfig;
	export default config;
}

declare module 'virtual:starlight/user-css';
declare module 'virtual:starlight/user-images' {
	export const logos: { dark?: import('astro').ImageMetadata; light?: import('astro').ImageMetadata };
}
declare module 'virtual:starlight/optional-css';
declare module 'virtual:starlight/collection-config';
declare module 'virtual:starlight/plugin-translations';
declare module 'virtual:starlight/project-context';
declare module 'virtual:starlight/git-info' {
	export const getNewestCommitDate: (filePath: string) => Date;
}
declare module 'virtual:starlight/pagefind-config' {
	export const pagefindUserConfig: Record<string, unknown>;
}
