import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const errors = [];
const checkedTargets = new Map();

async function listFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listFiles(fullPath, extension);
      return path.extname(entry.name).toLowerCase() === extension ? [fullPath] : [];
    }),
  );
  return files.flat();
}

async function exists(filePath) {
  if (!checkedTargets.has(filePath)) {
    checkedTargets.set(
      filePath,
      access(filePath)
        .then(() => true)
        .catch(() => false),
    );
  }
  return checkedTargets.get(filePath);
}

function routeTarget(webPath) {
  const cleanPath = decodeURIComponent(webPath.split(/[?#]/, 1)[0]);
  const relative = cleanPath.replace(/^\/+/, "");
  if (!relative || cleanPath.endsWith("/")) return path.join(distRoot, relative, "index.html");
  if (path.extname(relative)) return path.join(distRoot, relative);
  return path.join(distRoot, relative, "index.html");
}

const htmlFiles = await listFiles(distRoot, ".html");
for (const file of htmlFiles) {
  const relative = path.relative(distRoot, file);
  const html = await readFile(file, "utf8");

  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (h1Count !== 1) errors.push(`${relative}: 应有且仅有一个 h1，实际为 ${h1Count}`);
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${relative}: 缺少页面标题`);
  if (!/<meta name="description" content="[^"]+"/i.test(html)) {
    errors.push(`${relative}: 缺少页面描述`);
  }
  if (!/<link rel="canonical" href="[^"]+"/i.test(html)) {
    errors.push(`${relative}: 缺少 canonical 链接`);
  }
  if (/\b(?:undefined|NaN)\b|\[object Object\]|\/images\/placeholders\//i.test(html)) {
    errors.push(`${relative}: 页面中出现无效值或占位资源`);
  }

  const ids = Array.from(html.matchAll(/\sid="([^"]+)"/gi), (match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    errors.push(`${relative}: 存在重复 id：${[...new Set(duplicates)].join("、")}`);
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt="[^"]*"/i.test(match[1])) errors.push(`${relative}: 有图片缺少 alt 属性`);
  }

  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/gi)) {
    const target = match[1];
    if (
      !target.startsWith("/") ||
      target.startsWith("//") ||
      target.startsWith("/#") ||
      target === "/"
    ) {
      continue;
    }
    const fileTarget = routeTarget(target);
    if (!(await exists(fileTarget))) {
      errors.push(`${relative}: 本地链接不存在：${target}`);
    }
  }
}

if (errors.length > 0) {
  console.error("构建结果检查失败：");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`构建结果检查通过：${htmlFiles.length} 个 HTML 页面无坏链或结构错误。`);
}
