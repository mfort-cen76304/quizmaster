# Run in a local Docker/Podman container

## Prerequisites

0. On Windows, make sure you have [WSL2 installed](https://learn.microsoft.com/en-us/windows/wsl/install):

1. One of the following:
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
    - [Podman Desktop](https://podman-desktop.io/)

        Make sure to install Podman Compose, and setup the Podman Machine **rootfull**.

## Create a Dev Environment Container

### Using VS Code / Cursor / Windsurf

Prefer opening the repository directly in a dev container using your IDE via "Dev Containers: Reopen in Container" choosing the right CPU architecture for your OS/Machine.

The devcontainer uses two services via Compose:

- `ghcr.io/scrumdojo/dev-quizmaster:v4` for Java/Node/Playwright development tooling
- `postgres:16` for the database

### Others

To create the development environment from terminal, run one of the following from the repository root:

```sh
# Podman
podman compose -f .devcontainer/compose.yaml up -d

# Docker
docker compose -f .devcontainer/compose.yaml up -d
```

The containers run in the background, so that you can connect from your favorite IDE.

To stop the containers, run on your host OS:

```sh
podman compose -f .devcontainer/compose.yaml stop
# or
docker compose -f .devcontainer/compose.yaml stop
```

To restart, run:

```sh
podman compose -f .devcontainer/compose.yaml start
# or
docker compose -f .devcontainer/compose.yaml start
```
