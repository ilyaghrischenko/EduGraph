Read this file before every task.

# Project: edugraph.client

## Git
- **GitHub Owner:** ilyaghrischenko.
- **GitHub Repo:** EduGraph.
- **Main branch name:** main.
- **Develop branch name:** develop.

## Architecture & Patterns
- React + TypeScript single-page app built with Vite.
- Source is organized by responsibility under `src/api`, `src/components`, `src/components/ui`, `src/components/list`, `src/hooks`, `src/pages`, `src/router`, `src/styles`, `src/types`, and `src/utils`.
- Routing is centralized in `src/router/AppRouter.tsx`, with role-gated routes wrapped by `ProtectedRoute`.
- API access is centralized through `src/api/apiClient.ts`; endpoint modules in `src/api/*Api.ts` call `apiFetch`.
- Shared visual tokens live in `src/styles/tokens.ts` and are imported as `C` and `F`.
- `orval.config.js` is configured to generate React Query clients from `http://localhost:5074/swagger/v1/swagger.json` into `src/api/endpoints` and `src/api/models`.

## Stack
- **Runtime:** React 19, React DOM 19, React Router DOM 7.
- **Build:** Vite 7, TypeScript 5.9, `@vitejs/plugin-react`.
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite`, PostCSS, Autoprefixer, `clsx`, `tailwind-merge`.
- **Data/API:** native `fetch` wrapper in `src/api/apiClient.ts`, TanStack React Query dependency, Orval API generation config.
- **Forms:** React Hook Form dependency, `@hookform/resolvers` dependency.
- **Visualization:** `react-force-graph-2d`.
- **Auth:** JWT token utilities in `src/utils/auth.ts`, role helpers in `src/utils/roles.ts`, protected routing in `src/router/ProtectedRoute.tsx`.
- **Testing:** (none detected).
- **Tooling:** ESLint 9 flat config, TypeScript project references, npm package lock.

## Static Code Analyzer
- ESLint flat config: `eslint.config.js`.
- TypeScript app config: `tsconfig.app.json`.
- TypeScript Vite config: `tsconfig.node.json`.
- Formatter config: (none detected).

## Critical Coding Rules (MUST FOLLOW)
- Use strict TypeScript; `tsconfig.app.json` and `tsconfig.node.json` enable `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, and `erasableSyntaxOnly`.
- Keep app source under `src`; `tsconfig.app.json` includes only `src`.
- Use JSX with the React automatic runtime; `tsconfig.app.json` sets `jsx` to `react-jsx`.
- Use ESM imports and exports; `package.json` sets `"type": "module"` and TypeScript uses `verbatimModuleSyntax`.
- For type-only symbols, use `import type`; existing files use `import type` for React node types, API types, and router role types.
- Export reusable components, hooks, utilities, and API modules as named exports; existing `src/components`, `src/hooks`, `src/utils`, and `src/api` files follow named exports.
- Add or change routes in `src/router/AppRouter.tsx`; wrap restricted pages with `ProtectedRoute` and pass allowed `UserRole` values.
- Use `src/utils/roles.ts` for role validation and default role destinations; do not duplicate role string logic in new code.
- Use `src/utils/auth.ts` for token reads, writes, clearing, and role extraction; do not access `localStorage` or `sessionStorage` directly for auth tokens.
- Use `apiFetch` from `src/api/apiClient.ts` for HTTP calls so base URL normalization, JSON headers, bearer tokens, 401 redirects, and `ProblemDetails` error handling stay consistent.
- Keep API request and response shapes in `src/types/api.ts` unless generated Orval models are adopted for that endpoint.
- Use `C` and `F` from `src/styles/tokens.ts` for shared colors and fonts in handwritten UI.
- Follow the responsive convention in `src/index.css`: base utilities target mobile `>=320px`, `md` targets tablet `>=768px`, and `xl` targets desktop `>=1280px`.
- Preserve accessible interactive sizing from existing UI components: buttons and interactive links use at least `44px` minimum touch targets.
- Keep Vite's `/api` proxy target in `vite.config.ts` aligned with the backend at `http://localhost:5074` unless the backend port changes.

## Available Skills & Tools
- (none detected).

## Workspace Commands
- Install dependencies: `npm install`.
- Run dev server: `npm run dev`.
- Build: `npm run build`.
- Lint: `npm run lint`.
- Preview production build: `npm run preview`.
- Test: (none detected).

## Project Learnings

**Accumulated corrections. This section is for the agent to maintain, not just the human.**

When the user corrects your approach, append a one-line rule here before ending the session. Write it concretely ("Always use X for Y"), never abstractly ("be careful with Y"). If an existing line already covers the correction, tighten it instead of adding a new one. Remove lines when the underlying issue goes away (model upgrades, refactors, process changes).

- (empty)
