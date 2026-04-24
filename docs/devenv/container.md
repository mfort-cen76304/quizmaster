# Run in a local Docker/Podman container

## Prerequisites

0. On Windows, make sure you have [WSL2 installed](https://learn.microsoft.com/en-us/windows/wsl/install):

1. One of the following:
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
    - [Podman Desktop](https://podman-desktop.io/)

        Make sure to install Podman Compose, and setup the Podman Machine **rootfull**.

## Create a Dev Environment Container

### VS Code Dev Container (Docker only)

Make sure to have [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) VS Code extension installed.

1. Open a new VS Code window
2. Open View/Command Palette...
3. Find `Clone Repository in Container Volume...`
4. Enter `scrumdojo/quizmaster`

### Create local dev environment manually (Docker / Podman)

Make sure to have [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh) VS Code extension installed.

1. Download `.devcontainer/compose.yaml` from this repo to your computer to a separate directory.
2. Navigate to that directory in terminal
3. Create the dev container:

    ```sh
    # Podman
    podman compose up -d

    # Docker
    docker compose up -d
    ```

4. Open  a new VS Code window
5. Open View/Command Palette...
6. Find `Connect to Host...`
7. Enter `ssh dev@localhost -p 2222`
8. Follow the instructions on the screen. Enter password `dev`
9. Open Terminal in the newly open VS Code.
10. Login to GitHub

    ```sh
    gh auth login
    ```

11. Clone Quizmaster repo

    ```sh
    cd ~/workspace
    git clone https://github.com/scrumdojo/quizmaster
    ```

12. Ask the trainer for `OPENROUTER_API_KEY` and paste it to `.env` file.
