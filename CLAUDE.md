# CLAUDE.md

Instructions pour Claude Code sur ce projet.

## Structure du projet

Monorepo pnpm avec 3 packages :
- `packages/shared` — Types et schémas Zod communs (`@roadtrip/shared`)
- `packages/api` — Serveur Express (`@roadtrip/api`)
- `packages/web` — Frontend React (`@roadtrip/web`)

## Commandes essentielles

```bash
pnpm dev              # Démarre tout en parallèle (shared + api + web)
pnpm type-check       # Vérification TypeScript sur tous les packages
pnpm format           # Formate le code avec Prettier
pnpm format:check     # Vérifie le formatage sans modifier
pnpm lint             # ESLint sur tous les packages
```

## Conventions de code

- **Prettier** : pas de point-virgule, guillemets simples, indentation 2 espaces
- **TypeScript** strict activé sur tous les packages
- Les types et schémas Zod partagés vont dans `packages/shared/src/`
- Les routes API sont dans `packages/api/src/routes/` — une route par ressource
- La validation des données utilise Zod (défini dans `shared`, réutilisé côté API et web)

## Base de données

- Dev : SQLite local via Drizzle ORM
- Prod : Turso (SQLite distribué)
- Schéma : `packages/api/src/db/schema.ts`
- Après modification du schéma : `pnpm --filter @roadtrip/api db:generate` puis `db:migrate`

## Authentification

- JWT stocké en cookie HTTP-only
- Middleware auth dans `packages/api/src/middleware/`
- Le frontend utilise React Query pour les appels API authentifiés

## Variables d'environnement

- `packages/api/.env` — copier depuis `.env.example`
- `packages/web/.env` — `VITE_API_URL=http://localhost:3000`

## CI/CD

GitHub Actions sur chaque PR : `type-check`, `format:check`, `lint`. Toujours vérifier que ces 3 commandes passent avant de soumettre une PR.
