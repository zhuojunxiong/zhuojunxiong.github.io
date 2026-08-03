import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { readImageMetadata } from "./lib/image-metadata.mjs";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const errors = [];

async function listFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listFiles(fullPath, extensions);
      return extensions.includes(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
    }),
  );
  return files.flat();
}

function resolvePublicPath(webPath, source) {
  if (!webPath?.startsWith("/")) {
    errors.push(`${source}: 资源路径必须从 / 开始：${webPath}`);
    return null;
  }

  const resolved = path.resolve(publicRoot, webPath.slice(1));
  if (!resolved.startsWith(`${publicRoot}${path.sep}`)) {
    errors.push(`${source}: 资源路径超出了 public 目录：${webPath}`);
    return null;
  }
  return resolved;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateAsset(webPath, source) {
  const filePath = resolvePublicPath(webPath, source);
  if (!filePath) return null;
  if (!(await fileExists(filePath))) {
    errors.push(`${source}: 找不到文件 ${webPath}`);
    return null;
  }
  return filePath;
}

async function validatePhotography() {
  const directory = path.join(root, "src", "content", "photography");
  const files = await listFiles(directory, [".json"]);

  for (const file of files) {
    const relative = path.relative(root, file);
    let gallery;
    try {
      gallery = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      errors.push(`${relative}: JSON 无法解析：${error.message}`);
      continue;
    }

    await validateAsset(gallery.cover, `${relative} 的 cover`);
    const photoSources = new Set();
    for (const [index, photo] of (gallery.photos ?? []).entries()) {
      const source = `${relative} 第 ${index + 1} 张照片`;
      if (photoSources.has(photo.src)) errors.push(`${source}: 图片路径重复：${photo.src}`);
      photoSources.add(photo.src);

      const filePath = await validateAsset(photo.src, source);
      if (!filePath) continue;
      const metadata = await readImageMetadata(filePath);
      if (!metadata) {
        errors.push(`${source}: 无法读取图片格式或尺寸：${photo.src}`);
        continue;
      }

      const extension = path.extname(filePath).toLowerCase().replace(".jpeg", ".jpg").slice(1);
      if (extension !== metadata.format) {
        errors.push(`${source}: 扩展名是 .${extension}，实际格式是 ${metadata.format}`);
      }
      if (metadata.width !== photo.width || metadata.height !== photo.height) {
        errors.push(
          `${source}: JSON 尺寸为 ${photo.width}×${photo.height}，实际为 ${metadata.width}×${metadata.height}`,
        );
      }
      if (!gallery.draft && /^待补充/.test(photo.alt ?? "")) {
        errors.push(`${source}: 正式发布前必须补充准确的 alt 描述`);
      }
    }

    if (!photoSources.has(gallery.cover)) {
      errors.push(`${relative}: cover 必须同时出现在 photos 数组中`);
    }
    if (!gallery.draft && /^待补充/.test(gallery.description ?? "")) {
      errors.push(`${relative}: 正式发布前必须补充作品集介绍`);
    }
  }
}

async function validateMarkdownCovers() {
  const directories = [
    path.join(root, "src", "content", "tech"),
    path.join(root, "src", "content", "articles"),
  ];

  for (const directory of directories) {
    const files = await listFiles(directory, [".md", ".mdx"]);
    for (const file of files) {
      const relative = path.relative(root, file);
      const source = await readFile(file, "utf8");
      const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
      const cover = frontmatter.match(/^\s*cover:\s*["']([^"']+)["']/m)?.[1];
      if (cover) await validateAsset(cover, `${relative} 的 cover`);
    }
  }
}

async function validateSiteConfig() {
  const configPath = path.join(root, "src", "site.config.ts");
  const source = await readFile(configPath, "utf8");
  const heroImage = source.match(/heroImage:\s*["']([^"']+)["']/)?.[1];
  if (!heroImage) {
    errors.push("src/site.config.ts: 没有找到 heroImage");
    return;
  }
  await validateAsset(heroImage, "src/site.config.ts 的 heroImage");
}

await Promise.all([validatePhotography(), validateMarkdownCovers(), validateSiteConfig()]);

if (errors.length > 0) {
  console.error("内容资源检查失败：");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("内容资源检查通过：图片路径、格式与摄影尺寸均有效。");
}
