---
title: "How This Site Is Put Together"
description: "A tour of this site’s architecture: Astro, content collections, static pages, RSS, and automated deployment to GitHub Pages."
publishedDate: 2026-07-29
tags: ["Astro", "Personal Website", "GitHub Pages"]
featured: true
draft: false
series: "Building a Personal Website"
difficulty: "Beginner"
---

## Why a Static Site

The aim was never to build an elaborate administration system. It was to make a personal publishing space that could be maintained for years, holding technical notes, photography, and essays beneath one roof. A static site suits that purpose well.

A static site turns its content into HTML before anyone visits. It is fast, needs no database, and avoids the extra machinery of accounts, permissions, and server state. As long as the repository survives, the whole publication remains portable.

## The Core Directories

Most of the site lives under `src/`, arranged in three layers:

| Directory      | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `src/pages/`   | Defines routes: the home page, indexes, and individual entries |
| `src/content/` | Stores Markdown writing and JSON photography collections       |
| `src/layouts/` | Keeps related pages visually and structurally consistent       |

Images live in `public/images/` rather than `src/`. Files under `public/` are copied unchanged into the finished site, which keeps their URLs predictable. An image stored at `public/images/photography/demo.jpg`, for example, is referenced as `/images/photography/demo.jpg`.

## Why Content Collections Matter

Astro’s Content Collections add structural validation. A technical note must have a title, summary, and publication date; every photograph must provide `src`, `alt`, `width`, and `height`.

What looks like a restriction is really a guardrail. As the archive grows, a missing summary or image dimension is caught during the build—not discovered later on a broken public page.

## How Pages Appear Automatically

A note placed in `src/content/tech/` appears automatically in the technology index and receives its own page. Essays follow the same pattern, while each photography JSON file becomes a gallery.

For example:

```text
src/content/tech/how-this-site-is-built.md
```

generates:

```text
/tech/how-this-site-is-built/
```

This keeps new work light. There is no navigation to edit and no page template to copy. Once an entry passes validation, its index, detail page, RSS feed, and sitemap all update together.

## Automated Deployment

GitHub Actions handles deployment. After a successful local build, a push to `main` installs dependencies, builds the site, and publishes it to GitHub Pages.

The essential maintenance check is:

```bash
npm run build
```

If Astro telemetry cannot write to the user directory in a restricted environment, it can be disabled for the build:

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'; npm run build
```

## A Principle for Maintenance

The simplest lasting habit is separation: content with content, images with images, configuration with configuration.

Technical notes belong in `src/content/tech/`, essays in `src/content/articles/`, gallery data in `src/content/photography/`, and images in `public/images/`. When those boundaries remain clear, the site grows into a durable personal archive rather than a heap of temporary pages.
