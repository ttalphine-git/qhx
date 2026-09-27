# DigitalOcean App Platform Deployment

This repository now includes a DigitalOcean App Platform spec at `.do/app.yaml`.
Use that file when creating the app from the repo root.

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

## DigitalOcean Steps

1. Push these files to GitHub.
2. In DigitalOcean, create an App from GitHub repo `ttalphine-git/qhx`.
3. Choose branch `main`.
4. Use the app spec from `.do/app.yaml`.
5. Give DigitalOcean permission to read the repository if prompted.
6. Review the generated components and secrets.
7. Deploy.
