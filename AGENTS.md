# Project Guide

## Tech Stack

- **Framework:** [Waku](https://waku.gg) (React 19 RSC) + Vite
- **Language:** TypeScript (strict, `esnext`/`bundler`)
- **Routing:** File-based (`src/pages/`), `waku-jotai/router` with `RouterProvider`
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), `tw-animate-css`, `class-variance-authority`
- **UI:** shadcn/ui via `@base-ui/react`
- **State:** [Jotai](https://jotai.org/) — all state in `src/lib/state/`
- **Build:** React Compiler via `@vitejs/plugin-react` + Babel

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
| `pnpm format:check` | `oxfmt --check` (CI)        |
| `pnpm typecheck`    | `tsc --noEmit`              |
| `pnpm typegen`      | Waku router type generation |

Always run `pnpm typecheck && pnpm lint && pnpm format:check` after making changes.

After any completed file change, commit the change without waiting for a separate commit request.

## Linting & Formatting

- **Linter:** `oxlint` + `oxlint-tsgolint` (type-aware). Key rules: `curly: error`, `eqeqeq: error`, `no-floating-promises: error`, `exhaustive-deps: warn`, `no-unused-vars: error` (prefix ignored with `_`)
- **Formatter:** `oxfmt` — tabs, 120 width, trailing commas, Tailwind class sorting
- **Ignored:** `dist/`, `.cache/`, `.vercel/`, `pages.gen.ts`, `node_modules/`
- **`oxlintrc` exceptions:** `no-explicit-any` off, `no-empty-object-type` off, `no-unsafe-type-assertion` off

## Import Conventions

- `@/` maps to `./src/`
- React 19 — no JSX import needed
- No default exports except pages (Waku convention)
- Routes: `pages/<route>/index.tsx`, NOT `pages/<route>.tsx`

## State Management

All state in `src/lib/state/<domain>.ts`. Use `atom` from jotai for local, `atomWithStorage` for persisted. Do NOT use `createContext`.

Current modules: `theme.ts` (persisted), `is-mobile.ts` (responsive), `sidebar.ts` (open/close).

## UI Components

- `cn()` util: `clsx` + `tailwind-merge` in `src/lib/utils.ts`
- `cva()` for variant definitions
- PascalCase components in `src/components/ui/`
- Providers in `src/components/provider/`

## Project Structure

```
src/
├── components/
│   ├── provider/          # ThemeProvider, etc.
│   ├── ui/                # shadcn components
│   ├── counter.tsx
│   ├── footer.tsx
│   └── header.tsx
├── lib/
│   ├── cache/             # Cache: Redis (ioredis)
│   ├── db/                # DB: Postgres (Drizzle ORM)
│   ├── state/             # Jotai atoms
│   ├── storage/           # Storage: S3-compatible
│   └── utils.ts
├── pages/                 # File-based routing
│   ├── _layout.tsx        # Root layout (SSR)
│   ├── index.tsx          # /
│   └── about/             # /about
├── styles/globals.css
├── global.d.ts
└── pages.gen.ts           # Auto-generated
```

## Database (Drizzle ORM)

- `drizzle-orm` + `drizzle-kit` (Postgres only, `node-postgres` with `pg`)
- Schema in `src/lib/db/schema.ts` — `pgTable` definitions
- `getDb()` lazy singleton

| Command                 | Purpose                         |
| ----------------------- | ------------------------------- |
| `pnpm db:generate`      | Generate SQL migrations         |
| `pnpm db:push`          | Push schema to database         |
| `pnpm db:migrate`       | Apply migrations                |
| `pnpm db:studio`        | Open Drizzle Studio             |
| `pnpm db:drop`          | Drop database objects           |
| `pnpm db:seed`          | Seed roles and permissions      |
| `pnpm seed:create-user` | Interactive admin user creation |

## Cache (`src/lib/cache/`)

Redis via ioredis. Lazy singleton via `getCache()`.

- **Interface:** `get`, `set`, `delete`, `clear`, `has`

## Storage (`src/lib/storage/`)

S3-compatible storage via `@aws-sdk/client-s3`. Lazy singleton via `getStorage()`.

- **Interface:** `write`, `read`, `delete`, `list`, `exists`, `clear`, `url`

## Dev Environment

- `.env` gitignored; copy `.env.example` for defaults
- Requires Postgres, Redis, and S3-compatible storage (e.g. MinIO) running locally
- Startup log: `[startup] db=postgres-js cache=redis storage=s3`

## Key Libraries

- React 19, React DOM 19, react-server-dom-webpack 19
- `waku` 1.0.0-beta.4, `waku-jotai`
- `tailwindcss` 4.3.1, `jotai` 2.x, `zod` 4.x
- `drizzle-orm` 1.x, `postgres` 3.x, `@aws-sdk/client-s3`, `ioredis`
- `recharts` 3.8.0, `embla-carousel-react` 8.x, `sonner` 2.x, `vaul`, `cmdk`, `input-otp`, `react-day-picker` 10.x

## Waku Routing

File-based in `src/pages/`. Routes are `pages/<route>/index.tsx`. Pages export a default async component + `getConfig`.

### Rendering Modes

```ts
export const getConfig = async () => ({ render: "static" }) as const; // or "dynamic"
```

Pages default `static`, API handlers default `dynamic`.

### Page Props

Use `PageProps<'/path/pattern'>` from `waku/router`:

| File                          | Route              | Key Prop              |
| ----------------------------- | ------------------ | --------------------- |
| `index.tsx`                   | `/`                | `path`, `query`       |
| `blog/[slug]/index.tsx`       | `/blog/:slug`      | `slug`                |
| `shop/[cat]/[prod]/index.tsx` | `/shop/:cat/:prod` | `category`, `product` |
| `app/[...catchAll]/index.tsx` | `/app/*`           | `catchAll: string[]`  |

### Layouts & Groups

- **`_layout.tsx`** wraps children; nest to scope. Root at `pages/_layout.tsx`.
- **`(group)/`** directories organize without affecting URLs.
- **`_root.tsx`** customizes `<html>`/`<head>`/`<body>`.

### API Routes

In `_api/` dir; HTTP method exports, `_api` prefix stripped from URL:

```ts
export const POST = (req: Request) => Response.json({ ok: true });
export async function GET(_req: Request, { params }: ApiContext<"/users/[id]">) {
	return Response.json({ id: params.id });
}
```

### Other

- **Slices:** Reusable components in `_slices/` with independent render modes. Use `<Slice id="..." />`.
- **Navigation:** `<Link to="/about">` from `waku`, `useRouter()` for programmatic.
- **Middleware:** `src/middleware/*.ts` (Hono), **Interceptors:** `src/pages/_interceptors/*.ts`
- **Config:** `jotai` + `waku-jotai` as `noExternal` in `waku.config.ts`
- **Metadata** auto-hoisted to `<head>`
