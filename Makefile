# Makefile for building and running ETL job images
# Usage examples:
#   make build IMAGE_TAG=latest
#   make push REGISTRY=registry.example.com IMAGE_TAG=$(shell git rev-parse --short HEAD)
#   make run-achat FULL_IMAGE=treasury-etl:latest
#   make run-ventes FULL_IMAGE=treasury-etl:latest NETWORK=treasury_default

DOCKER ?= docker
COMPOSE ?= docker compose

# Image naming
IMAGE_NAME ?= treasury-etl
IMAGE_TAG  ?= latest
# If you set REGISTRY (e.g. REGISTRY=ghcr.io/your-org), images will be tagged with it
REGISTRY   ?=
# Full image reference can be overridden directly by passing FULL_IMAGE=...
ifdef REGISTRY
FULL_IMAGE ?= $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
else
FULL_IMAGE ?= $(IMAGE_NAME):$(IMAGE_TAG)
endif

# Optional network to attach containers to (e.g. a docker-compose project network)
# Example: NETWORK=treasury_default
NETWORK ?=
NETWORK_FLAG := $(if $(NETWORK),--network $(NETWORK),)

.PHONY: help build push run-achat run-ventes compose-build-jobs compose-run-achat compose-run-ventes

help:
	@echo "Available targets:"
	@echo "  build                 - Build single ETL image from Dockerfile.jobs (uses IMAGE_NAME, IMAGE_TAG, REGISTRY)"
	@echo "  push                  - Push built image to REGISTRY (requires REGISTRY to be set)"
	@echo "  run-achat             - Run Achat Importation job in a container using FULL_IMAGE (and optional NETWORK)"
	@echo "  run-ventes            - Run Ventes Locales job in a container using FULL_IMAGE (and optional NETWORK)"
	@echo "  compose-build-jobs    - Build the two job services defined in docker-compose.yml"
	@echo "  compose-run-achat     - Run the achat job via docker compose"
	@echo "  compose-run-ventes    - Run the ventes job via docker compose"
	@echo "\nVariables: IMAGE_NAME, IMAGE_TAG, REGISTRY, FULL_IMAGE, NETWORK"

build:
	$(DOCKER) build -f Dockerfile.jobs -t $(FULL_IMAGE) .

push:
ifndef REGISTRY
	$(error REGISTRY must be set for push target, e.g. make push REGISTRY=ghcr.io/your-org IMAGE_TAG=abcd123)
endif
	$(DOCKER) push $(FULL_IMAGE)

run-achat:
	# Uses .env for credentials (ODOO_*, POSTGRES_*, PGHOST/PGPORT). Attach to NETWORK if provided.
	$(DOCKER) run --rm $(NETWORK_FLAG) --env-file .env $(FULL_IMAGE) \
		python -m etl_jobs.job_achat_importation

run-ventes:
	# Uses .env for credentials (ODOO_*, POSTGRES_*, PGHOST/PGPORT). Attach to NETWORK if provided.
	$(DOCKER) run --rm $(NETWORK_FLAG) --env-file .env $(FULL_IMAGE) \
		python -m etl_jobs.job_ventes_locales

compose-build-jobs:
	$(COMPOSE) build job-achat-importation job-ventes-locales

compose-run-achat:
	$(COMPOSE) run --rm job-achat-importation

compose-run-ventes:
	$(COMPOSE) run --rm job-ventes-locales
