# SmartLib

SmartLib is a full-stack library management system for catalog management, circulation, reservations, fines, acquisitions, inventory, user support, reporting, compliance, and administrative operations.

The repository contains a **TypeScript/Express backend**, a **Next.js 16 frontend**, a **SQLite database managed by Prisma**, and **Redis-backed background-job support through BullMQ**.

## Features

- Book and catalog management
- Circulation, loans, reservations, and returns
- Fines and payment-status management
- Acquisitions and inventory workflows
- Member contributions and recommendations
- Librarian support-ticket management
- Reports, audit logs, health checks, integrations, backups, and compliance tools
- JWT authentication with HTTP-only cookie support
- Swagger/OpenAPI documentation
- Scheduled jobs for overdue-fine processing
- Jest, Supertest, ESLint, TypeScript, and GitHub Actions CI

## Technology Stack

| Area | Technology |
|---|---|
| Backend | Node.js, TypeScript, Express.js |
| Frontend | Next.js 16 App Router, React, Tailwind CSS, Framer Motion |
| Database | SQLite with Prisma ORM and `better-sqlite3` |
| Queue and jobs | BullMQ and Redis |
| Authentication | JWT access and refresh tokens, HTTP-only cookies |
| API documentation | Swagger UI / OpenAPI |
| Testing | Jest and Supertest |
| Deployment helpers | Docker, Docker Compose, PM2 or systemd |

## Repository Layout

```text
librarySys/
├── client/                 # Next.js frontend
│   ├── src/app/            # App Router pages and role-based routes
│   ├── src/components/     # Shared UI components
│   ├── src/lib/api.ts      # Axios API client
│   └── Dockerfile          # Production frontend image
├── prisma/
│   ├── schema.prisma       # Prisma schema
│   └── migrations/         # Database migrations
├── src/
│   ├── config/             # Prisma, Redis, logging, and application config
│   ├── controllers/        # HTTP request handlers
│   ├── middlewares/        # Authentication and error middleware
│   ├── routes/             # Express routes
│   ├── services/           # Application services and scheduled jobs
│   └── server.ts           # Backend entry point
├── docker-compose.yml       # Redis service for local or VPS use
├── package.json             # Backend scripts and dependencies
└── README.md
```

## Prerequisites

For local development or a Linux VPS, install:

- Node.js 20 LTS or newer
- npm 10 or newer
- Git
- Docker Engine and Docker Compose v2 if Redis will run in Docker
- A persistent directory for the SQLite database and backups

The frontend Dockerfile uses Node.js 20 Alpine. Using Node.js 20 LTS for both applications keeps local and production environments consistent.

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/lenoxspider/automated_library.git
cd automated_library
```

### 2. Configure environment variables

Copy the example configuration and replace every placeholder with a real value:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Never commit `.env` or real credentials to Git.

### 3. Install dependencies

Install backend dependencies from the repository root:

```bash
npm ci
```

Install frontend dependencies separately:

```bash
cd client
npm ci
cd ..
```

### 4. Start Redis

The supplied Compose file starts Redis only; it does not start the backend or frontend:

```bash
docker compose up -d redis
```

If Redis is installed directly on the host, make sure it is listening at the address configured by `REDIS_URL`.

### 5. Generate Prisma and apply migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

For local schema development, use `npx prisma migrate dev` only when creating a new migration. Do not use `prisma migrate reset` against a database containing required data.

Optional seed commands are available when demo data is needed:

```bash
npm run seed
npm run seed:books
```

### 6. Start the backend

Development mode watches the TypeScript source:

```bash
npm run dev
```

The backend listens on `PORT`, normally `5000`. Swagger documentation is available at:

```text
http://localhost:5000/api-docs
```

### 7. Start the frontend

Open a second terminal:

```bash
cd client
npm run dev
```

The frontend is normally available at:

```text
http://localhost:3000
```

## Environment Variables

The complete template is in `.env.example`. The most important variables are:

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | Backend listening port |
| `DATABASE_FILE` | `./library.db` | SQLite file used by the runtime Prisma adapter |
| `DATABASE_URL` | `file:./library.db` | SQLite URL used by Prisma CLI and migrations |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection for BullMQ and background jobs |
| `APP_URL` | `http://localhost:3000` | Public frontend URL used by application flows |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Origin permitted by backend CORS configuration |
| `ACCESS_SECRET` | long random value | Access-token signing secret |
| `REFRESH_SECRET` | different long random value | Refresh-token signing secret |
| `SMTP_HOST` | `smtp.office365.com` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | `your-address@example.com` | SMTP username |
| `SMTP_PASS` | `replace-me` | SMTP password or application password |
| `ADMIN_EMAIL` | `admin@example.com` | Administrative notification address |
| `ADMIN_PASSWORD` | `replace-me` | Initial administrative credential where applicable |

For production, use strong randomly generated values for both token secrets, use HTTPS URLs, and replace all example credentials. Never deploy with `ADMIN_PASSWORD=admin123` or another development password.

### SQLite path consistency

The runtime reads `DATABASE_FILE`, while Prisma migrations use `DATABASE_URL`. Set both variables to the same database location. On a VPS, an absolute path is safer:

```dotenv
DATABASE_FILE=/var/lib/smartlib/library.db
DATABASE_URL=file:/var/lib/smartlib/library.db
```

Create the directory and assign it to the service user:

```bash
sudo mkdir -p /var/lib/smartlib
sudo chown -R smartlib:smartlib /var/lib/smartlib
```

Include the SQLite file in the backup plan.

## API Client and Production URLs

The frontend API client is in `client/src/lib/api.ts`. It currently uses `http://localhost:5000/api`, which is suitable for local development but not for an internet-facing deployment. In a visitor's browser, `localhost` refers to the visitor's own computer, not the VPS.

Before publishing, make the API base URL configurable or change it to the public backend URL. A same-domain production arrangement commonly uses `/api` with a reverse proxy. The backend CORS setting must match the public frontend URL:

```dotenv
APP_URL=https://library.example.com
CLIENT_ORIGIN=https://library.example.com
```

## Production Build

### Backend

From the repository root:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

`npm run build` compiles the backend into `dist/`. `npm start` runs `dist/server.js`.

### Frontend

From `client/`:

```bash
npm ci
npm run build
npm start
```

The Next.js production server listens on port `3000` by default.

## Docker Frontend Build

The repository includes `client/Dockerfile` for a standalone Next.js production image:

```bash
cd client
docker build -t smartlib-frontend .
docker run --name smartlib-frontend --restart unless-stopped -p 3000:3000 smartlib-frontend
```

The frontend image does not include the backend or Redis. Run those services separately or create a VPS-specific Compose file that defines all application services.

## Linux VPS Deployment

SmartLib can run on an Ubuntu or Debian VPS. A simple production layout is:

| Service | Internal address | Responsibility |
|---|---|---|
| Nginx or Caddy | `80`/`443` | HTTPS termination and reverse proxy |
| Next.js frontend | `127.0.0.1:3000` | Browser application |
| Express backend | `127.0.0.1:5000` | REST API and Swagger |
| Redis | `127.0.0.1:6379` | BullMQ queue and job state |
| SQLite | Persistent disk | Application data |

A typical VPS setup is:

```bash
sudo apt update
sudo apt install -y git curl nginx
# Install Node.js 20 LTS using a trusted method.
# Install Docker Engine and Compose v2 if Redis will run in Docker.

sudo adduser --system --group smartlib
sudo mkdir -p /opt/smartlib /var/lib/smartlib
sudo chown -R smartlib:smartlib /opt/smartlib /var/lib/smartlib

sudo -u smartlib git clone https://github.com/lenoxspider/automated_library.git /opt/smartlib
cd /opt/smartlib
sudo -u smartlib cp .env.example .env
# Edit /opt/smartlib/.env with production values.

sudo -u smartlib npm ci
cd client
sudo -u smartlib npm ci
cd ..
sudo -u smartlib npx prisma generate
sudo -u smartlib npx prisma migrate deploy
sudo -u smartlib npm run build
sudo -u smartlib npm --prefix client run build

docker compose up -d redis
```

Run the backend and frontend with systemd or PM2 so they restart after failures and reboots. For example, with PM2:

```bash
sudo npm install --global pm2
cd /opt/smartlib
pm2 start dist/server.js --name smartlib-backend --cwd /opt/smartlib
pm2 start npm --name smartlib-frontend --cwd /opt/smartlib/client -- start
pm2 save
pm2 startup
```

Do not expose ports `3000`, `5000`, or `6379` publicly unless there is a specific operational reason. Prefer binding application services to `127.0.0.1` and exposing only Nginx or Caddy on ports `80` and `443`.

### Reverse proxy example

A minimal Nginx server block can route the public frontend and API separately:

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

Enable HTTPS with Certbot or another certificate-management solution. The frontend API client must use the public API URL or `/api`; the current hardcoded `localhost:5000` value must be addressed before using this reverse-proxy arrangement.

## Testing and Quality Checks

Run the backend checks from the repository root:

```bash
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

Run the frontend checks from `client/`:

```bash
npm run build
npm run lint
```

The GitHub Actions workflow in `.github/workflows/ci.yml` runs the repository's CI checks on pushes and pull requests. Review the workflow output for the authoritative result in a clean Linux environment.

## Backups and Operations

SQLite is a file-based database. Stop or quiesce write-heavy jobs before copying the database, keep multiple timestamped backups, and test restoring a backup. Back up the SQLite file and the `.env` configuration through a secure secrets-management process; do not publish `.env` in Git.

Redis should be treated as queue and job state unless the application configuration explicitly relies on its persistence. Keep Redis protected from the public internet and use a password or private network when appropriate.

Useful operational commands include:

```bash
docker compose ps
pm2 logs smartlib-backend
pm2 logs smartlib-frontend
git log -5 --oneline --decorate
git status -sb
```

## Security Checklist

Before exposing SmartLib publicly:

- Replace all sample secrets and passwords.
- Use HTTPS for the frontend, API, SMTP callbacks, and verification links.
- Set `APP_URL` and `CLIENT_ORIGIN` to the real public origin.
- Configure the frontend API base URL for the public deployment.
- Keep Redis and SQLite off the public network.
- Use a dedicated non-root service account.
- Restrict the VPS firewall to SSH, HTTP, and HTTPS as required.
- Back up and protect the SQLite database.
- Keep Node.js, npm packages, the operating system, Docker, and Redis updated.
- Review GitHub Actions after every deployment-related change.

## License

This project is currently maintained as an academic and operational library-system project. Add the project license here when one is formally selected.

## References

- [Node.js documentation](https://nodejs.org/docs/latest/api/)
- [Prisma documentation](https://www.prisma.io/docs)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [Nginx documentation](https://docs.nginx.com/)
