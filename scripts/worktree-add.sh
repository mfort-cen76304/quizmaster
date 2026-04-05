#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

validate_name() {
    local name="$1"
    if [[ ! "$name" =~ ^[a-zA-Z][a-zA-Z0-9-]*$ ]]; then
        echo "Error: Name must start with a letter and contain only letters, digits, hyphens."
        exit 1
    fi
}

to_schema_name() {
    echo "${1//-/_}"
}

collect_used_ports() {
    used_be_ports=()
    used_fe_ports=()

    for env_file in "$root"/../*/.env; do
        [ -f "$env_file" ] || continue

        while IFS='=' read -r key value; do
            case "$key" in
                BE_PORT) used_be_ports+=("$value") ;;
                FE_PORT) used_fe_ports+=("$value") ;;
            esac
        done < "$env_file"
    done
}

find_available_port() {
    local start="$1"
    shift
    local used=("$@")
    local port="$start"

    while printf '%s\n' "${used[@]}" 2>/dev/null | grep -qx "$port"; do
        ((port++))
    done
    echo "$port"
}

create_worktree() {
    local name="$1"
    local dir="$2"

    if [ -d "$dir" ]; then
        echo "Error: Directory $dir already exists."
        exit 1
    fi

    git worktree add -b "$name" "$dir"
}

write_env() {
    local dir="$1" be_port="$2" fe_port="$3" schema="$4"

    cp "$root/.env" "$dir/.env"
    sed -i "s/^BE_PORT=.*/BE_PORT=$be_port/" "$dir/.env"
    sed -i "s/^FE_PORT=.*/FE_PORT=$fe_port/" "$dir/.env"
    sed -i "s/^DB_SCHEMA=.*/DB_SCHEMA=$schema/" "$dir/.env"
}

install_dependencies() {
    local dir="$1"
    echo "Installing dependencies in worktree..."
    (cd "$dir" && pnpm install:all)
}

# --- Main ---

name="${1:?Usage: worktree-add.sh <name>}"
worktree_dir="$(cd "$root/.." && pwd)/$name"
schema="$(to_schema_name "$name")"

validate_name "$name"
collect_used_ports

be_port="$(find_available_port 8080 "${used_be_ports[@]}")"
fe_port="$(find_available_port 5173 "${used_fe_ports[@]}")"

create_worktree "$name" "$worktree_dir"
write_env "$worktree_dir" "$be_port" "$fe_port" "$schema"
install_dependencies "$worktree_dir"

echo ""
echo "Worktree '$name' created at $worktree_dir"
echo "  BE_PORT=$be_port  FE_PORT=$fe_port  DB_SCHEMA=$schema"
