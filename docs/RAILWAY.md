# Deploy Viễn Du to Railway

The root Dockerfile builds the Vite web app and Fastify API into one service. The API serves the built web files, binds to Railway's `PORT` on `0.0.0.0`, and exposes `/health` for Railway's health check. The image runs database migrations and seeds the topic bank before starting the API.

## Create the backing services

In the same Railway project, create PostgreSQL and Redis services. In the Viễn Du service's variables, add references to their connection URLs. For services named `Postgres` and `Redis`, the references are:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

Use the actual service names if yours differ. These are private service references; keep the connection values in Railway variables and do not add them to `VITE_` variables.

Generate a unique JWT secret locally, then add its output to the Viễn Du service's secret variables as `JWT_SECRET`:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

The launcher requires a PostgreSQL `DATABASE_URL`, a `redis://` or `rediss://` `REDIS_URL`, and a `JWT_SECRET` of at least 32 characters. If any is missing or invalid, startup stops with a configuration error. Production never starts PGlite or creates a local JWT secret.

## Configure and deploy the service

Set Railway's **Root Directory** to `/` so the service builds from the repository root. In the previously frontend-only service, clear any custom **Build Command** and **Start Command**. Old commands such as `npm run build:web` or `npm run preview` bypass the root Dockerfile and its API server. `railway.json` selects the Dockerfile, and the image starts with `npm start`.

The Docker build leaves `VITE_API_URL` blank by default so the web app calls the API on the same origin. If you host the web app separately, set the Railway build variable `VITE_API_URL` to `https://YOUR-API-DOMAIN/api/v1` and rebuild. This value is public and embedded in the web bundle; never put secrets in a `VITE_` variable.

Railway supplies `PORT`. The launcher sets `HOST=0.0.0.0`, `NODE_ENV=production`, and `WEB_DIST_DIR=dist`. `STORAGE_DRIVER=disabled` is the default for this deployment, so document parsing stays in the browser and no S3 bucket or credentials are required. If you explicitly configure another storage driver, the launcher preserves it.

Optionally add `GEMINI_API_KEY` as a secret variable on the Viễn Du service to enable AI-generated quizzes. Keep it server-side; never set it as `VITE_GEMINI_API_KEY`. Static quizzes work without it.

The first deployment and each later container start run `prisma migrate deploy`, seed the topic bank, and then start the API. The `/health` endpoint reports whether PostgreSQL and Redis are reachable. The service becomes healthy only after those dependencies are available.

## Build locally

The same build sequence can be run before deployment:

```bash
npm ci
npm --prefix backend ci
npm run build
```

To build the image locally for same-origin API calls:

```bash
docker build -t viendu .
```
