# dbraccia.com

Personal academic website for Domenick J. Braccia, built with [Hugo](https://gohugo.io/) and the [Scholar-Lite](https://github.com/Yiming-M/Scholar-Lite) theme. Deployed automatically to GitHub Pages via GitHub Actions.

## Site Structure

```
content/
├── _index.md          ← Home page
├── cv.md              ← CV page (PDF embed + download)
└── posts/
    └── my-post/
        └── index.md   ← Blog post
static/
├── images/
│   └── profile.jpg    ← Profile photo
└── files/
    └── cv.pdf         ← CV PDF
hugo.toml              ← Site config (bio, social links, nav)
```

## Adding a New Blog Post

Create a new folder and Markdown file under `content/posts/`:

```bash
mkdir content/posts/my-new-post
touch content/posts/my-new-post/index.md
```

Add frontmatter at the top of the file:

```markdown
---
title: My Post Title
author: Domenick J. Braccia
date: 2026-06-17
tags: [bioinformatics, research]
draft: false
---

Your content here...
```

## Updating Bio or Social Links

Edit `hugo.toml`:

- `params.bio` — bio paragraph (supports Markdown)
- `params.social` — social links (supported names: `GitHub`, `LinkedIn`, `Twitter`, `Google Scholar`)
- `[menus]` — navigation links

## Local Preview

```bash
hugo server -D
# Visit http://localhost:1313
```

## Publishing

Push to `main` — GitHub Actions builds and deploys automatically (~1 min):

```bash
git add .
git commit -m "your message"
git push
```

No local build step needed.
