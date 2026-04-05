#!/usr/bin/env bash
set -euo pipefail

if command -v psql &>/dev/null; then
    echo "psql is already installed."
    exit 0
fi

echo "Installing postgresql-client..."
sudo apt-get update -qq
sudo apt-get install -y -qq postgresql-client
