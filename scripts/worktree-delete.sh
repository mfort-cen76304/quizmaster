#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

to_schema_name() {
    echo "${1//-/_}"
}

load_db_config() {
    local props="$root/backend/src/main/resources/application.properties"

    # Extract defaults from application.properties (single source of truth)
    db_host="$(grep -oP 'DB_HOST:\K[^}]+' "$props")"
    db_name="$(grep -oP 'DB_NAME:\K[^}]+' "$props")"
    db_user="$(grep -oP 'DB_USER:\K[^}]+' "$props")"
    db_pass="$(grep -oP 'DB_PASS:\K[^}]+' "$props")"

    # Override with .env values if present
    [ -f "$root/.env" ] || return
    while IFS='=' read -r key value; do
        case "$key" in
            DB_HOST) db_host="$value" ;;
            DB_NAME) db_name="$value" ;;
            DB_USER) db_user="$value" ;;
            DB_PASS) db_pass="$value" ;;
        esac
    done < "$root/.env"
}

drop_schema() {
    local schema="$1"
    echo "Dropping schema '$schema'..."
    PGPASSWORD="$db_pass" psql -h "$db_host" -U "$db_user" -d "$db_name" \
        -c "DROP SCHEMA IF EXISTS \"$schema\" CASCADE;" 2>/dev/null || {
        echo "Warning: Could not drop schema '$schema'. You may need to drop it manually."
    }
}

remove_worktree() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        echo "Error: Worktree directory $dir does not exist."
        exit 1
    fi
    git worktree remove "$dir"
}

delete_branch() {
    local name="$1"
    git branch -D "$name" 2>/dev/null || {
        echo "Warning: Could not delete branch '$name'."
    }
}

# --- Main ---

name="${1:?Usage: worktree-delete.sh <name>}"
worktree_dir="$(cd "$root/.." && pwd)/$name"
schema="$(to_schema_name "$name")"

load_db_config
drop_schema "$schema"
remove_worktree "$worktree_dir"
delete_branch "$name"

echo "Worktree '$name' removed."
