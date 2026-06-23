# BEC Accreditation Demo Conventions

- Use React 18, TypeScript strict mode, Vite SPA, and React Router v6.
- Style with Tailwind CSS v3 and local shadcn/ui-style Radix primitives under `src/components/ui`.
- Keep all UI state and seeded mock data in Zustand with localStorage persistence.
- Route all mutations and async UI behavior through `src/services/mockApi.ts`.
- Drive application category fields and document rules from `src/data/categoryConfig.ts`.
- Keep brand colors in Tailwind/CSS variables rather than hardcoded component palettes.
- Preserve the five demo roles and RBAC boundaries: applicant, central administrator, returning officer, super administrator, verifier.
- Verify changes with `pnpm build`, `pnpm lint`, and `pnpm test`.
