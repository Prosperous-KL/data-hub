.PHONY: build-backend build-frontend build-all

IMAGE_BACKEND=prosperous-data-hub-backend:latest
IMAGE_FRONTEND=prosperous-data-hub-frontend:latest

build-backend:
	docker build -t $(IMAGE_BACKEND) -f backend/Dockerfile backend

build-frontend:
	docker build -t $(IMAGE_FRONTEND) -f frontend/Dockerfile frontend

build-all: build-backend build-frontend
