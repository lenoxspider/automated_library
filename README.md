# SmartLib

SmartLib is a full-stack library management system for catalog management, circulation, reservations, fines, acquisitions, inventory, member services, reporting, compliance, and administration.

The project is organized as a **TypeScript/Express backend**, a **Next.js 16 frontend**, a **PostgreSQL database managed by Prisma**, **Redis-backed background jobs through BullMQ**, and **S3-compatible object storage through MinIO** for book-cover assets.

## Current capabilities

SmartLib models the main workflows of a small library. Members can browse the catalog, manage loans and reservations, view fines, receive recommendations, maintain profiles, review search history, and submit contributions. Librarians can manage circulation, reservations, acquisitions, inventory, catalog synchronization, fines, support tickets, and contribution queues. Administrators can manage users, settings, audit logs, backups, integrations, compliance requests, and system health. Staff can access operational reports.

The backend also contains authentication and verification flows, scheduled processing for library jobs, email queue support, book lookup and cover processing, API documentation, and CI checks.

## Technology stack

| Area | Technology |
|---|---|
| Backend | Node.js 20+, TypeScript, Express 5 |
| Frontend | Next.js 16 App Router, React, Tailwind CSS, Framer Motion |
| Database | PostgreSQL 15 with Prisma ORM and `@prisma/adapter-pg` |
| Background jobs | Redis 7, BullMQ, and scheduled jobs with `node-cron` |
| Object storage | MinIO locally; S3-compatible storage in production |
| Authentication | JWT access and refresh tokens, set as server-side httpOnly/secure/sameSite cookies (Bearer header accepted as a fallback for non-browser clients) |
| API documentation | Swagger UI / OpenAPI at `/api-docs` |
| Testing | Jest, Supertest, ESLint, Prettier, and TypeScript checks |
| Automation | GitHub Actions, Docker Compose, PM2 or systemd |

## Repository layout

```text
librarySys/
├── client/
│   ├── src/app/            # Next.js App Router and role-based pages
│   ├── src/components/     # Shared interface components
│   ├── src/lib/api.ts      # Frontend Axios API client
│   ├── src/store/          # Client state stores
│   └── Dockerfile          # Standalone Next.js production image
├── prisma/
│   ├── schema.prisma       # PostgreSQL Prisma schema
│   └── migrations/         # Versioned database migrations
├── src/
│   ├── config/             # Database, Redis, logging, and application config
│   ├── controllers/        # HTTP request handlers
│   ├── middlewares/        # Authentication, authorization, and error handling
│   ├── routes/             # Express route modules
│   ├── services/           # Business logic, email, covers, jobs, and storage
│   └── server.ts           # Backend entry point
├── .github/workflows/      # Backend and frontend CI pipeline
├── Dockerfile               # Standalone Express/Prisma backend production image
├── docker-compose.yml      # App, PostgreSQL, Redis, and MinIO services
├── package.json            # Backend scripts and dependencies
└── README.md
```

## Prerequisites

Install Node.js 20 LTS or newer, npm, Git, and Docker Engine with Docker Compose v2. Docker Compose is the recommended way to run PostgreSQL, Redis, and MinIO locally because the application expects all three services during normal development.

The frontend Dockerfile uses Node.js 20 Alpine. Using Node.js 20 LTS locally and in production keeps the two application runtimes consistent.

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/lenoxspider/automated_library.git
cd automated_library
```

### 2. Configure environment variables

Create a local environment file from the supplied template:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Review every placeholder before starting the application. Never commit `.env` or real credentials.

### 3. Install dependencies

Install backend dependencies from the repository root and frontend dependencies from `client/`:

```bash
npm ci
cd client
npm ci
cd ..
```

### 4. Start the supporting services

The Compose file starts PostgreSQL, Redis, and MinIO:

```bash
docker compose up -d postgres redis minio
```

The services use these local defaults:

| Service | Address | Local purpose |
|---|---|---|
| PostgreSQL | `localhost:5432` | Application database |
| Redis | `localhost:6379` | BullMQ queues and scheduled-job support |
| MinIO API | `localhost:9000` | S3-compatible book-cover storage |
| MinIO console | `localhost:9001` | Local object-storage administration |

The default PostgreSQL database is `library`, with user `smartlib` and password `password123`. Change these values for any shared or public environment.

### 5. Generate Prisma and apply migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

Use `npx prisma migrate dev` when creating a new development migration. Do not use `prisma migrate reset` against a database containing required data.

Optional seed commands are available for development data:

```bash
npm run seed
npm run seed:books
```

### 6. Start the backend

Run the backend in development mode from the repository root:

```bash
npm run dev
```

The API listens on `PORT`, normally `5000`. Swagger UI is available at:

```text
http://localhost:5000/api-docs
```

### 7. Start the frontend

Open a second terminal:

```bash
cd client
cp .env.example .env
npm run dev
```

`NEXT_PUBLIC_API_BASE_URL` in `client/.env` controls which backend the frontend talks to; it defaults to `http://localhost:5000/api` if unset.

The frontend is normally available at:

```text
http://localhost:3000
```

## Environment configuration

The complete template is `.env.example`. The most important variables are shown below.

| Variable | Local example | Purpose |
|---|---|---|
| `PORT` | `5000` | Backend listening port |
| `DATABASE_URL` | `postgresql://smartlib:password123@localhost:5432/library?schema=public` | PostgreSQL connection used by Prisma and the application |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection for queues and scheduled jobs |
| `APP_URL` | `http://localhost:3000` | Public application URL used in links and verification flows |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Frontend origin permitted by backend CORS |
| `ACCESS_SECRET` | Long random value | JWT access-token signing secret |
| `REFRESH_SECRET` | Different long random value | JWT refresh-token signing secret |
| `SMTP_HOST` | `smtp.office365.com` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | `your-address@example.com` | SMTP username |
| `SMTP_PASS` | `replace-me` | SMTP password or application password |
| `ADMIN_EMAIL` | `admin@example.com` | Administrative email address |
| `ADMIN_PASSWORD` | `replace-me` | Initial administrative password |

### Object-storage variables

The local MinIO service uses development defaults in the storage code. For production S3 or MinIO, set explicit values rather than relying on defaults:

```dotenv
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadminpassword
S3_BUCKET_NAME=book-covers
S3_PUBLIC_URL_PREFIX=http://localhost:9000/book-covers
```

For a public deployment, use a private or HTTPS endpoint as appropriate, rotate access keys, and ensure that the public URL prefix points to the actual object-storage endpoint. Do not expose the MinIO administration console or storage credentials to the browser.

### Production secrets

Replace all example credentials before deployment. In particular, do not use `ADMIN_PASSWORD=admin123`, the sample PostgreSQL password, the default MinIO credentials, or the example JWT secrets in a real environment. Store secrets in the hosting provider’s secret manager or protected service environment rather than in Git.

## Production builds

### Backend

From the repository root:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

`npm run build` performs the TypeScript build. `npm start` runs `dist/server.js`.

### Frontend

From `client/`:

```bash
npm ci
npm run build
npm start
```

The Next.js production server listens on port `3000` by default.

### Backend Docker image

The repository includes a root `Dockerfile` for a standalone Express/Prisma backend production image, using the same multi-stage, non-root pattern as the frontend's:

```bash
docker build -t smartlib-backend .
docker run --name smartlib-backend --restart unless-stopped --env-file .env -p 5000:5000 smartlib-backend
```

Or, to run the whole stack (app + PostgreSQL + Redis + MinIO) together:

```bash
docker compose up -d --build app
```

The `app` service in `docker-compose.yml` overrides `DATABASE_URL`, `REDIS_URL`, and `S3_ENDPOINT` to point at the `postgres`/`redis`/`minio` service names instead of `localhost`, since `.env` is written for host-mode `npm run dev` where those services' ports are published to the host. Apply migrations against the running database with `docker compose exec app npx prisma migrate deploy`.

### Frontend Docker image

The repository includes `client/Dockerfile` for a standalone Next.js production image:

```bash
cd client
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api -t smartlib-frontend .
docker run --name smartlib-frontend --restart unless-stopped -p 3000:3000 smartlib-frontend
```

`NEXT_PUBLIC_API_BASE_URL` is inlined into the client bundle at build time (standard Next.js behavior for `NEXT_PUBLIC_*` vars), so it must be passed as a `--build-arg`, not a `docker run -e`. Omit it to keep the `http://localhost:5000/api` default.

This image contains the frontend only. PostgreSQL, Redis, MinIO, and the Express backend must run as separate services.

## Linux VPS deployment

SmartLib can run on an Ubuntu or Debian VPS. A practical production layout uses Nginx or Caddy as the public HTTPS entry point and keeps application services on localhost or a private Docker network.

| Service | Internal address | Responsibility |
|---|---|---|
| Nginx or Caddy | `80`/`443` | HTTPS termination and reverse proxy |
| Next.js | `127.0.0.1:3000` | Browser application |
| Express | `127.0.0.1:5000` | REST API and Swagger |
| PostgreSQL | `127.0.0.1:5432` or private network | Persistent application data |
| Redis | `127.0.0.1:6379` or private network | Queues and scheduled jobs |
| MinIO/S3 | Private network or managed endpoint | Book-cover objects |

A basic server preparation sequence is:

```bash
sudo apt update
sudo apt install -y git curl nginx
# Install Node.js 20 LTS using a trusted method.
# Install Docker Engine and Compose v2 if Docker will run the services.

sudo adduser --system --group smartlib
sudo mkdir -p /opt/smartlib
sudo chown -R smartlib:smartlib /opt/smartlib

sudo -u smartlib git clone https://github.com/lenoxspider/automated_library.git /opt/smartlib
cd /opt/smartlib
sudo -u smartlib cp .env.example .env
# Edit .env with production database, Redis, storage, SMTP, URL, and secret values.

sudo -u smartlib npm ci
cd client
sudo -u smartlib npm ci
cd ..
sudo -u smartlib npx prisma generate
sudo -u smartlib npx prisma migrate deploy
sudo -u smartlib npm run build
sudo -u smartlib npm --prefix client run build

docker compose up -d postgres redis minio
```

Run the backend and frontend under systemd or PM2 so they restart after failure and reboot. For a small VPS, PM2 can be used as follows:

```bash
sudo npm install --global pm2
cd /opt/smartlib
pm2 start dist/server.js --name smartlib-backend --cwd /opt/smartlib
pm2 start npm --name smartlib-frontend --cwd /opt/smartlib/client -- start
pm2 save
pm2 startup
```

Do not expose PostgreSQL, Redis, or MinIO administration ports to the public internet. Expose only Nginx or Caddy on ports `80` and `443`, and configure HTTPS before enabling real user accounts or email verification.

### Reverse proxy example

A minimal Nginx configuration can route the API and frontend through one public domain:

```nginx
server {
    listen 80;
    server_name library.example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The frontend API client (`client/src/lib/api.ts`) reads its backend URL from `NEXT_PUBLIC_API_BASE_URL`. Set it to the public API URL (or `/api` if proxied under the same origin) before deploying behind this reverse proxy. Set `APP_URL` and `CLIENT_ORIGIN` to the public HTTPS origin.

## Testing and quality checks

Run backend checks from the repository root:

```bash
npx prettier --check src
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

Run frontend checks from `client/`:

```bash
npm run lint
npm run build
```

The workflow in `.github/workflows/ci.yml` runs the backend and frontend checks on pushes and pull requests. The backend CI job starts PostgreSQL and Redis service containers, applies Prisma migrations, runs lint and TypeScript checks, and executes the Jest suite. The frontend CI job installs dependencies and builds the Next.js application.

## Backups and operations

PostgreSQL is the system of record and should be backed up using scheduled logical or physical backups. Test restoration rather than assuming that a backup is usable. MinIO or S3 book-cover objects must be backed up separately from PostgreSQL because the database stores application records while object storage holds the image data.

Redis is used for queue and job support. Protect it from public access and configure persistence or a managed service according to operational requirements. Keep structured logs, monitor health endpoints, and configure alerts for failed background jobs, SMTP failures, database connectivity, and storage errors.

Useful operational commands include:

```bash
docker compose ps
docker compose logs --tail=100 postgres redis minio
pm2 logs smartlib-backend
pm2 logs smartlib-frontend
git log -5 --oneline --decorate
git status -sb
```

## Security checklist

Before exposing SmartLib publicly:

- Replace all sample passwords, secrets, and storage credentials.
- Use HTTPS for the frontend, API, SMTP flows, and verification links.
- Set `APP_URL` and `CLIENT_ORIGIN` to the real public origin.
- Make the frontend API base URL deployment-configurable.
- Keep PostgreSQL, Redis, and MinIO off the public network.
- Use a dedicated non-root service account.
- Restrict the VPS firewall to SSH, HTTP, and HTTPS as required.
- Back up PostgreSQL and object storage independently.
- Review authorization on every administrative, export, backup, compliance, and user-management route.
- Keep Node.js, npm packages, the operating system, Docker, PostgreSQL, Redis, and MinIO updated.
- Review GitHub Actions after deployment-related changes.

## License

SmartLib is currently maintained as an academic and operational library-system project. Add a formal project license when one is selected.

## References

- [Node.js documentation](https://nodejs.org/docs/latest/api/)
- [Prisma documentation](https://www.prisma.io/docs)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [Nginx documentation](https://docs.nginx.com/)
- [MinIO documentation](https://min.io/docs/minio/linux/index.html)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
