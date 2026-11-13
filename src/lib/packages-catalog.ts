export interface CatalogPackage {
  name: string;
  path: string;
  description: string;
  author: string;
  downloads: string;
  published: string;
  types: string[];
  previewType: string;
  previewUrl: string;
  npmUrl: string;
  repositoryUrl: string;
  reportUrl: string;
  installCommand: string;
}

export interface RecentPackage {
  name: string;
  path: string;
  description: string;
  published: string;
}

export interface PackageCatalogPage {
  packages: CatalogPackage[];
  recent: RecentPackage[];
  first: number;
  last: number;
  total: number;
  error: boolean;
}

export interface PackageDetailPage {
  name: string;
  description: string;
  types: string[];
  installCommand: string;
  links: Array<{ href: string; label: string }>;
  metadata: Array<{ label: string; value: string }>;
  manifest: string;
  readmeHtml: string;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([\da-f]+);/gi, (_, digits: string) => String.fromCodePoint(parseInt(digits, 16)));
}

function textContent(value: string): string {
  return decodeHtml(value.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(tag: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\b${escaped}="([^"]*)"`));
  return match ? decodeHtml(match[1]) : "";
}

function blockContent(html: string, className: string, tagName: string): string {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagPattern = className
    ? `<${tagName}\\b[^>]*class="[^"]*\\b${escaped}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/${tagName}>`
    : `<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`;
  const match = html.match(new RegExp(tagPattern, "i"));
  return match?.[1] ?? "";
}

function anchors(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)].map((match) => decodeHtml(match[1]));
}

function extractReadme(html: string): string {
  const startTag = '<div class="rich-text packages-readme">';
  const start = html.indexOf(startTag);
  if (start < 0) return "";
  const contentStart = start + startTag.length;
  const closingTags = /\s*<\/div>\s*<\/div>\s*<\/section>/i.exec(html.slice(contentStart));
  return closingTags ? html.slice(contentStart, contentStart + closingTags.index) : "";
}

function parsePackageDetail(html: string, fallbackName: string): PackageDetailPage | undefined {
  const hero = html.match(/<h1 class="content-title">([\s\S]*?)<\/h1>/i)?.[1];
  if (!hero) return undefined;
  const name = textContent(hero) || fallbackName;
  const description = textContent(blockContent(html, "content-description", "p"));
  const types = [...blockContent(html, "packages-badges", "div").matchAll(/data-type="([^"]+)"/g)].map((match) =>
    decodeHtml(match[1]),
  );
  const installHtml = blockContent(html, "packages-install--detail", "div");
  const installCommand =
    textContent(blockContent(installHtml, "", "code")).replace(/^\$\s*/, "") || `pi install npm:${name}`;
  const linksHtml = blockContent(html, "packages-detail-links", "div");
  const links = [...linksHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map(([, attributes, content]) => ({ href: attribute(attributes, "href"), label: textContent(content) }))
    .filter((link) => link.href.startsWith("https://"));
  const detailsHtml = blockContent(html, "detail-grid", "dl");
  const metadata = [...detailsHtml.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)].map(
    ([, label, value]) => ({ label: textContent(label), value: textContent(value) }),
  );
  const manifest = textContent(blockContent(html, "raw-data-panel", "pre"));
  const readmeHtml = extractReadme(html);
  if (!readmeHtml) return undefined;
  return { name, description, types, installCommand, links, metadata, manifest, readmeHtml };
}

export async function loadPackageDetailPage(path: string): Promise<PackageDetailPage | undefined> {
  const segments = path.split("/").filter(Boolean).map(encodeURIComponent);
  if (segments.length === 0 || segments.length > 4) return undefined;
  try {
    const upstream = new URL(`https://pi.dev/packages/${segments.join("/")}`);
    const response = await fetch(upstream, { headers: { Accept: "text/html" } });
    if (!response.ok) return undefined;
    return parsePackageDetail(await response.text(), decodeURIComponent(segments.at(-1) ?? ""));
  } catch {
    return undefined;
  }
}

function parseCard(block: string): CatalogPackage | undefined {
  const name = attribute(block, "data-package-name");
  const path =
    attribute(block, "data-package-path") ||
    block.match(/<a\b[^>]*data-package-link="true"[^>]*data-package-path="([^"]+)"/)?.[1] ||
    "";
  if (!name || !path) return undefined;

  const meta = [...blockContent(block, "packages-meta", "div").matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)].map(
    (match) => textContent(match[1]),
  );
  const links = anchors(blockContent(block, "packages-links", "div"));
  const installHtml = blockContent(block, "packages-install", "div");
  const installCode = blockContent(installHtml, "", "code");
  const installCommand = textContent(installCode).match(/pi install\s+[^\s]+/)?.[0] ?? `pi install npm:${name}`;
  const types = [...block.matchAll(/data-type="([^"]+)"/g)].map((match) => decodeHtml(match[1]));

  return {
    name,
    path,
    description: textContent(blockContent(block, "packages-desc", "p")),
    author: meta[0] ?? "",
    downloads: meta[1] ?? "",
    published: meta[2] ?? "",
    types,
    previewType: attribute(block, "data-preview-type") || "package",
    previewUrl: "",
    npmUrl:
      links.find((href) => href.includes("npmjs.com/package/")) ??
      `https://www.npmjs.com/package/${encodeURIComponent(name)}`,
    repositoryUrl:
      links.find((href) => href.includes("github.com/") && !href.includes("earendil-works/pi/issues/")) ?? "",
    reportUrl: links.find((href) => href.includes("issues/new?template=package-report")) ?? "",
    installCommand,
  };
}

function parseRecent(html: string): RecentPackage[] {
  return [...html.matchAll(/<a\b(?=[^>]*class="[^"]*packages-recent-item")[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([whole, contents]) => {
      const rawPath = whole.match(/\bhref="([^"]+)"/)?.[1] ?? "";
      const path = decodeHtml(rawPath).split("?")[0];
      const name = blockContent(contents, "", "strong");
      const description = blockContent(contents, "", "span");
      const published = blockContent(contents, "", "small");
      return {
        name: textContent(name),
        path,
        description: textContent(description),
        published: textContent(published),
      };
    })
    .filter((item) => item.name && item.path);
}

export async function loadPackageCatalogPage(url: URL): Promise<PackageCatalogPage> {
  const params = new URLSearchParams();
  const name = url.searchParams.get("name")?.trim().slice(0, 120) ?? "";
  const requestedType = url.searchParams.get("type") ?? "";
  const type = ["extension", "skill", "theme", "prompt"].includes(requestedType) ? requestedType : "";
  const requestedSort = url.searchParams.get("sort") ?? "";
  const sort = ["downloads", "recent", "name"].includes(requestedSort) ? requestedSort : "downloads";
  const page = Math.max(1, Math.min(200, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1));
  if (name) params.set("name", name);
  if (type) params.set("type", type);
  if (sort !== "downloads") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));

  try {
    const upstream = new URL("https://pi.dev/packages");
    upstream.search = params.toString();
    const response = await fetch(upstream, { headers: { Accept: "text/html" } });
    if (!response.ok) throw new Error(`Package catalog returned ${response.status}`);
    const html = await response.text();
    const countText = textContent(blockContent(html, "packages-count", "span"));
    const countMatch = countText.match(/(?:(\d+)\s*[-–]\s*(\d+)\s*\/\s*)?(\d[\d,]*)/);
    const total = countMatch ? Number(countMatch[3].replace(/,/g, "")) : 0;
    const first = countMatch?.[1] ? Number(countMatch[1]) : total ? (page - 1) * 50 + 1 : 0;
    const last = countMatch?.[2] ? Number(countMatch[2]) : total ? Math.min(page * 50, total) : 0;
    const cards = [...html.matchAll(/<article\b(?=[^>]*data-package-card="true")[\s\S]*?<\/article>/gi)]
      .map(([block]) => parseCard(block))
      .filter((item): item is CatalogPackage => Boolean(item));
    const previewEndpoint = new URL("https://pi.dev/api/packages/preview-media");
    cards.forEach((item) => {
      previewEndpoint.searchParams.append("name", item.name);
    });
    try {
      const previewResponse = await fetch(previewEndpoint, { headers: { Accept: "application/json" } });
      if (previewResponse.ok) {
        const previewData = (await previewResponse.json()) as {
          previews?: Array<{ name?: string; media?: { url?: string } }>;
        };
        const previewByName = new Map(
          (previewData.previews ?? []).flatMap((item) => {
            const mediaUrl = item.media?.url;
            return item.name && mediaUrl?.startsWith("https://") ? [[item.name, mediaUrl] as const] : [];
          }),
        );
        cards.forEach((item) => {
          item.previewUrl = previewByName.get(item.name) ?? "";
        });
      }
    } catch {
      // Keep the local preview placeholder when media is unavailable.
    }

    return { packages: cards, recent: parseRecent(html), first, last, total, error: false };
  } catch {
    return { packages: [], recent: [], first: 0, last: 0, total: 0, error: true };
  }
}
