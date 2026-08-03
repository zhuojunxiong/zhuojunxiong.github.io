---
title: "Publishing with Markdown"
description: "A practical guide to frontmatter, images, headings, drafts, and pre-publication checks on a personal site."
publishedDate: 2026-07-29
tags: ["Markdown", "Writing Workflow", "Content Maintenance"]
featured: false
draft: false
series: "Building a Personal Website"
difficulty: "Beginner"
---

## Markdown Is Made for the Long Term

Markdown’s virtue is not abundance, but restraint. It stores words as plain text and asks for almost no allegiance to a particular application. A file written today can enter a website tomorrow and remain legible many years from now.

That stability matters on a personal site. An article is not a disposable announcement; it is something to revisit, revise, and archive. Markdown keeps the writing light while the site takes care of its appearance.

## Frontmatter Gives an Article Its Identity

The block between `---` marks at the beginning of a file is its frontmatter. It does not appear in the article, but tells the site its title, summary, date, category, and cover image.

A technical note begins like this:

```md
---
title: "Article Title"
description: "A one-sentence summary"
publishedDate: 2026-08-01
tags: ["First Tag", "Second Tag"]
featured: false
draft: false
---

The article begins here.
```

When `draft` is `true`, the entry stays off the published site. It is a convenient way to keep unfinished work close without placing it in public view.

## Writing Image Paths

Images belong under `public/images/`, ideally in a separate directory for each article:

```text
public/images/tech/my-post/cover.jpg
public/images/tech/my-post/screenshot-01.png
```

In Markdown, omit `public` and begin the URL at `/images/`:

```md
![A terminal showing the build log](/images/tech/my-post/screenshot-01.png)
```

The same rule applies to cover images:

```md
cover: "/images/tech/my-post/cover.jpg"
coverAlt: "A terminal showing the build log"
```

## Keep the Heading Hierarchy Steady

Begin article sections with second-level headings:

```md
## First Section

### A Subsection
```

The page already has a first-level heading—the article title. Adding more of them inside the body makes the reading hierarchy unclear.

Clear subheadings help technical writing separate a problem, its analysis, the solution, and the conclusion. Essays may wander more freely, though a long piece still benefits from a few visible landmarks.

## Before Publishing

After adding or changing content, run:

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'; npm run build
```

A successful command confirms that the content fields, generated pages, and types are sound. The changes can then be committed and pushed for GitHub Pages to publish.

The rhythm can stay simple: write a draft, set `draft` to `false` when it is ready, then publish after a clean build. It is slower than composing in a web dashboard, but steadier—and the words remain in your keeping.
