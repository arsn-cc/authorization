# Project Guide

## Tech Stack & Package Manager

- **Framework:** Waku (React 19 RSC) + Vite
- **Language:** TypeScript (strict, esnext/bundler)
- **Routing:** File-based (`src/pages/`), `waku-jotai/router`
- **Styling:** Tailwind CSS v4, `tw-animate-css`, `cva`
- **UI:** shadcn/ui via `@base-ui/react`
- **State:** Jotai — all state in `src/lib/state/`
- **Package manager:** pnpm (never npm/yarn)

## Scripts

| Command                        | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `pnpm dev` / `build` / `start` | Dev, build, prod server                                 |
| `pnpm lint` / `lint:fix`       | oxlint (no `--fix` / `--fix`)                           |
| `pnpm format` / `format:check` | oxfmt (auto / check)                                    |
| `pnpm typecheck`               | `tsc --noEmit`                                          |
| `pnpm typegen`                 | Waku router type generation                             |
| `pnpm db:*`                    | `generate`, `push`, `migrate`, `studio`, `drop`, `seed` |
| `pnpm seed:create-user`        | Interactive admin user creation                         |

Always run `pnpm typecheck && pnpm lint && pnpm format:check` after changes. Commits blocked on any linter warning/error. Commit immediately after each completed change, no prompt needed.

## Commits

Conventional Commits — `<type>[scope]: <desc>` with optional body. Types: `feat|fix|refactor|chore|docs|style|test|perf`. Lowercase, no trailing period, wrap body at 72 chars.

## Linting & Formatting

- **Rules:** `curly`, `eqeqeq`, `no-floating-promises`, `promise/always-return` (`.then()` must `return;`), `exhaustive-deps: warn`, `no-unused-vars: error` (prefix with `_`)
- **Formatter:** tabs, 120 width, trailing commas, Tailwind class sorting
- **Ignored:** `dist/`, `.cache/`, `.vercel/`, `pages.gen.ts`, `node_modules/`
- **oxlintrc exceptions:** `no-explicit-any`, `no-empty-object-type`, `no-unsafe-type-assertion` off

## Conventions

- `@/` → `./src/`
- React 19 — no JSX import
- No default exports except pages
- Routes: `pages/<route>/index.tsx`
- `cn()` util: `clsx` + `tailwind-merge` in `src/lib/utils.ts`
- `cva()` for variants; PascalCase in `src/components/ui/`
- State in `src/lib/state/<domain>.ts` — `atom` for local, `atomWithStorage` for persisted; no `createContext`

## Infrastructure

- **DB:** Postgres via Drizzle ORM (`pg` driver), schema in `src/lib/db/schema.ts`, `getDb()` lazy singleton
- **Cache:** Redis via ioredis, `getCache()` — interface: `get`, `set`, `delete`, `clear`, `has`
- **Storage:** S3-compatible via `@aws-sdk/client-s3`, `getStorage()` — `write`, `read`, `delete`, `list`, `exists`, `clear`, `url`
- `.env` gitignored; copy `.env.example` for defaults

## Waku Routing

File-based in `src/pages/`. Pages export default async component + `getConfig`. `render: "static"` (default) or `"dynamic"` (default for API handlers).

### Page props: `PageProps<'/path'>`

| File                      | Prop                 |
| ------------------------- | -------------------- |
| `index.tsx`               | `path`, `query`      |
| `[slug]/index.tsx`        | `slug`               |
| `[...catchAll]/index.tsx` | `catchAll: string[]` |

### API routes

In `_api/` dir — `_api` prefix stripped from URL. Export HTTP method functions:

```ts
export const POST = (req: Request) => Response.json({ ok: true });
export async function GET(_req: Request, { params }: ApiContext<"/users/[id]">) {
	return Response.json({ id: params.id });
}
```

### Other

- `_layout.tsx` wraps children; `_root.tsx` customizes `<html>`
- `(group)/` dirs organize without affecting URLs
- Slices in `_slices/` with independent render modes (`<Slice id="..." />`)
- Middleware: `src/middleware/*.ts` (Hono)
- Navigation: `<Link>` from `waku`, `useRouter()` for programmatic
- Metadata auto-hoisted to `<head>`
