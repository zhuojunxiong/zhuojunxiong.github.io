# 柳无心的个人网站

这是一个使用 Astro 构建的静态个人网站，用来发布三类内容：

- 技术分享
- 摄影作品集
- 技术之外的文章

网站不需要数据库和后台。文章保存在 Markdown 文件中，摄影集保存在 JSON 文件中，推送到 GitHub 后会自动发布到 GitHub Pages。

正式地址：

```text
https://zhuojunxiong.github.io
```

## 平时最常用的操作

启动本地网站：

```powershell
npm run dev
```

浏览器打开：

```text
http://localhost:4321
```

发布前做完整检查：

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'
npm run verify
```

检查通过后提交并推送到 GitHub，网站会自动部署。

## 项目结构

```text
src/
├── components/              公共组件，例如导航、页脚、阅读进度
├── content/
│   ├── tech/                技术文章
│   ├── articles/            普通文章和随笔
│   └── photography/         摄影集资料
├── layouts/                 文章与页面布局
├── pages/                   网站页面和网址
├── styles/global.css        全站视觉样式
├── content.config.ts        内容格式规则
└── site.config.ts           姓名、标语、邮箱、首页照片

public/
├── images/                  网站使用的图片
├── favicon.svg              浏览器标签图标
└── robots.txt               搜索引擎规则

scripts/
├── create-gallery.mjs       自动生成摄影集草稿
├── validate-content.mjs     检查内容与图片
└── check-dist.mjs           检查构建后的页面和链接
```

## 新增技术文章

在 `src/content/tech/` 新建一个 Markdown 文件。文件名使用英文、数字和短横线，例如：

```text
src/content/tech/my-learning-note.md
```

文件内容：

```md
---
title: "文章标题"
description: "用一两句话说明这篇文章解决什么问题。"
publishedDate: 2026-07-29
tags: ["Astro", "学习记录"]
featured: false
draft: true
series: "系列名称"
difficulty: "入门"
---

## 问题

正文从这里开始。

## 过程

写下分析和操作过程。

## 结论

记录最后得到的结果。
```

写完后，把：

```text
draft: true
```

改成：

```text
draft: false
```

文章就会进入网站。

技术文章还可以使用以下可选字段：

```md
updatedDate: 2026-07-30
cover: "/images/tech/my-learning-note/cover.jpg"
coverAlt: "封面图片中实际出现的内容"
```

只要填写了 `cover`，就必须同时填写准确的 `coverAlt`。

## 新增普通文章

在 `src/content/articles/` 新建 Markdown 文件：

```text
src/content/articles/a-quiet-day.md
```

文件内容：

```md
---
title: "文章标题"
description: "文章摘要。"
publishedDate: 2026-07-29
category: "随笔"
featured: false
draft: true
---

正文从这里开始。
```

同样，完成后把 `draft` 改成 `false`。

普通文章也支持：

```md
updatedDate: 2026-07-30
cover: "/images/articles/a-quiet-day/cover.jpg"
coverAlt: "封面图片的准确描述"
```

## 新增摄影作品集

### 第一步：放入照片

在下面的目录中新建一个英文文件夹：

```text
public/images/photography/
```

例如准备发布“重庆夜晚”：

```text
public/images/photography/chongqing-night/
```

把照片放进去，建议按照观看顺序命名：

```text
01.jpg
02.jpg
03.jpg
```

支持 `jpg`、`jpeg`、`png`、`webp` 和 `gif`。摄影照片优先使用 `jpg` 或 `webp`。

### 第二步：自动生成资料

运行：

```powershell
npm run gallery:new -- chongqing-night "重庆夜晚" "重庆"
```

系统会自动：

- 扫描照片
- 按文件名排序
- 读取真实宽高
- 填写每张照片的路径
- 创建摄影集草稿

生成的文件位于：

```text
src/content/photography/chongqing-night.json
```

### 第三步：补充文字

打开生成的 JSON，补充：

- `description`：整组作品的介绍
- `coverAlt`：封面照片内容
- 每张照片的 `alt`：照片中实际出现的内容
- `caption`：可选的照片说明

确认完成后，把：

```json
"draft": true
```

改为：

```json
"draft": false
```

不需要手动计算图片尺寸。

## 草稿与定时内容

技术文章、普通文章和摄影集都支持：

```text
draft: true
```

草稿不会出现在首页、列表、详情页、RSS 或 sitemap 中。

如果发布日期晚于当前时间，内容也不会提前公开。到达日期后重新构建或推送一次即可上线。

## 首页精选规则

内容中的：

```text
featured: true
```

表示优先作为首页精选。

如果同时存在多个精选内容，网站会选择日期最新的一篇或一组。

## 图片说明怎么写

`alt` 用来描述图片实际内容，也会帮助无法直接看到图片的访客理解作品。

推荐：

```text
雪落在蓝绿色湖面上，岸边是冬季森林和木栈道
```

不推荐：

```text
好看的照片
```

摄影集草稿生成时会出现“待补充”文字。只要这些内容还没有填写，自动检查就不会允许把摄影集正式发布。

## 自动检查会检查什么

运行：

```powershell
npm run build
```

会依次检查：

- Astro 页面和内容类型
- 图片路径是否真实存在
- 图片扩展名是否与实际格式一致
- 摄影图片宽高是否正确
- 摄影集中是否有重复图片
- 封面是否属于当前摄影集
- 正式内容是否仍有待补充文字
- 构建后的页面标题、描述和主标题
- 页面中的本地链接和图片是否存在
- 页面中是否出现 `undefined`、`NaN` 或占位资源

更完整的发布前检查：

```powershell
npm run verify
```

它还会检查所有文件的格式。

## 修改个人信息

打开：

```text
src/site.config.ts
```

这里可以修改：

- 网站名字
- 首页标语
- 网站简介
- GitHub 地址
- 公开邮箱
- 首页首屏照片

不要把密码、Token、密钥、身份证号或详细住址写进项目。

## 发布到 GitHub Pages

项目已经配置 `.github/workflows/deploy.yml`。

正常发布流程：

1. 运行 `npm run verify`
2. 提交修改
3. 推送到 `main`
4. GitHub Actions 自动构建
5. 构建成功后网站自动更新

GitHub Pages 设置中的发布来源应为：

```text
GitHub Actions
```

## 常用命令

```powershell
npm run dev
```

启动本地预览。

```powershell
npm run check
```

检查 Astro 页面和类型。

```powershell
npm run validate:content
```

检查图片路径、格式和尺寸。

```powershell
npm run build
```

执行检查并生成正式网站。

```powershell
npm run verify
```

执行格式检查和完整构建，适合每次发布前运行。

## RSS

技术文章：

```text
https://zhuojunxiong.github.io/tech/rss.xml
```

普通文章：

```text
https://zhuojunxiong.github.io/articles/rss.xml
```
