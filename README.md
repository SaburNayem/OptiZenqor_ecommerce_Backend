# OptiZenqor Backend

Production-ready NestJS backend for the OptiZenqor ecosystem. This single REST API serves:

- Flutter mobile ecommerce app
- React + Vite storefront
- React + Vite admin dashboard

## Stack

- NestJS
- PostgreSQL
- Prisma ORM
- JWT authentication with refresh sessions
- Role-based access control
- Swagger
- class-validator
- Throttler-ready rate limiting

## Architecture

```text
src/
  main.ts
  app.module.ts
  common/
  config/
  database/
  modules/
    auth/
    users/
    admins/
    products/
    categories/
    favorites/
    cart/
    orders/
    payments/
    homepage/
    offers/
    support/
    content/
    features/
    system/
    uploads/
prisma/
  schema.prisma
  seed.ts
```

## Key Capabilities

- Customer registration, login, refresh, logout, forgot/reset password
- JWT-protected private APIs with admin role guards
- Product and category CRUD with archive-safe product deletion
- Favorite list and cart persistence per user
- Checkout flow from current cart with stock validation and address snapshotting
- Order management for customers and admins
- Homepage section management with JSON payloads for flexible frontend rendering
- Offer management, editorial content, support threads/messages, feature flags, system config
- Admin overview endpoints for dashboard integrations
- Swagger docs and seed data for quick frontend connection

## Setup

1. Install dependencies

```bash
npm install
```

2. Copy environment variables

```bash
cp .env.example .env
```

3. Update `DATABASE_URL` in `.env` to point at PostgreSQL.

4. Generate Prisma client

```bash
npm run prisma:generate
```

5. Run migrations

```bash
npm run prisma:migrate
```

6. Seed demo data

```bash
npm run prisma:seed
```

7. Start development server

```bash
npm run start:dev
```

## Swagger

- Swagger UI path defaults to `/docs`
- Bearer token auth is enabled in the docs

## Seed Credentials

- Super admin: `superadmin@optizenqor.com`
- Admin: `admin@optizenqor.com`
- Customer: `customer@optizenqor.com`
- Password: `Password123!`

## Frontend Integration Notes

### Mobile App

- Use `/auth/*`, `/users/me`, `/products`, `/favorites`, `/cart`, `/orders`, and `/support`
- Homepage rendering can consume `/homepage` directly with section-based JSON content

### Storefront Web

- Replace localStorage cart/favorites with `/cart` and `/favorites`
- Use `/products`, `/categories`, `/offers`, `/content`, and `/homepage`
- Checkout flow:
  - fetch `/cart`
  - collect address from `/users/me/addresses`
  - submit `/orders/checkout`
  - optionally call `/payments/prepare`

### Admin Dashboard

- Use `/admin/*` overview endpoints for dashboards and summary widgets
- Use CRUD endpoints on `/products`, `/categories`, `/offers`, `/content`, `/features`
- Homepage CMS actions use `/homepage/admin` and `/homepage/:key`
- Operational settings use `/system/config` and `/system/config/:key`

## Auth Flow

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/verify-reset-code`
- `POST /auth/reset-password`
- `GET /auth/me`

Refresh tokens are stored as hashed refresh sessions in the database. Logout revokes the session instead of relying on client-only token disposal.

## Notes

- Payments are intentionally abstracted through the `payments` module for future Stripe or SSLCommerz adapters.
- Product deletion is archive-friendly and marks products as not visible instead of hard-deleting them.
- Category deletion fails when active products still depend on the category.
- Sensitive fields such as `passwordHash` are excluded from API responses.
- The forgot-password endpoint currently returns a development reset code because no email provider has been wired yet.

## Useful Commands

```bash
npm run start:dev
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
