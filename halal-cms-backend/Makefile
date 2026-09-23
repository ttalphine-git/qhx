.PHONY: build docker-build docker-push docker-up docker-down docker-logs deploy dev-up dev-down dev-logs

REGISTRY  ?= registry.digitalocean.com/halalcms
VERSION   ?= latest
MVN       ?= mvn

# ── Local build ───────────────────────────────────────────────────────────────
build:
	$(MVN) package -DskipTests -q

# ── Production Docker Compose ─────────────────────────────────────────────────
docker-build:
	docker compose build

docker-push:
	docker compose push

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# Full production deploy (build images and start)
deploy: docker-build docker-up
	@echo "Deployed. Run 'make docker-logs' to tail logs."

# ── Development Docker Compose ────────────────────────────────────────────────
dev-up:
	docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

# ── Utilities ─────────────────────────────────────────────────────────────────
ps:
	docker compose ps

restart:
	docker compose restart $(SERVICE)
