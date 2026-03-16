# Roadtrip Planner

Application web full-stack pour planifier des road trips : upload de fichiers GPX, organisation en voyages, visualisation sur carte interactive et météo le long du parcours.

## Fonctionnalités

- **Authentification** — Inscription, connexion, profil avec photo (Cloudinary)
- **Tracks GPX** — Upload et parsing de fichiers GPX, extraction des coordonnées, élévation et waypoints
- **Trips** — Création de voyages composés de plusieurs tracks ordonnés
- **Carte interactive** — Visualisation des routes avec MapLibre GL
- **Météo** — Données météo le long du parcours (OpenWeatherMap) avec graphiques d'humidité

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 19, React Router 7, Ant Design, React Query, MapLibre GL, D3.js, Vite |
| Backend | Express.js, Drizzle ORM, SQLite (dev) / Turso (prod) |
| Auth | JWT (jose), bcrypt |
| Validation | Zod (partagé entre frontend et backend) |
| Tooling | TypeScript, pnpm workspaces, Prettier, ESLint |
| Déploiement | Vercel |

## Structure du projet

```
roadtrip-planner/
├── packages/
│   ├── shared/     # Types et schémas Zod partagés
│   ├── api/        # Serveur Express
│   └── web/        # Application React
```

## Prérequis

- Node.js 24+
- pnpm 10+

## Installation

```bash
pnpm install
```

## Variables d'environnement

### `packages/api/.env`

```env
PORT=3000
OPENWEATHER_API_KEY=your_api_key_here

# Turso (production uniquement)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# JWT
JWT_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### `packages/web/.env`

```env
VITE_API_URL=http://localhost:3000
```

## Développement

```bash
# Lancer tous les packages en parallèle (shared watch + api + web)
pnpm dev

# Type-check
pnpm type-check

# Formatter le code
pnpm format

# Linter
pnpm lint
```

## Base de données

```bash
# Générer les migrations
pnpm --filter @roadtrip/api db:generate

# Appliquer les migrations
pnpm --filter @roadtrip/api db:migrate

# Ouvrir Drizzle Studio (UI d'administration)
pnpm --filter @roadtrip/api db:studio
```

## Déploiement

Le projet est déployé sur Vercel. La CI GitHub Actions vérifie automatiquement les types, le formatage et le lint sur chaque PR.
