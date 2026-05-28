# docs-migrator

You are helping migrate documentation from `docs/` (Mintlify) to `docs-v2/` (Astro + custom "Bach" framework). Apply the conventions below precisely.

---

## 1. Navigation / Sidebar config

### Mintlify (`docs/docs.json`)

```json
{
  "tabs": [
    {
      "tab": "Docs",
      "pages": [
        {
          "group": "Get started",
          "pages": ["get-started/introduction", "get-started/quick-start"]
        }
      ]
    }
  ]
}
```

### Astro/Bach (`docs-v2/bach.config.ts`)

```typescript
export default defineConfig(collections, {
  defaultCollection: 'docs',
  navigation: {
    tabs: [
      {
        tab: 'Docs',
        pages: [
          {
            group: 'Get started',
            icon: 'Rocket', // optional Lucide icon name
            pages: ['index', 'get-started/quick-start'],
          },
        ],
      },
    ],
  },
})
```

**Key differences:**

- File is `bach.config.ts` (TypeScript), not `docs.json`
- Page slugs omit the `.mdx` extension — same as Mintlify
- Root index page is `'index'` (not `'introduction'` or a path)
- Groups can carry a Lucide `icon` string at the group level
- API reference tabs reference a `collection` property instead of page paths
- The `sidebarTitle` frontmatter field works the same in both

---

## 2. Content file location

|         | Mintlify (`docs/`)                 | Astro (`docs-v2/`)                                     |
| ------- | ---------------------------------- | ------------------------------------------------------ |
| Root    | `/`                                | `src/content/docs/`                                    |
| Example | `docs/get-started/quick-start.mdx` | `docs-v2/src/content/docs/get-started/quick-start.mdx` |

---

## 3. Frontmatter

Both systems share the same core fields. The Astro schema is:

```yaml
---
title: string # required
sidebarTitle: string # optional — shorter nav label
description: string # optional — SEO subtitle
icon: string # optional — Lucide icon name
prose: boolean # optional — default true; set false for custom layout pages
---
```

**Migration notes:**

- `mode: frame` (Mintlify homepage) → `prose: false` + import a custom Astro component
- `openapi:` frontmatter field does not exist in Astro; API pages come from content collections
- All other standard fields (`title`, `description`, `sidebarTitle`, `icon`) are identical
- If the source page has no `description` frontmatter, leave it absent — do **not** generate or invent one
- Do **not** add descriptive text paragraphs beneath page or section titles when none exist in the source

---

## 4. Component imports

Mintlify components are **globally available** — no import needed. In Astro, **every component must be explicitly imported** at the top of the MDX file.

### Callouts

| Mintlify (no import) | Astro import                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `<Tip>`              | `import { Tip } from '@/components/callouts'`                       |
| `<Note>`             | `import { Note } from '@/components/callouts'`                      |
| `<Info>`             | `import { Info } from '@/components/callouts'`                      |
| `<Warning>`          | `import { Warning } from '@/components/callouts'`                   |
| `<Check>`            | `import { Check } from '@/components/callouts'`                     |
| —                    | `import { Danger } from '@/components/callouts'` (new in Astro)     |
| —                    | `import { GoodToKnow } from '@/components/callouts'` (new in Astro) |

All callout components accept children as body content — usage syntax is unchanged.

### Layout & structure

| Mintlify           | Astro import                                                     | Notes      |
| ------------------ | ---------------------------------------------------------------- | ---------- |
| `<Card>`           | `import Card from '@/components/Card.astro'`                     | Same props |
| `<CardGroup>`      | `import CardGroup from '@/components/CardGroup.astro'`           | Same props |
| `<Columns>`        | `import Columns from '@/components/Columns.astro'`               | Same props |
| `<Steps>`          | `import Steps from '@/components/Steps.astro'`                   |            |
| `<Step>`           | `import Step from '@/components/Step.astro'`                     |            |
| `<Accordion>`      | `import Accordion from '@/components/Accordion.astro'`           |            |
| `<AccordionGroup>` | `import AccordionGroup from '@/components/AccordionGroup.astro'` |            |
| `<Frame>`          | `import Frame from '@/components/Frame.astro'`                   |            |
| `<Tooltip>`        | `import Tooltip from '@/components/Tooltip.astro'`               |            |

### Tabs

| Mintlify            | Astro import                                      |
| ------------------- | ------------------------------------------------- |
| `<Tabs>`            | `import Tabs from '@/components/tabs/Tabs.astro'` |
| `<Tab title="...">` | `import Tab from '@/components/tabs/Tab.astro'`   |

`<Tab>` accepts a required `title` string and an optional `icon` (Lucide icon name). Usage is otherwise identical:

```mdx
import Tabs from '@/components/tabs/Tabs.astro'
import Tab from '@/components/tabs/Tab.astro'

<Tabs>
  <Tab title="TypeScript">...</Tab>
  <Tab title="Python" icon="Code">
    ...
  </Tab>
</Tabs>
```

---

## 5. Images

### Mintlify pattern

```mdx
<Frame>
  <img alt="description" className="block dark:hidden" src="./assets/foo.png" />
  <img alt="Botpress ADK" className="hidden dark:block" src="./assets/foo-dark.png" />
</Frame>
```

### Astro pattern

```mdx
import { Picture } from 'astro:assets'
import fooImg from './assets/foo.png'
import fooDarkImg from './assets/foo-dark.png'

<Picture alt="description" class="block dark:hidden" src={fooImg} />
<Picture alt="description" class="hidden dark:block" src={fooDarkImg} />
```

**Key differences:**

- Use Astro's `<Picture>` (from `astro:assets`), not raw `<img>`
- Images are imported as ES modules — paths become typed imports
- Use `class=` not `className=` in `.astro` files; both work inside `.mdx` files with React components
- Asset files live alongside the MDX in `src/content/docs/<section>/assets/`
- Copy image files from `docs/<section>/assets/` → `docs-v2/src/content/docs/<section>/assets/`

### Custom Image snippet (Mintlify)

```mdx
import { Image } from '/snippets/image.mdx'
<Image alt="x" src="./assets/foo.png" srcDark="./assets/foo-dark.png" />
```

→ Replace with the Astro `<Picture>` pattern above.

---

## 6. Reusable snippets / partials

### Mintlify

Snippets live in `/snippets/` and are imported by absolute path:

```mdx
import { YouTube } from '/snippets/youtube.mdx'
import IncomingEvent from '/snippets/incoming-event.mdx'
```

### Astro

No global snippets folder. Options:

1. For **component-like snippets** (YouTube, Image): equivalent Astro components exist in `src/components/` — use those instead.
2. For **text/prose snippets**: move the content into `src/content/docs/` and use Astro's content collection partials, or inline the content.
3. Check `src/components/` for an Astro equivalent before creating a new one.

**YouTube:**

```mdx
// Mintlify
import { YouTube } from '/snippets/youtube.mdx'

<YouTube url="https://..." />

// Astro
import YouTube from '@/components/YouTube.astro'

<YouTube url="https://..." />
```

**IncomingEvent:**

```mdx
// Mintlify
import IncomingEvent from '/snippets/incoming-event.mdx'

<IncomingEvent />

// Astro
import IncomingEvent from '@/components/IncomingEvent.astro'

<IncomingEvent />
```

---

## 7. CodeGroup / code blocks

Mintlify uses `<CodeGroup>` for multi-language tabs. Astro does not have a built-in equivalent — check `src/components/` for a `CodeGroup` component. If absent, render separate fenced code blocks or ask whether one should be created.

Standard fenced code blocks work identically in both systems.

---

## 8. API reference pages

Mintlify uses `openapi:` frontmatter to auto-generate pages from OpenAPI specs. In Astro, API pages are driven by **content collections** defined in `src/api-collections.ts` and `src/content.config.ts`. Do not attempt to migrate API reference pages by hand — they are generated from the OpenAPI specs already present in `public/api-specs/`.

---

## 9. Checklist for migrating a single page

1. **Copy the MDX file** from `docs/<path>.mdx` → `docs-v2/src/content/docs/<path>.mdx`
2. **Update frontmatter**: remove `mode:`, `openapi:` fields; add `prose: false` only for full-custom layout pages; do not generate a `description` if the source doesn't have one
3. **Add component imports** — every Mintlify component used needs an explicit import (see §4)
4. **Fix image tags** — replace raw `<img>` / `<Image snippet>` with `<Picture>` imports (see §5)
5. **Replace snippet imports** — map to `@/components/` equivalents (see §6)
6. **Copy assets** — copy `./assets/*` from source section to equivalent path in `src/content/docs/`
7. **Register the page in `bach.config.ts`** — add the slug to the correct tab/group (see §1)
8. **Run `npm run check`** in `docs-v2/` to catch broken imports, type errors, and lint issues
