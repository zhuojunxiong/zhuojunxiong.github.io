import { access, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { readImageMetadata } from "./lib/image-metadata.mjs";

const [slug, title, location] = process.argv.slice(2);
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function stop(message) {
  console.error(message);
  console.error('用法：npm run gallery:new -- 文件夹英文名 "作品集标题" "拍摄地点（可选）"');
  process.exit(1);
}

if (!slug || !title) stop("缺少文件夹英文名或作品集标题。");
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  stop("文件夹英文名只能包含小写英文字母、数字和单个短横线。");
}

const root = process.cwd();
const photoDirectory = path.resolve(root, "public", "images", "photography", slug);
const photographyRoot = path.resolve(root, "public", "images", "photography");
if (!photoDirectory.startsWith(`${photographyRoot}${path.sep}`)) stop("图片目录不合法。");

try {
  await access(photoDirectory);
} catch {
  stop(`找不到图片目录：public/images/photography/${slug}`);
}

const outputPath = path.resolve(root, "src", "content", "photography", `${slug}.json`);
try {
  await access(outputPath);
  stop(`摄影集文件已经存在：src/content/photography/${slug}.json`);
} catch {
  // 文件不存在，继续创建。
}

const files = (await readdir(photoDirectory, { withFileTypes: true }))
  .filter(
    (entry) => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()),
  )
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));

if (files.length === 0) stop(`图片目录中没有受支持的图片：${photoDirectory}`);

const photos = [];
for (const [index, fileName] of files.entries()) {
  const filePath = path.join(photoDirectory, fileName);
  const metadata = await readImageMetadata(filePath);
  if (!metadata) stop(`无法读取图片尺寸：${fileName}`);
  photos.push({
    src: `/images/photography/${slug}/${fileName}`,
    alt: `待补充：第 ${index + 1} 张照片的准确内容`,
    width: metadata.width,
    height: metadata.height,
  });
}

const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const gallery = {
  title,
  description: "待补充：用一两句话介绍这组作品。",
  date,
  ...(location && { location }),
  cover: photos[0].src,
  coverAlt: photos[0].alt,
  featured: false,
  draft: true,
  photos,
};

await writeFile(outputPath, `${JSON.stringify(gallery, null, 2)}\n`, "utf8");

console.log(`摄影集草稿已创建：src/content/photography/${slug}.json`);
console.log(`已读取 ${photos.length} 张图片的路径与尺寸。`);
console.log("补充 description、alt 和可选 caption 后，将 draft 改为 false 即可发布。");
