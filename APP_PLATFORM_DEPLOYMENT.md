# DigitalOcean App Platform Deployment

This repository now includes:

- A root `package.json` so the DigitalOcean UI can detect the repo.
- A DigitalOcean App Platform spec at `.do/app.yaml` for the full multi-service app.

## What Changed

- The root repo now contains `.do/app.yaml`, so App Platform can deploy the monorepo from the root.
- The frontend uses `halal-cms-frontend/Dockerfile`.
- Each backend service has a `Dockerfile.app` that builds its JAR inside DigitalOcean from Git.
- The existing droplet Docker Compose files are unchanged.

## Components

- `frontend`: `halal-cms-frontend`, public route `/`, port `80`
- `auth-service`: `halal-cms-backend/auth-service`, internal port `8081`
- `application-service`: `halal-cms-backend/application-service`, internal port `8082`
- `inspection-service`: `halal-cms-backend/inspection-service`, internal port `8083`
- `certificate-service`: `halal-cms-backend/certificate-service`, internal port `8084`
- `company-service`: `halal-cms-backend/company-service`, internal port `8085`
- `qhx-db`: App Platform PostgreSQL database

## Before Production

In `.do/app.yaml`, replace these placeholder secret values in the DigitalOcean UI:

- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `SUPER_ADMIN_PASSWORD`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `DO_SPACES_KEY`
- `DO_SPACES_SECRET`
- `DO_SPACES_BUCKET`

The app spec currently uses one App Platform PostgreSQL database named `halalcms`.
If you need the old five-database separation from Docker Compose, attach an existing
managed PostgreSQL cluster and create those databases manually, then override each
service's `DB_URL`.

## Recommended Full App Creation

The DigitalOcean UI detection step may only detect the root `package.json` first.
For the full frontend + five backend services, create the app from the spec:

```bash
doctl apps create --spec .do/app.yaml
```

Login requires the `auth-service` component to exist in the same App Platform app
as the frontend. If the app only contains the auto-detected root Node/frontend
component, `/api/auth/login` fails because the frontend cannot resolve
`auth-service` on the private network.

## UI Path

1. Push these files to GitHub.
2. In DigitalOcean, create an App from GitHub repo `ttalphine-git/qhx`.
3. Choose branch `main`.
4. If the UI says "No components detected", make sure the latest commit with root `package.json` is selected.
5. Use the detected root component only to get past detection, then review/edit the app spec or manually add all backend components using the source directories listed above.
6. Give DigitalOcean permission to read the repository if prompted.
7. Review the generated components and secrets.
8. Deploy.
