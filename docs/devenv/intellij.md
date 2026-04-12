# Setup IntelliJ IDEA

This setup assumes IntelliJ IDEA Ultimate edition.

## Plugins

Make sure to install the following plugins.

- [Cucumber.js](https://plugins.jetbrains.com/plugin/7418-cucumber-js) for writing and running Cucumber tests
- [Oxc](https://plugins.jetbrains.com/plugin/27061-oxc) for linting and auto-formatting TypeScript code

If you develop in a remote environment (GitHub Codespaces or local Docker/Podman container), install the plugins to host, not client.

## Running Cucumber tests from IDE

When creating a Run configuration for running Cucumber tests directly in your IDE,
make sure you set the working directory to `specs`.
