# Project Guide

## Tech Stack

- **Framework:** [Waku](https://waku.gg) (React 19 RSC framework) + Vite
- **Language:** TypeScript (strict mode, `esnext` target, `bundler` resolution)
- **Routing:** File-based (`src/pages/`), uses `waku-jotai/router` with `RouterProvider`
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin), `tw-animate-css`, `class-variance-authority`
- **UI:** [shadcn/ui](https://ui.shadcn.com/) components with Radix UI primitives via `@base-ui/react`
- **State:** [Jotai](https://jotai.org/) — all reusable/global state in `src/lib/state/`
- **Build:** React Compiler via `@vitejs/plugin-react` + Babel preset

## Package Manager

pnpm — do NOT use npm or yarn.

## Scripts

| Command             | Purpose                     |
| ------------------- | --------------------------- |
| `pnpm dev`          | Start dev server            |
| `pnpm build`        | Production build            |
| `pnpm start`        | Production server           |
| `pnpm lint`         | `oxlint` (no `--fix`)       |
| `pnpm lint:fix`     | `oxlint --fix`              |
| `pnpm format`       | `oxfmt` (auto-format)       |
| `pnpm format:check` | `oxfmt --check` (CI check)  |
| `pnpm typecheck`    | `tsc --noEmit`              |
| `pnpm typegen`      | Waku router type generation |

Always run all three checks (`pnpm typecheck && pnpm lint && pnpm format:check`) after making changes.

## Linting & Formatting

- **Linter:** `oxlint` with `oxlint-tsgolint` for type-aware rules (see `.oxlintrc.json`)
- **Formatter:** `oxfmt` — tabs, 120 print width, trailing commas, Tailwind CSS class sorting via `sortTailwindcss` (functions: `clsx`, `cn`, `cva`, `tw`)
- **Key rules:** `curly: error` (always use braces), `eqeqeq: error` (always `===`/`!==`), `no-floating-promises: error`, `exhaustive-deps: warn`, `no-unused-vars: error` (prefix ignored vars with `_`)
- **Ignored patterns:** `dist/`, `.cache/`, `.vercel/`, `pages.gen.ts`, `node_modules/`

## Import Conventions

- Use `@/` path alias for all source imports (maps to `./src/`)
- React 19 — no need to import React for JSX (`"jsx": "react-jsx"`)
- No default exports except pages (Waku convention)
- Route files use `pages/<route>/index.tsx` format (directory with `index.tsx`), NOT flat `pages/<route>.tsx`

## State Management Pattern

All reusable state lives in `src/lib/state/<domain>.ts`:

- Use `atom` from `jotai` for local-reactive state
- Use `atomWithStorage` from `jotai/utils` for persisted state (`localStorage`)
- Export typed atoms and optional convenience hooks
- Do NOT use `createContext` — prefer Jotai atoms for cross-cutting state

Example:

```ts
// src/lib/state/theme.ts
import { atomWithStorage } from "jotai/utils";
export type Theme = "dark" | "light" | "system";
export const themeAtom = atomWithStorage<Theme>("vite-ui-theme", "dark");
```

Consumed by:

```ts
import { useAtom } from "jotai";
import { themeAtom } from "@/lib/state/theme";
const [theme, setTheme] = useAtom(themeAtom);
```

Current state modules:

- `theme.ts` — persisted theme preference
- `is-mobile.ts` — reactive mobile breakpoint detection
- `sidebar.ts` — sidebar open/close + mobile state

## UI Component Patterns

- **`cn()` utility** (`src/lib/utils.ts`): combines `clsx` + `tailwind-merge` for class merging
- **`cva()`** (`class-variance-authority`): component variant definitions
- **`@base-ui/react/use-render`** + **`@base-ui/react/merge-props`**: used by shadcn primitives for polymorphic rendering
- Components are PascalCase (`SidebarMenuButton`) in `src/components/ui/`
- Providers live in `src/components/provider/`
- Pages use kebab-case files in `src/pages/`
- Avoid inline comments in component code

## Project Structure

```
src/
├── components/
│   ├── provider/          # React contexts / Jotai providers
│   │   └── theme-provider.tsx
│   ├── ui/                # shadcn UI components
│   ├── counter.tsx
│   ├── footer.tsx
│   └── header.tsx
├── lib/
│   ├── db/                # Drizzle ORM (schema + client)
│   ├── state/             # Jotai atoms (one file per domain)
│   └── utils.ts           # cn() utility
├── pages/                 # File-based routing
│   ├── _layout.tsx        # Root layout (async, SSR)
│   ├── index.tsx          # Home page
│   └── about/
│       └── index.tsx      # /about
├── styles/
│   └── globals.css
├── global.d.ts
└── pages.gen.ts           # Auto-generated (do not edit)
```

## Database (Drizzle ORM)

- **ORM:** Drizzle ORM (`drizzle-orm`) + PostgreSQL driver (`postgres`)
- **CLI:** `drizzle-kit` for migrations, push, studio
- **Schema:** `src/lib/db/schema.ts` — define all tables here
- **Client:** `src/lib/db/index.ts` — exports `db` instance (already loaded with schema)
- **Config:** `drizzle.config.ts` at project root

### Commands

| Command            | Purpose                                |
| ------------------ | -------------------------------------- |
| `pnpm db:generate` | Generate SQL migration files           |
| `pnpm db:push`     | Push schema directly to database (dev) |
| `pnpm db:migrate`  | Apply generated migrations             |
| `pnpm db:studio`   | Open Drizzle Studio (GUI)              |
| `pnpm db:drop`     | Drop database objects                  |

Requires `DATABASE_URL` env var (`.env` files are gitignored).

## Key Libraries & Versions

- React 19 (stable), React DOM 19, react-server-dom-webpack 19
- `waku` 1.0.0-beta.4, `waku-jotai`
- `tailwindcss` 4.3.1 (bundled via `@tailwindcss/vite`)
- `jotai` 2.x, `zod` 4.x
- `drizzle-orm` 0.45.x, `drizzle-kit` 0.31.x, `postgres` 3.x
- `recharts` 3.8.0, `embla-carousel-react` 8.x, `sonner` 2.x, `vaul`, `cmdk`, `input-otp`, `react-day-picker` 10.x, `react-resizable-panels`

## Waku Routing (Pages Router)

Waku uses file-based routing in `src/pages/`. Route files use `pages/<route>/index.tsx` format (directory with `index.tsx`), NOT flat `pages/<route>.tsx`. Pages and layouts export a default async component and a named `getConfig` function.

### Rendering Modes (`getConfig`)

- `'static'` — static prerendering (SSG) at build time (default)
- `'dynamic'` — server-side rendering (SSR) at request time

Pages, layouts, and slices default to `static`; API handlers default to `dynamic`.

```ts
export const getConfig = async () => {
	return { render: "static" } as const;
};
```

### Page Types

| File                                  | Route              | Props                                  |
| ------------------------------------- | ------------------ | -------------------------------------- |
| `index.tsx`                           | `/`                | `path`, `query`                        |
| `about/index.tsx`                     | `/about`           | `path`, `query`                        |
| `blog/[slug]/index.tsx`               | `/blog/:slug`      | `path`, `query`, `slug`                |
| `shop/[category]/[product]/index.tsx` | `/shop/:cat/:prod` | `path`, `query`, `category`, `product` |
| `app/[...catchAll]/index.tsx`         | `/app/*`           | `path`, `query`, `catchAll: string[]`  |

Use `PageProps<'/path/pattern'>` from `waku/router` for type-safe props:

```ts
import type { PageProps } from "waku/router";

export default async function Page({ slug }: PageProps<"/blog/[slug]">) {
	// slug is typed as string
}
```

For static segment routes, provide `staticPaths`:

```ts
export const getConfig = async () => {
	return { render: "static", staticPaths: ["post-1", "post-2"] } as const;
};
```

For nested static segments, use arrays:

```ts
export const getConfig = async () => {
	return {
		render: "static",
		staticPaths: [
			["category-1", "product-a"],
			["category-1", "product-b"],
		],
	} as const;
};
```

### Layouts (`_layout.tsx`)

Wrap child routes. Must accept `children: ReactNode`. Nest them in subdirectories to scope layouts.

- **Root layout** at `src/pages/_layout.tsx` — global styles, metadata, providers, header/footer
- **Nested layouts** at e.g. `blog/_layout.tsx` — wraps both `/blog` and `/blog/[slug]`

### Group Routes (`(group)/`)

Directories in parentheses organize routes without affecting URLs:

```
src/pages/
├── (marketing)/
│   ├── _layout.tsx   # shared layout for marketing pages
│   ├── about.tsx     # /about
│   └── pricing.tsx   # /pricing
└── index.tsx         # / (no shared layout)
```

### Root Element (`_root.tsx`)

Customize `<html>`, `<head>`, or `<body>` by creating `src/pages/_root.tsx`:

```ts
export default async function RootElement({ children }: { children: ReactNode }) {
  return <html lang="en"><head /><body>{children}</body></html>;
}
```

### Ignored Directories

- `_components/` — shared components scoped to a route segment, NOT routed
- `_hooks/` — shared hooks scoped to a route segment, NOT routed

### API Routes (`_api/`)

Create API endpoints using HTTP method exports. The `_api/` prefix is stripped from the URL.

```ts
// src/pages/_api/contact.ts → POST /contact
export const POST = async (request: Request): Promise<Response> => {
	return Response.json({ ok: true });
};
```

`ApiContext` provides typed route params for dynamic API routes:

```ts
import type { ApiContext } from "waku/router";

export async function GET(_req: Request, { params }: ApiContext<"/users/[id]">) {
	return Response.json({ id: params.id });
}
```

### Slices (`_slices/`)

Reusable components in `src/pages/_slices/` with independent rendering modes. Use `<Slice id="..." />` in pages and list slice IDs in `getConfig`:

```ts
import { Slice } from 'waku';

export default function Page() {
  return <Slice id="header" lazy fallback={<p>Loading...</p>} />;
}

export const getConfig = () => ({ render: 'static', slices: [] });
```

### Navigation

- **`<Link to="/about">`** from `waku` — client-side navigation
- **`useRouter()`** from `waku` — `push()`, `replace()`, `back()`, `forward()`, `reload()`, `prefetch()`

### Middleware & Interceptors

- **Middleware** at `src/middleware/*.ts` — auto-loaded Hono middleware (`MiddlewareHandler`)
- **Interceptors** at `src/pages/_interceptors/*.ts` — wrap each render call (`HandlerInterceptor`)

### Current Project Config

- SSR externals: `jotai` and `waku-jotai` are configured as `noExternal` in `waku.config.ts`
- Layout uses `waku-jotai/router`'s `RouterProvider` to wrap page content
- Metadata (`<link>`, `<meta>`, `<title>`) is auto-hoisted to `<head>`
