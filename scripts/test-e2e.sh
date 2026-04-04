#!/usr/bin/env bash
set -euo pipefail

port_busy() { (echo >/dev/tcp/localhost/"$1") 2>/dev/null; }

case "${1:-}" in
--dev)
    shift
    if ! port_busy 8080 || ! port_busy 5173; then
        echo "Backend (:8080) and Vite (:5173) must be running."
        echo "Run 'pnpm start' first, or use 'pnpm test:e2e' for a standalone run."
        exit 1
    fi

    pnpm test:e2e:vite -- "$@"
    ;;
--ui)
    shift
    if ! port_busy 8080 || ! port_busy 5173; then
        echo "Backend (:8080) and Vite (:5173) must be running."
        echo "Run 'pnpm start' first."
        exit 1
    fi

    pnpm test:e2e:playwright-ui -- "$@"
    ;;
*)
    if port_busy 8080 || port_busy 5173; then
        echo "Ports 8080 and/or 5173 are in use."
        echo "Stop them first, or use 'pnpm test:e2e:dev' to test against running servers."
        exit 1
    fi

    test_cmd="pnpm test:e2e:be"
    for arg in "$@"; do
        test_cmd+=" $(printf '%q' "$arg")"
    done

    concurrently --kill-others --success first \
        "pnpm build:fe:dev && cd backend && ./gradlew bootRun" \
        "$test_cmd"
    ;;
esac
